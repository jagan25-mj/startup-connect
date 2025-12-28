import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MatchScore } from './MatchScore';
import { Match, Startup, Profile, STAGE_LABELS } from '@/types/database';
import { Briefcase, MapPin } from 'lucide-react';

interface MatchCardProps {
  match: Match & {
    startup?: Startup & { founder?: Profile };
    talent?: Profile;
  };
  type: 'startup' | 'talent';
}

export function MatchCard({ match, type }: MatchCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (type === 'startup' && match.startup) {
    return (
      <Link to={`/startups/${match.startup.id}`}>
        <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <MatchScore score={match.score} size="sm" showLabel={false} />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold group-hover:text-primary transition-colors truncate">
                  {match.startup.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Briefcase className="h-3 w-3" />
                  <span>{match.startup.industry}</span>
                  <span>•</span>
                  <span>{STAGE_LABELS[match.startup.stage]}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {match.startup.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (type === 'talent' && match.talent) {
    return (
      <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <MatchScore score={match.score} size="sm" showLabel={false} />
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={match.talent.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(match.talent.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{match.talent.full_name}</h4>
              {match.talent.bio && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {match.talent.bio}
                </p>
              )}
              {match.talent.skills && match.talent.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {match.talent.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {match.talent.skills.length > 3 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      +{match.talent.skills.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
