import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { StartupCard } from '@/components/startup/StartupCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Startup, StartupInterest } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Plus, Rocket, Lightbulb, Users, Heart, ExternalLink } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myStartups, setMyStartups] = useState<Startup[]>([]);
  const [interestedStartups, setInterestedStartups] = useState<Startup[]>([]);
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'founder') {
        fetchFounderData();
      } else {
        fetchTalentData();
      }
    }
  }, [user, profile]);

  const fetchFounderData = async () => {
    // Fetch founder's startups
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

      // Fetch interest counts for each startup
      const counts: Record<string, number> = {};
      for (const startup of startups) {
        const { count } = await supabase
          .from('startup_interests')
          .select('*', { count: 'exact', head: true })
          .eq('startup_id', startup.id);
        counts[startup.id] = count || 0;
      }
      setInterestCounts(counts);
    }
    setLoading(false);
  };

  const fetchTalentData = async () => {
    // Fetch startups the talent is interested in
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
        .map((i: any) => i.startup)
        .filter(Boolean) as Startup[];
      setInterestedStartups(startups);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.role === 'founder' 
              ? 'Manage your startups and connect with talent'
              : 'Track your interests and discover new opportunities'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {profile?.role === 'founder' ? 'Your Startups' : 'Interests'}
              </CardTitle>
              {profile?.role === 'founder' ? (
                <Rocket className="h-4 w-4 text-primary" />
              ) : (
                <Heart className="h-4 w-4 text-primary" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.role === 'founder' ? myStartups.length : interestedStartups.length}
              </div>
            </CardContent>
          </Card>

          {profile?.role === 'founder' && (
            <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Interest
                </CardTitle>
                <Users className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(interestCounts).reduce((a, b) => a + b, 0)}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Role
              </CardTitle>
              {profile?.role === 'founder' ? (
                <Lightbulb className="h-4 w-4 text-warning" />
              ) : (
                <Users className="h-4 w-4 text-success" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{profile?.role}</div>
            </CardContent>
          </Card>
        </div>

        {/* Founder Dashboard */}
        {profile?.role === 'founder' && (
          <div className="space-y-6">
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myStartups.map((startup) => (
                  <StartupCard 
                    key={startup.id} 
                    startup={startup} 
                    interestCount={interestCounts[startup.id]}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Talent Dashboard */}
        {profile?.role === 'talent' && (
          <div className="space-y-6">
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {interestedStartups.map((startup) => (
                  <StartupCard key={startup.id} startup={startup} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
