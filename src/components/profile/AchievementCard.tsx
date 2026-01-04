import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Briefcase, Code, Award, Medal, 
  ExternalLink, Calendar 
} from 'lucide-react';
import type { ProfileAchievement, AchievementType } from '@/types/database';
import { ACHIEVEMENT_TYPE_LABELS } from '@/types/database';

const ACHIEVEMENT_ICONS: Record<AchievementType, React.ComponentType<{ className?: string }>> = {
  hackathon: Trophy,
  internship: Briefcase,
  project: Code,
  certification: Award,
  award: Medal,
};

const ACHIEVEMENT_COLORS: Record<AchievementType, string> = {
  hackathon: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  internship: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  project: 'bg-green-500/10 text-green-600 border-green-500/20',
  certification: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  award: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

interface AchievementCardProps {
  achievement: ProfileAchievement;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function AchievementCard({ 
  achievement, 
  onEdit, 
  onDelete,
  showActions = false 
}: AchievementCardProps) {
  const Icon = ACHIEVEMENT_ICONS[achievement.achievement_type];
  const colorClass = ACHIEVEMENT_COLORS[achievement.achievement_type];

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground">{achievement.title}</h4>
              <Badge variant="outline" className={colorClass}>
                {ACHIEVEMENT_TYPE_LABELS[achievement.achievement_type]}
              </Badge>
              {achievement.year && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {achievement.year}
                </span>
              )}
            </div>
            {achievement.description && (
              <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
            )}
            {achievement.proof_link && (
              <a
                href={achievement.proof_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                View Proof
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {showActions && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}