import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { StartupCard } from '@/components/startup/StartupCard';
import { RecommendedStartups } from '@/components/dashboard/RecommendedStartups';
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { InvestorInterest } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { useInvestorInterests } from '@/hooks/useInvestorInterests';
import { Loader2, Plus, Heart, DollarSign, TrendingUp, ExternalLink } from 'lucide-react';

export default function InvestorDashboard() {
  const { user, profile } = useAuth();
  const { matches, loading: matchesLoading, error: matchesError } = useMatches();
  const { interests, loading: interestsLoading, error: interestsError } = useInvestorInterests();
  const [totalInvestments, setTotalInvestments] = useState(0);

  const loading = matchesLoading || interestsLoading;
  const error = matchesError || interestsError;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96 mb-8" />
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading dashboard</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
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
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover and evaluate investment opportunities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <StatsWidget
            title="Interests"
            value={interests.length}
            icon="heart"
          />
          
          <StatsWidget
            title="Potential Investments"
            value={matches.length}
            icon="dollar"
          />

          <StatsWidget
            title="Avg Match Score"
            value={avgMatchScore > 0 ? `${avgMatchScore}%` : 'N/A'}
            icon="trending"
          />

          <StatsWidget
            title="Portfolio Value"
            value="$0"
            icon="dollar"
            description="Coming soon"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Interests</h2>
                <Button asChild variant="outline">
                  <Link to="/startups">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Browse Startups
                  </Link>
                </Button>
              </div>

              {interests.length === 0 ? (
                <Card className="animate-fade-in">
                  <CardContent className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No investments yet</h3>
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
                  {interests.map((interest) => (
                    <StartupCard 
                      key={interest.id} 
                      startup={interest.startup} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RecommendedStartups />
          </div>
        </div>
      </div>
    </Layout>
  );
}