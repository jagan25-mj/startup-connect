import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/database';

export interface TeamMember {
  id: string;
  startup_id: string;
  user_id: string;
  role_in_team: string | null;
  joined_at: string;
  user?: Profile;
}

export function useTeamMembers(startupId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = useCallback(async () => {
    if (!startupId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('startup_team_members')
      .select(`
        *,
        user:profiles!startup_team_members_user_id_fkey(*)
      `)
      .eq('startup_id', startupId)
      .order('joined_at', { ascending: true });

    if (!error && data) {
      setTeamMembers(data as unknown as TeamMember[]);
    }

    setLoading(false);
  }, [startupId]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Real-time subscription
  useEffect(() => {
    if (!startupId) return;

    const channel = supabase
      .channel(`team-${startupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'startup_team_members',
          filter: `startup_id=eq.${startupId}`,
        },
        () => {
          fetchTeamMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startupId, fetchTeamMembers]);

  const addTeamMember = async (userId: string, roleInTeam?: string) => {
    if (!startupId) return { success: false };

    const { error } = await supabase
      .from('startup_team_members')
      .insert({
        startup_id: startupId,
        user_id: userId,
        role_in_team: roleInTeam || null,
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          variant: 'destructive',
          title: 'Already a member',
          description: 'This person is already on the team.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to add team member.',
        });
      }
      return { success: false };
    }

    toast({
      title: 'Team member added!',
      description: 'The talent has been added to your team.',
    });

    await fetchTeamMembers();
    return { success: true };
  };

  const removeTeamMember = async (memberId: string) => {
    const { error } = await supabase
      .from('startup_team_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove team member.',
      });
      return { success: false };
    }

    toast({
      title: 'Member removed',
      description: 'The team member has been removed.',
    });

    await fetchTeamMembers();
    return { success: true };
  };

  const updateTeamMemberRole = async (memberId: string, roleInTeam: string) => {
    const { error } = await supabase
      .from('startup_team_members')
      .update({ role_in_team: roleInTeam })
      .eq('id', memberId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update role.',
      });
      return { success: false };
    }

    toast({
      title: 'Role updated',
      description: 'Team member role has been updated.',
    });

    await fetchTeamMembers();
    return { success: true };
  };

  const isTeamMember = (userId: string) => {
    return teamMembers.some(m => m.user_id === userId);
  };

  return {
    teamMembers,
    loading,
    addTeamMember,
    removeTeamMember,
    updateTeamMemberRole,
    isTeamMember,
    refetch: fetchTeamMembers,
  };
}

// Hook to get all teams a user belongs to
export function useMyTeams() {
  const { user } = useAuth();
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTeams = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('startup_team_members')
      .select(`
        *,
        startup:startups(
          *,
          founder:profiles!startups_founder_id_fkey(*)
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (!error && data) {
      setMyTeams(data);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('my-teams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'startup_team_members',
        },
        () => {
          fetchMyTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMyTeams]);

  return {
    myTeams,
    loading,
    refetch: fetchMyTeams,
  };
}
