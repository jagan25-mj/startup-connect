import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Match, Startup, Profile } from '@/types/database';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface MatchWithDetails extends Match {
  startup: Startup & { founder: Profile };
  talent: Profile;
}

export function useMatches() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    setError(null);

    try {
      if (profile.role === 'talent') {
        // Fetch matches for talent - startups that match their skills
        const { data, error } = await supabase
          .from('matches')
          .select(`
            *,
            startup:startups(
              * ,
              founder:profiles!startups_founder_id_fkey(id, full_name, avatar_url, skills)
            )
          `)
          .eq('talent_id', user.id)
          .order('score', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (data) {
          setMatches(data as unknown as MatchWithDetails[]);
        }
      } else {
        // Fetch matches for founder - talents that match their startups
        const { data: startups } = await supabase
          .from('startups')
          .select('id')
          .eq('founder_id', user.id);

        if (startups && startups.length > 0) {
          const startupIds = startups.map((s) => s.id);
          
          const { data, error } = await supabase
            .from('matches')
            .select(`
              * ,
              startup:startups(*),
              talent:profiles!matches_talent_id_fkey(id, full_name, avatar_url, bio, skills)
            `)
            .in('startup_id', startupIds)
            .order('score', { ascending: false })
            .limit(20);

          if (error) throw error;

          if (data) {
            setMatches(data as unknown as MatchWithDetails[]);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch matches';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error fetching matches',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Real-time subscription for new matches
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMatches]);

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches,
  };
}
