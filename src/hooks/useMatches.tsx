import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Match, Startup, Profile } from '@/types/database';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface MatchWithDetails extends Match {
  startup: Startup & { founder: Profile };
  talent: Profile;
}

const PAGE_SIZE = 10;

export function useMatches() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMatches = useCallback(async () => {
    if (!user || !profile) return;

    setLoading(true);
    setError(null);

    const offset = (page - 1) * PAGE_SIZE;

    try {
      if (profile.role === 'talent') {
        // Get total count first
        const { count } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('talent_id', user.id);

        setTotalCount(count || 0);

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
          .range(offset, offset + PAGE_SIZE - 1);

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

          // Get total count
          const { count } = await supabase
            .from('matches')
            .select('*', { count: 'exact', head: true })
            .in('startup_id', startupIds);

          setTotalCount(count || 0);

          const { data, error } = await supabase
            .from('matches')
            .select(`
              * ,
              startup:startups(*),
              talent:profiles!matches_talent_id_fkey(id, full_name, avatar_url, bio, skills)
            `)
            .in('startup_id', startupIds)
            .order('score', { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

          if (error) throw error;

          if (data) {
            setMatches(data as unknown as MatchWithDetails[]);
          }
        } else {
          setTotalCount(0);
          setMatches([]);
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
  }, [user, profile, page, toast]);

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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches,
    page,
    setPage,
    totalPages,
    totalCount,
    pageSize: PAGE_SIZE,
  };
}

