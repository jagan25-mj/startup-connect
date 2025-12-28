import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvestorInterest, Startup } from '@/types/database';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface InvestorInterestWithStartup extends InvestorInterest {
  startup: Startup;
}

export function useInvestorInterests() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [interests, setInterests] = useState<InvestorInterestWithStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterests = useCallback(async () => {
    if (!user || profile?.role !== 'investor') return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('investor_interests')
        .select(`
          *,
          startup:startups(
            *,
            founder:profiles!startups_founder_id_fkey(id, full_name, avatar_url)
          )
        `)
        .eq('investor_id', user.id);

      if (error) throw error;

      if (data) {
        setInterests(data as InvestorInterestWithStartup[]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch investor interests';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error fetching interests',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  // Real-time subscription for new interests
  useEffect(() => {
    if (!user || profile?.role !== 'investor') return;

    const channel = supabase
      .channel('investor-interests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investor_interests',
          filter: `investor_id=eq.${user.id}`,
        },
        () => {
          fetchInterests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, fetchInterests]);

  return {
    interests,
    loading,
    error,
    refetch: fetchInterests,
  };
}