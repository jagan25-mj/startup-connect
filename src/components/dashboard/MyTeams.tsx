import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyTeams } from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { STAGE_LABELS, STAGE_COLORS } from '@/types/database';
import { Users, Building2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function MyTeams() {
  const { myTeams, loading } = useMyTeams();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (myTeams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              You haven't joined any teams yet
            </p>
            <Link
              to="/startups"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Explore startups
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          My Teams ({myTeams.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {myTeams.map((membership) => {
          const startup = membership.startup;
          if (!startup) return null;

          return (
            <Link
              key={membership.id}
              to={`/startups/${startup.id}`}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <Avatar className="h-12 w-12 rounded-lg border border-border">
                <AvatarImage src={getAvatarUrl(startup.founder?.avatar_url)} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {getInitials(startup.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {startup.name}
                  </p>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${STAGE_COLORS[startup.stage as keyof typeof STAGE_COLORS]}`}
                  >
                    {STAGE_LABELS[startup.stage as keyof typeof STAGE_LABELS]}
                  </Badge>
                  {membership.role_in_team && (
                    <Badge variant="outline" className="text-xs">
                      {membership.role_in_team}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Joined {formatDistanceToNow(new Date(membership.joined_at), { addSuffix: true })}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
