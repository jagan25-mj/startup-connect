import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { StartupCard } from '@/components/startup/StartupCard';
import { RecommendedStartups } from '@/components/dashboard/RecommendedStartups';
import { TopTalentMatches } from '@/components/dashboard/TopTalentMatches';
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Startup, Profile } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { motion } from 'framer-motion';
import { Loader2, Plus, Rocket, Heart, ExternalLink } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { matches } = useMatches();
  const [loading, setLoading] = useState(true);
  const [myStartups, setMyStartups] = useState<Startup[]>([]);
  const [interestedStartups, setInterestedStartups] = useState<Startup[]>([]);
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});
  const [totalInterests, setTotalInterests] = useState(0);

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
      let total = 0;
      for (const startup of startups) {
        const { count } = await supabase
          .from('startup_interests')
          .select('*', { count: 'exact', head: true })
          .eq('startup_id', startup.id);
        counts[startup.id] = count || 0;
        total += count || 0;
      }
      setInterestCounts(counts);
      setTotalInterests(total);
    }
    setLoading(false);
  }, [user]);

  const fetchTalentData = useCallback(async (): Promise<void> => {
    setLoading(true); // Add loading state reset
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
        .map((i: { startup: Omit<Startup, 'founder'> & { founder: { id: string; full_name: string; avatar_url: string | null; } } }) => ({
          ...i.startup,
          founder: i.startup.founder as Profile // Type assertion since structure is compatible
        }))
        .filter(Boolean) as Startup[];
      setInterestedStartups(startups);
    }
    setLoading(false);
  }, [user]);

  // Redirect investors to their investor dashboard
  useEffect(() => {
    if (profile?.role === 'investor') {
      navigate('/investor-dashboard');
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (user && profile && profile.role !== 'investor') {
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
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const avgMatchScore = matches.length > 0 
    ? Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length)
    : 0;

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

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-4 md:grid-cols-4 mb-8"
        >
          <StatsWidget
            title={profile?.role === 'founder' ? 'Your Startups' : 'Interests'}
            value={profile?.role === 'founder' ? myStartups.length : interestedStartups.length}
            icon={profile?.role === 'founder' ? 'rocket' : 'heart'}
          />
          
          {profile?.role === 'founder' && (
            <StatsWidget
              title="Total Interest"
              value={totalInterests}
              icon="users"
              description="from talents"
            />
          )}

          <StatsWidget
            title="Top Matches"
            value={matches.length}
            icon="trending"
          />

          <StatsWidget
            title="Avg Match Score"
            value={avgMatchScore > 0 ? `${avgMatchScore}%` : 'N/A'}
            icon="trending"
          />
        </motion.div>

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
          </motion.div>

          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-6"
          >
            {profile?.role === 'talent' ? (
              <RecommendedStartups />
            ) : (
              <TopTalentMatches />
            )}
          </motion.div>
      </div>
    </Layout>
  );
}