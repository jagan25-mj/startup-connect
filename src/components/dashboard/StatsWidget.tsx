import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Heart, Rocket, DollarSign } from 'lucide-react';

interface StatsWidgetProps {
  title: string;
  value: number | string;
  description?: string;
  icon: 'trending' | 'users' | 'heart' | 'rocket' | 'dollar';
  trend?: number;
}

export function StatsWidget({ title, value, description, icon, trend }: StatsWidgetProps) {
  const icons = {
    trending: TrendingUp,
    users: Users,
    heart: Heart,
    rocket: Rocket,
    dollar: DollarSign,
  };

  const iconColors = {
    trending: 'text-success bg-success/10',
    users: 'text-accent bg-accent/10',
    heart: 'text-destructive bg-destructive/10',
    rocket: 'text-primary bg-primary/10',
    dollar: 'text-primary bg-primary/10',
  };

  const Icon = icons[icon];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${iconColors[icon]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend !== undefined && (
              <span className={trend >= 0 ? 'text-success' : 'text-destructive'}>
                {trend >= 0 ? '+' : ''}{trend}%{' '}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}