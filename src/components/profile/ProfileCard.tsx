import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrustScoreCompact } from '@/components/trust/TrustScore';
import { Lightbulb, Users } from 'lucide-react';
import type { Profile } from '@/types/database';

interface ProfileCardProps {
  profile: Profile;
  showTrustScore?: boolean;
  compact?: boolean;
}

export function ProfileCard({ profile, showTrustScore = true, compact = false }: ProfileCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (compact) {
    return (
      <Link to={`/profile/${profile.id}`} className="block">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
          {showTrustScore && <TrustScoreCompact profile={profile} />}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/profile/${profile.id}`} className="block">
      <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold">{profile.full_name}</h4>
                <Badge
                  variant="secondary"
                  className={profile.role === 'founder'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/10 text-accent'
                  }
                >
                  {profile.role === 'founder' ? (
                    <><Lightbulb className="mr-1 h-3 w-3" /> Founder</>
                  ) : (
                    <><Users className="mr-1 h-3 w-3" /> Talent</>
                  )}
                </Badge>
              </div>
              {profile.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{profile.bio}</p>
              )}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile.skills.slice(0, 3).map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {profile.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{profile.skills.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {showTrustScore && <TrustScoreCompact profile={profile} />}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}