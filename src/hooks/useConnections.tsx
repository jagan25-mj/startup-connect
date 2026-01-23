import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/database';
// Email notifications disabled for MVP - only in-app notifications active

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  requester?: Profile;
  receiver?: Profile;
}

export function useConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  // Prevent concurrent fetches and implement debouncing
  const isFetching = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchTime = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 2000; // Minimum 2 seconds between fetches

  const fetchConnections = useCallback(async () => {
    if (!user) return;

    // Prevent concurrent fetches
    if (isFetching.current) return;

    // Debounce: skip if fetched recently
    const now = Date.now();
    if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) {
      return;
    }

    isFetching.current = true;
    lastFetchTime.current = now;
    setLoading(true);

    try {
      // SINGLE OPTIMIZED QUERY: Fetch all connections for this user at once
      const { data: allConnections, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(*),
          receiver:profiles!connections_receiver_id_fkey(*)
        `)
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) {
        console.error('Error fetching connections:', error);
        return;
      }

      if (allConnections) {
        // Filter results client-side (much faster than multiple queries)
        const accepted = allConnections.filter(c => c.status === 'accepted');
        const pending = allConnections.filter(
          c => c.status === 'pending' && c.receiver_id === user.id
        );
        const sent = allConnections.filter(
          c => c.status === 'pending' && c.requester_id === user.id
        );

        setConnections(accepted as unknown as Connection[]);
        setPendingRequests(pending as unknown as Connection[]);
        setSentRequests(sent as unknown as Connection[]);
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [user]);

  // Initial fetch only - uses stable user.id reference
  useEffect(() => {
    if (user?.id) {
      fetchConnections();
    }
  }, [user?.id]); // Only re-run when user ID changes, not on every render

  // Real-time subscription with debouncing
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `requester_id=eq.${user.id}`,
        },
        () => {
          // Debounce real-time updates
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
          debounceTimer.current = setTimeout(fetchConnections, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          // Debounce real-time updates
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
          debounceTimer.current = setTimeout(fetchConnections, 1000);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only depend on stable user.id

  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) return { success: false };

    // Prevent self-connection
    if (user.id === receiverId) {
      toast({
        variant: 'destructive',
        title: 'Invalid request',
        description: 'You cannot connect with yourself.',
      });
      return { success: false };
    }

    // Check rate limit
    const { checkRateLimit, RateLimitError, logSecurityEvent } = await import('@/lib/security');
    const rateLimitResult = await checkRateLimit(user.id, 'connection_request');

    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit_exceeded', {
        action: 'connection_request',
        userId: user.id
      });
      toast({
        variant: 'destructive',
        title: 'Too many requests',
        description: `Please wait before sending more connection requests. Try again in ${Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 60000)} minutes.`,
      });
      return { success: false };
    }

    // Use upsert to handle idempotency
    const { error } = await supabase
      .from('connections')
      .upsert({
        requester_id: user.id,
        receiver_id: receiverId,
        status: 'pending',
      }, {
        onConflict: 'requester_id,receiver_id',
        ignoreDuplicates: true,
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          variant: 'destructive',
          title: 'Already connected',
          description: 'A connection request already exists.',
        });
      } else {
        const { normalizeError } = await import('@/lib/security');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: normalizeError(error),
        });
      }
      return { success: false };
    }

    toast({
      title: 'Request sent!',
      description: 'Your connection request has been sent.',
    });
    // Note: Email notifications disabled for MVP - only in-app notifications active

    await fetchConnections();
    return { success: true };
  };

  const acceptConnection = async (connectionId: string) => {
    if (!user) return { success: false };

    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', connectionId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to accept connection.',
      });
      return { success: false };
    }

    toast({
      title: 'Connected!',
      description: 'You are now connected.',
    });
    // Note: Email notifications disabled for MVP - only in-app notifications active

    await fetchConnections();
    return { success: true };
  };

  const rejectConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', connectionId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject connection.',
      });
      return { success: false };
    }

    toast({
      title: 'Request rejected',
      description: 'The connection request has been rejected.',
    });

    await fetchConnections();
    return { success: true };
  };

  const removeConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove connection.',
      });
      return { success: false };
    }

    toast({
      title: 'Connection removed',
      description: 'The connection has been removed.',
    });

    await fetchConnections();
    return { success: true };
  };

  const getConnectionStatus = (userId: string): 'none' | 'pending_sent' | 'pending_received' | 'connected' => {
    if (connections.some(c => c.requester_id === userId || c.receiver_id === userId)) {
      return 'connected';
    }
    if (sentRequests.some(c => c.receiver_id === userId)) {
      return 'pending_sent';
    }
    if (pendingRequests.some(c => c.requester_id === userId)) {
      return 'pending_received';
    }
    return 'none';
  };

  const getConnectionId = (userId: string): string | null => {
    const conn = [...connections, ...sentRequests, ...pendingRequests].find(
      c => c.requester_id === userId || c.receiver_id === userId
    );
    return conn?.id || null;
  };

  return {
    connections,
    pendingRequests,
    sentRequests,
    loading,
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    removeConnection,
    getConnectionStatus,
    getConnectionId,
    refetch: fetchConnections,
  };
}
