import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { StartupCard } from '@/components/startup/StartupCard';
import { RecommendedStartups } from '@/components/dashboard/RecommendedStartups';
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { FounderAIInsights } from '@/components/ai/FounderAIInsights';
import { MyTeams } from '@/components/dashboard/MyTeams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Startup, Profile, STAGE_LABELS } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Loader2, Plus, Rocket, Heart, ExternalLink, Users, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myStartups, setMyStartups] = useState<Startup[]>([]);
  const [interestedStartups, setInterestedStartups] = useState<Startup[]>([]);
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});
  const [totalInterests, setTotalInterests] = useState(0);
  const [totalTeamMembers, setTotalTeamMembers] = useState(0);
  const [pitchReportCount, setPitchReportCount] = useState(0);
  const [activeTeams, setActiveTeams] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Define functions with useCallback to prevent redefinition on each render
  const fetchFounderData = useCallback(async (): Promise<void> => {
    const { data: startups, error: startupsError } = await supabase
      .from('startups')
      .select(`
        *,
        founder:profiles!startups_founder_id_fkey(id, full_name, avatar_url)
      `)
      .eq('founder_id', user!.id)
      .order('created_at', { ascending: false });

    if (!startupsError && startups) {
      setMyStartups(startups as unknown as Startup[]);

      const counts: Record<string, number> = {};
      const teams: Record<string, number> = {};
      let total = 0;
      let totalTeam = 0;
      
      for (const startup of startups) {
        // Fetch interest counts
        const { count: interestCount } = await supabase
          .from('startup_interests')
          .select('*', { count: 'exact', head: true })
          .eq('startup_id', startup.id);
        counts[startup.id] = interestCount || 0;
        total += interestCount || 0;

        // Fetch team member counts
        const { count: teamCount } = await supabase
          .from('startup_team_members')
          .select('*', { count: 'exact', head: true })
          .eq('startup_id', startup.id);
        teams[startup.id] = teamCount || 0;
        totalTeam += teamCount || 0;
      }
      setInterestCounts(counts);
      setTeamCounts(teams);
      setTotalInterests(total);
      setTotalTeamMembers(totalTeam);
    }

    // Fetch pitch reports
    const { count: reportCount } = await supabase
      .from('pitch_reports')
      .select('*', { count: 'exact', head: true })
      .eq('startup_id', user!.id);
    setPitchReportCount(reportCount || 0);

    setLoading(false);
  }, [user]);

  const fetchTalentData = useCallback(async (): Promise<void> => {
    setLoading(true);
    const { data: interests, error } = await supabase
      .from('startup_interests')
      .select(`
        startup_id,
        startup:startups(
          *,
          founder:profiles!startups_founder_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('user_id', user!.id);

    if (!error && interests) {
      const startups = interests
        .map((i) => ({
          ...i.startup,
          founder: i.startup.founder as Profile
        }))
        .filter(Boolean) as Startup[];
      setInterestedStartups(startups);
      setMatchesFound(Math.ceil(startups.length * 0.7)); // Estimated matches
    }

    // Fetch talent's team memberships
    const { count: teamCount } = await supabase
      .from('startup_team_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id);
    setActiveTeams(teamCount || 0);

    // Calculate profile completion
    if (profile) {
      let completionScore = 0;
      if (profile.full_name) completionScore += 20;
      if (profile.avatar_url) completionScore += 20;
      if (profile.bio || profile.looking_for) completionScore += 20;
      if (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) completionScore += 20;
      if (profile.github_url || profile.linkedin_url) completionScore += 20;
      setProfileCompletion(Math.min(100, completionScore));
    }

    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'founder') {
        fetchFounderData();
      } else {
        fetchTalentData();
      }
    }
  }, [user, profile, fetchFounderData, fetchTalentData]);

  // Real-time subscription for interests
  useEffect(() => {
    if (!user || profile?.role !== 'founder') return;

    const channel = supabase
      .channel('interests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'startup_interests',
        },
        () => {
          fetchFounderData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, fetchFounderData]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96 mb-8" />
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.role === 'founder'
              ? 'Manage your startups and connect with talent'
              : 'Track your interests and discover new opportunities'}
          </p>
        </motion.div>

        {/* Stats Cards - Founder Dashboard */}
        {profile?.role === 'founder' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid gap-4 md:grid-cols-4 mb-8"
          >
            <StatsWidget
              title="Your Startups"
              value={myStartups.length}
              icon="rocket"
            />
            <StatsWidget
              title="Talent Interests"
              value={totalInterests}
              icon="users"
              description="total interests"
            />
            <StatsWidget
              title="Active Team"
              value={totalTeamMembers}
              icon="users"
              description="team members"
            />
            <StatsWidget
              title="Pitch Reports"
              value={pitchReportCount}
              icon="trending"
              description="evaluations"
            />
          </motion.div>
        )}

        {/* Stats Cards - Talent Dashboard */}
        {profile?.role === 'talent' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid gap-4 md:grid-cols-4 mb-8"
          >
            <StatsWidget
              title="Interests Sent"
              value={interestedStartups.length}
              icon="heart"
            />
            <StatsWidget
              title="Active Teams"
              value={activeTeams}
              icon="users"
            />
            <StatsWidget
              title="Matches Found"
              value={matchesFound}
              icon="rocket"
            />
            <StatsWidget
              title="Profile"
              value={profileCompletion}
              icon="trending"
              description="%"
            />
          </motion.div>
        )}

        {/* Main Content Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Founder Dashboard */}
            {profile?.role === 'founder' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Your Startups</h2>
                  <Button asChild variant="gradient">
                    <Link to="/startups/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New
                    </Link>
                  </Button>
                </div>

                {myStartups.length === 0 ? (
                  <Card className="animate-fade-in">
                    <CardContent className="py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Rocket className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No startups yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first startup and start attracting talent
                      </p>
                      <Button asChild variant="gradient">
                        <Link to="/startups/create">Create Your First Startup</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {myStartups.map((startup) => (
                      <StartupCard
                        key={startup.id}
                        startup={startup}
                        interestCount={interestCounts[startup.id]}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Talent Dashboard */}
            {profile?.role === 'talent' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Your Interests</h2>
                  <Button asChild variant="outline">
                    <Link to="/startups">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Explore Startups
                    </Link>
                  </Button>
                </div>

                {interestedStartups.length === 0 ? (
                  <Card className="animate-fade-in">
                    <CardContent className="py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Heart className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No interests yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Browse startups and express your interest to get started
                      </p>
                      <Button asChild variant="gradient">
                        <Link to="/startups">Explore Startups</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {interestedStartups.map((startup) => (
                      <StartupCard key={startup.id} startup={startup} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Founder AI Insights Card */}
            {profile?.role === 'founder' && myStartups[0] && (
              <FounderAIInsights
                startup={myStartups[0]}
                interestCount={totalInterests}
                variant="card"
              />
            )}
            
            {profile?.role === 'talent' && (
              <>
                <MyTeams />
                <RecommendedStartups />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}