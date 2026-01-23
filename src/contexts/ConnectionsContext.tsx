import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/database';
import { checkRateLimit, RateLimitError, normalizeError } from '@/lib/security';

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

interface ConnectionsContextType {
    connections: Connection[];
    pendingRequests: Connection[];
    sentRequests: Connection[];
    loading: boolean;
    sendConnectionRequest: (receiverId: string) => Promise<{ success: boolean }>;
    acceptConnection: (connectionId: string) => Promise<void>;
    rejectConnection: (connectionId: string) => Promise<void>;
    removeConnection: (connectionId: string) => Promise<void>;
    getConnectionStatus: (userId: string) => 'none' | 'connected' | 'pending_sent' | 'pending_received';
    getConnectionId: (userId: string) => string | null;
    refetch: () => Promise<void>;
}

const ConnectionsContext = createContext<ConnectionsContextType | null>(null);

export function ConnectionsProvider({ children }: { children: ReactNode }) {
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
    const MIN_FETCH_INTERVAL = 5000; // 5 seconds between fetches (increased for production)

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
                // Filter results client-side
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
    }, [user?.id]); // Only depend on user.id

    // Initial fetch only when user is available
    useEffect(() => {
        if (user?.id) {
            fetchConnections();
        }
    }, [user?.id, fetchConnections]);

    // Real-time subscription with debouncing - only subscribe once
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('connections-global')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'connections',
                    filter: `requester_id=eq.${user.id}`,
                },
                () => {
                    if (debounceTimer.current) {
                        clearTimeout(debounceTimer.current);
                    }
                    debounceTimer.current = setTimeout(fetchConnections, 2000);
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
                    if (debounceTimer.current) {
                        clearTimeout(debounceTimer.current);
                    }
                    debounceTimer.current = setTimeout(fetchConnections, 2000);
                }
            )
            .subscribe();

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchConnections]);

    const sendConnectionRequest = async (receiverId: string): Promise<{ success: boolean }> => {
        if (!user) return { success: false };

        // Prevent self-connection
        if (user.id === receiverId) {
            toast({
                title: 'Error',
                description: 'You cannot connect with yourself.',
                variant: 'destructive',
            });
            return { success: false };
        }

        // Rate limiting
        const rateLimit = await checkRateLimit(user.id, 'connection_request');
        if (!rateLimit.allowed) {
            throw new RateLimitError(rateLimit.resetAt);
        }

        const { error } = await supabase
            .from('connections')
            .upsert(
                {
                    requester_id: user.id,
                    receiver_id: receiverId,
                    status: 'pending',
                },
                { onConflict: 'requester_id,receiver_id' }
            );

        if (error) {
            toast({
                title: 'Error',
                description: normalizeError(error),
                variant: 'destructive',
            });
            return { success: false };
        }

        toast({
            title: 'Connection Request Sent',
            description: 'Your connection request has been sent.',
        });

        // Refetch after a delay
        setTimeout(fetchConnections, 500);
        return { success: true };
    };

    const acceptConnection = async (connectionId: string) => {
        const { error } = await supabase
            .from('connections')
            .update({ status: 'accepted' })
            .eq('id', connectionId);

        if (error) {
            toast({
                title: 'Error',
                description: normalizeError(error),
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Connection Accepted',
            description: 'You are now connected!',
        });
        setTimeout(fetchConnections, 500);
    };

    const rejectConnection = async (connectionId: string) => {
        const { error } = await supabase
            .from('connections')
            .update({ status: 'rejected' })
            .eq('id', connectionId);

        if (error) {
            toast({
                title: 'Error',
                description: normalizeError(error),
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Connection Declined',
            description: 'Connection request declined.',
        });
        setTimeout(fetchConnections, 500);
    };

    const removeConnection = async (connectionId: string) => {
        const { error } = await supabase
            .from('connections')
            .delete()
            .eq('id', connectionId);

        if (error) {
            toast({
                title: 'Error',
                description: normalizeError(error),
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Connection Removed',
            description: 'Connection has been removed.',
        });
        setTimeout(fetchConnections, 500);
    };

    const getConnectionStatus = (userId: string): 'none' | 'connected' | 'pending_sent' | 'pending_received' => {
        const connected = connections.find(
            c => c.requester_id === userId || c.receiver_id === userId
        );
        if (connected) return 'connected';

        const pendingSent = sentRequests.find(c => c.receiver_id === userId);
        if (pendingSent) return 'pending_sent';

        const pendingReceived = pendingRequests.find(c => c.requester_id === userId);
        if (pendingReceived) return 'pending_received';

        return 'none';
    };

    const getConnectionId = (userId: string): string | null => {
        const allConnections = [...connections, ...sentRequests, ...pendingRequests];
        const connection = allConnections.find(
            c => c.requester_id === userId || c.receiver_id === userId
        );
        return connection?.id || null;
    };

    return (
        <ConnectionsContext.Provider
            value={{
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
            }}
        >
            {children}
        </ConnectionsContext.Provider>
    );
}

export function useConnections() {
    const context = useContext(ConnectionsContext);
    if (!context) {
        throw new Error('useConnections must be used within a ConnectionsProvider');
    }
    return context;
}
