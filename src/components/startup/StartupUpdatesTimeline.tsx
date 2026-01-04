import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Clock, TrendingUp, Target, Users, Play } from 'lucide-react';
import type { StartupUpdate, UpdateTag } from '@/types/database';
import { UPDATE_TAG_LABELS, UPDATE_TAG_COLORS } from '@/types/database';

interface StartupUpdatesTimelineProps {
  startupId: string;
}

const TagIcon = ({ tag }: { tag: UpdateTag }) => {
  switch (tag) {
    case 'milestone':
      return <Target className="h-4 w-4" />;
    case 'looking_for_talent':
      return <Users className="h-4 w-4" />;
    default:
      return <TrendingUp className="h-4 w-4" />;
  }
};

export function StartupUpdatesTimeline({ startupId }: StartupUpdatesTimelineProps) {
  const { data: updates, isLoading } = useQuery({
    queryKey: ['startup-updates', startupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('startup_updates')
        .select('*')
        .eq('startup_id', startupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StartupUpdate[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Progress Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-3 w-3 rounded-full mt-2" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!updates || updates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Progress Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No updates yet</p>
            <p className="text-sm">Progress updates will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Progress Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-6">
            {updates.map((update, index) => (
              <div key={update.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10">
                  <div
                    className={`h-3 w-3 rounded-full border-2 ${
                      update.tag === 'looking_for_talent'
                        ? 'bg-accent border-accent'
                        : update.tag === 'milestone'
                        ? 'bg-success border-success'
                        : 'bg-primary border-primary'
                    }`}
                  />
                </div>

                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-medium">{update.title}</h4>
                    {update.tag && (
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center gap-1 ${UPDATE_TAG_COLORS[update.tag]}`}
                      >
                        <TagIcon tag={update.tag} />
                        {UPDATE_TAG_LABELS[update.tag]}
                      </Badge>
                    )}
                  </div>

                  {update.description && (
                    <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                      {update.description}
                    </p>
                  )}

                  {/* Media Display */}
                  {update.media_url && (
                    <div className="my-3 rounded-lg overflow-hidden border border-border">
                      {update.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                        <video
                          src={update.media_url}
                          controls
                          className="w-full max-h-64 object-contain bg-muted"
                        />
                      ) : (
                        <img
                          src={update.media_url}
                          alt={update.title}
                          className="w-full max-h-64 object-contain bg-muted"
                        />
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}