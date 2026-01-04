import { useState, useEffect, useCallback } from 'react';
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

  const fetchConnections = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    // Fetch accepted connections
    const { data: accepted, error: acceptedError } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(*),
        receiver:profiles!connections_receiver_id_fkey(*)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!acceptedError && accepted) {
      setConnections(accepted as unknown as Connection[]);
    }

    // Fetch pending requests received
    const { data: pending, error: pendingError } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(*),
        receiver:profiles!connections_receiver_id_fkey(*)
      `)
      .eq('status', 'pending')
      .eq('receiver_id', user.id);

    if (!pendingError && pending) {
      setPendingRequests(pending as unknown as Connection[]);
    }

    // Fetch sent requests
    const { data: sent, error: sentError } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(*),
        receiver:profiles!connections_receiver_id_fkey(*)
      `)
      .eq('status', 'pending')
      .eq('requester_id', user.id);

    if (!sentError && sent) {
      setSentRequests(sent as unknown as Connection[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Real-time subscription
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
        },
        () => {
          fetchConnections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConnections]);

  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) return { success: false };

    const { error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        receiver_id: receiverId,
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          variant: 'destructive',
          title: 'Already connected',
          description: 'A connection request already exists.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to send connection request.',
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
