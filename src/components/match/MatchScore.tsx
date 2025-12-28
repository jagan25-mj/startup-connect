import { cn } from '@/lib/utils';

interface MatchScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function MatchScore({ score, size = 'md', showLabel = true }: MatchScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success border-success/30 bg-success/10';
    if (score >= 60) return 'text-primary border-primary/30 bg-primary/10';
    if (score >= 40) return 'text-warning border-warning/30 bg-warning/10';
    return 'text-muted-foreground border-border bg-muted';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Low';
  };

  const sizeClasses = {
    sm: 'h-10 w-10 text-xs',
    md: 'h-14 w-14 text-sm',
    lg: 'h-20 w-20 text-lg',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'rounded-full border-2 flex items-center justify-center font-bold',
          getScoreColor(score),
          sizeClasses[size]
        )}
      >
        {score}%
      </div>
      {showLabel && (
        <span className={cn('text-xs', getScoreColor(score).split(' ')[0])}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
