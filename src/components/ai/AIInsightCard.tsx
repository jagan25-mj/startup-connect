/**
 * AI Insight Card Component
 * Reusable card for displaying individual AI insights with transparency
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AIInsight, getConfidenceLabel } from '@/lib/ai/types';
import {
  Brain,
  Sparkles,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  brain: Brain,
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  target: Target,
  trending: TrendingUp,
  users: Users,
};

const CONFIDENCE_STYLES = {
  high: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-border',
};

interface AIInsightCardProps {
  insight: AIInsight;
  compact?: boolean;
  className?: string;
}

export function AIInsightCard({ insight, compact = false, className }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON_MAP[insight.icon || 'sparkles'];
  
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50',
          className
        )}
      >
        <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{insight.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {insight.summary}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn('text-[10px] px-1.5', CONFIDENCE_STYLES[insight.confidence])}
              >
                {insight.confidence}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px]">
              <p className="text-xs">{getConfidenceLabel(insight.confidence)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base font-medium">{insight.title}</CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', CONFIDENCE_STYLES[insight.confidence])}
                  >
                    {insight.confidence}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">{getConfidenceLabel(insight.confidence)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground">{insight.summary}</p>
          
          {/* Expandable reasoning section */}
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              <Info className="h-3 w-3 mr-1" />
              Why this suggestion?
              {expanded ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </Button>
            
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground pl-4">
                    {insight.reasoning.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface AIInsightListProps {
  insights: AIInsight[];
  compact?: boolean;
  className?: string;
}

export function AIInsightList({ insights, compact = false, className }: AIInsightListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {insights.map((insight, idx) => (
        <AIInsightCard
          key={insight.id}
          insight={insight}
          compact={compact}
        />
      ))}
    </div>
  );
}
