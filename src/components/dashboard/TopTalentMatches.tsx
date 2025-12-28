import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchCard } from '@/components/match/MatchCard';
import { useMatches } from '@/hooks/useMatches';
import { Users } from 'lucide-react';

export function TopTalentMatches() {
  const { matches, loading } = useMatches();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-accent" />
            Top Talent Matches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-accent" />
            Top Talent Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">
              Create a startup to see matched talents
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group matches by startup for founders
  const matchesByStartup = matches.reduce((acc, match) => {
    const startupId = match.startup_id;
    if (!acc[startupId]) {
      acc[startupId] = [];
    }
    acc[startupId].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-accent" />
          Top Talent Matches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.slice(0, 5).map((match) => (
          <MatchCard key={match.id} match={match} type="talent" />
        ))}
      </CardContent>
    </Card>
  );
}
