import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Rocket, TrendingUp, Users, Sparkles } from 'lucide-react';
import type { StartupUpdate, Startup, Profile, UpdateTag } from '@/types/database';
import { UPDATE_TAG_LABELS, UPDATE_TAG_COLORS } from '@/types/database';

interface ActivityItem {
  id: string;
  type: 'startup_created' | 'startup_update' | 'new_interest';
  title: string;
  description: string;
  startup: Startup & { founder?: Profile };
  tag?: UpdateTag | null;
  media_url?: string | null;
  created_at: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}

const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
  switch (type) {
    case 'startup_created':
      return <Rocket className="h-4 w-4 text-primary" />;
    case 'startup_update':
      return <TrendingUp className="h-4 w-4 text-success" />;
    case 'new_interest':
      return <Users className="h-4 w-4 text-accent" />;
    default:
      return <Sparkles className="h-4 w-4 text-muted-foreground" />;
  }
};

export function ActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const items: ActivityItem[] = [];

      // Fetch recent startups (created in last 7 days)
      const { data: recentStartups } = await supabase
        .from('startups')
        .select(`
          *,
          founder:profiles!startups_founder_id_fkey(id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentStartups) {
        recentStartups.forEach((startup) => {
          items.push({
            id: `startup-${startup.id}`,
            type: 'startup_created',
            title: `${startup.name} was created`,
            description: startup.description.slice(0, 100) + (startup.description.length > 100 ? '...' : ''),
            startup: startup as Startup & { founder?: Profile },
            created_at: startup.created_at,
          });
        });
      }

      // Fetch recent startup updates
      const { data: recentUpdates } = await supabase
        .from('startup_updates')
        .select(`
          *,
          startup:startups(
            *,
            founder:profiles!startups_founder_id_fkey(id, full_name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentUpdates) {
        recentUpdates.forEach((update: any) => {
          if (update.startup) {
            items.push({
              id: `update-${update.id}`,
              type: 'startup_update',
              title: update.title,
              description: update.description?.slice(0, 100) + (update.description?.length > 100 ? '...' : '') || '',
              startup: update.startup as Startup & { founder?: Profile },
              tag: update.tag as UpdateTag | null,
              media_url: update.media_url as string | null,
              created_at: update.created_at,
            });
          }
        });
      }

      // Sort all items by created_at
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return items.slice(0, 15);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm">Activity will appear here as startups are created and updated.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={`/startups/${activity.startup.id}`}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="relative">
              <Avatar className="h-10 w-10 border border-border group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                <AvatarImage src={getAvatarUrl(activity.startup.founder?.avatar_url)} />
                <AvatarFallback className="text-xs bg-muted">
                  {activity.startup.founder?.full_name ? getInitials(activity.startup.founder.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background border border-border">
                <ActivityIcon type={activity.type} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  {activity.title}
                </p>
                {activity.tag && (
                  <Badge variant="outline" className={`text-xs ${UPDATE_TAG_COLORS[activity.tag]}`}>
                    {UPDATE_TAG_LABELS[activity.tag]}
                  </Badge>
                )}
              </div>
              
              {activity.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {activity.description}
                </p>
              )}

              {/* Media Preview Thumbnail */}
              {activity.media_url && (
                <div className="mt-2 rounded-md overflow-hidden border border-border w-fit max-w-[200px]">
                  {activity.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                    <div className="relative">
                      <video
                        src={activity.media_url}
                        className="w-full h-20 object-cover bg-muted"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="p-1.5 rounded-full bg-white/90">
                          <svg className="w-3 h-3 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={activity.media_url}
                      alt=""
                      className="w-full h-20 object-cover"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {activity.startup.name}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}