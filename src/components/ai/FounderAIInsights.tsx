/**
 * Founder AI Insights Panel
 * Displays AI-assisted insights for startup founders
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Startup } from '@/types/database';
import { generateFounderInsights } from '@/lib/ai/founderInsights';
import { AIInsightCard, AIInsightList } from './AIInsightCard';
import { Brain, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FounderAIInsightsProps {
  startup: Startup;
  interestedTalentSkills?: string[];
  interestCount?: number;
  variant?: 'full' | 'compact' | 'card';
  className?: string;
}

export function FounderAIInsights({
  startup,
  interestedTalentSkills = [],
  interestCount = 0,
  variant = 'full',
  className,
}: FounderAIInsightsProps) {
  const insights = useMemo(
    () => generateFounderInsights(startup, interestedTalentSkills, interestCount),
    [startup, interestedTalentSkills, interestCount]
  );
  
  if (variant === 'card') {
    // Compact card for dashboard
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={className}
      >
        <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-card to-accent/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
              </div>
              <AIDisclaimer />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {insights.healthSummary.summary}
            </p>
            {insights.nextActions[0] && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-primary">
                  💡 {insights.nextActions[0].title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {insights.nextActions[0].summary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  if (variant === 'compact') {
    // Compact view for sidebar
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-card to-accent/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">AI-Assisted Insights</CardTitle>
              </div>
              <AIDisclaimer />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <AIInsightCard insight={insights.healthSummary} compact />
            {insights.nextActions.slice(0, 2).map((action) => (
              <AIInsightCard key={action.id} insight={action} compact />
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  // Full panel view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-4', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI-Assisted Insights</h3>
            <p className="text-xs text-muted-foreground">
              Personalized suggestions based on your startup data
            </p>
          </div>
        </div>
        <AIDisclaimer />
      </div>
      
      {/* Health Summary */}
      <AIInsightCard insight={insights.healthSummary} />
      
      {/* Next Actions */}
      {insights.nextActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Suggested Next Steps
          </h4>
          <AIInsightList insights={insights.nextActions} />
        </div>
      )}
      
      {/* Hiring Priority */}
      {insights.hiringPriority && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Hiring Priority
          </h4>
          <AIInsightCard insight={insights.hiringPriority} />
        </div>
      )}
    </motion.div>
  );
}

// Transparency disclaimer component
function AIDisclaimer() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 bg-muted/50 border-border/50 cursor-help"
          >
            <Info className="h-3 w-3 mr-1" />
            AI-Assisted
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[250px]">
          <p className="text-xs">
            These insights are generated using platform data to assist your decisions.
            They are suggestions, not automated actions — you're always in control.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
