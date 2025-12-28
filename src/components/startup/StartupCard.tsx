import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Startup, STAGE_LABELS, STAGE_COLORS } from '@/types/database';
import { Building2, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MatchScoreBreakdown } from '@/components/match/MatchScoreBreakdown';

interface StartupCardProps {
  startup: Startup;
  interestCount?: number;
  matchScore?: number;
}

export function StartupCard({ startup, interestCount, matchScore }: StartupCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link to={`/startups/${startup.id}`}>
      <Card className="group h-full overflow-hidden border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {startup.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{startup.industry}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={STAGE_COLORS[startup.stage]} variant="secondary">
                {STAGE_LABELS[startup.stage]}
              </Badge>
              {matchScore !== undefined && matchScore > 0 && (
                <MatchScoreBreakdown score={matchScore} />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {startup.description}
          </p>
        </CardContent>

        <CardFooter className="pt-0 border-t border-border/50">
          <div className="flex items-center justify-between w-full pt-4">
            <div className="flex items-center gap-2">
              {startup.founder && (
                <>
                  <Avatar className="h-7 w-7 border border-border">
                    <AvatarImage src={startup.founder.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                      {getInitials(startup.founder.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                    {startup.founder.full_name}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {typeof interestCount === 'number' && (
                <span className="text-primary font-medium">
                  {interestCount} interested
                </span>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(startup.created_at), { addSuffix: true })}
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
