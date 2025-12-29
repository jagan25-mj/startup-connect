import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Heart, Rocket, DollarSign } from 'lucide-react';
import { Counter } from '@/components/ui/Counter';

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
    rocket: 'text-primary bg-gradient-to-br from-primary to-primary/80',
    dollar: 'text-primary bg-gradient-to-br from-primary to-primary/80',
  };

  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="transition-all duration-300"
    >
      <Card className="relative overflow-hidden border-border/50 bg-card/70 backdrop-blur-sm hover:bg-card/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${iconColors[icon]} transition-all duration-300`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold text-foreground">
            <Counter 
              value={typeof value === 'number' ? value : 0} 
              duration={1000} 
              className="font-bold text-2xl"
              suffix={typeof value === 'string' && isNaN(Number(value)) ? value.replace(/\d/g, '') : ''}
            />
          </div>
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
    </motion.div>
  );
}