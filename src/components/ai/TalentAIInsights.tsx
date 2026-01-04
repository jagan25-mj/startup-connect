/**
 * Talent AI Insights Component
 * Displays AI-assisted insights for talent evaluating startup opportunities
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
import { Startup, Profile } from '@/types/database';
import { generateTalentInsights, getTalentQuickFit } from '@/lib/ai/talentInsights';
import { AIInsightCard } from './AIInsightCard';
import { Sparkles, CheckCircle2, TrendingUp, Info, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TalentAIInsightsProps {
  talent: Profile;
  startup: Startup;
  matchScore?: number;
  variant?: 'full' | 'compact' | 'badge';
  className?: string;
}

export function TalentAIInsights({
  talent,
  startup,
  matchScore,
  variant = 'full',
  className,
}: TalentAIInsightsProps) {
  const insights = useMemo(
    () => generateTalentInsights(talent, startup, matchScore),
    [talent, startup, matchScore]
  );
  
  const quickFit = useMemo(
    () => getTalentQuickFit(talent, startup, matchScore),
    [talent, startup, matchScore]
  );
  
  if (variant === 'badge') {
    // Minimal badge for startup cards
    if (!quickFit.fills && (!matchScore || matchScore < 70)) {
      return null;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'text-xs gap-1',
                quickFit.fills
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-primary/10 text-primary border-primary/30',
                className
              )}
            >
              <Zap className="h-3 w-3" />
              {quickFit.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px]">
            <p className="text-xs font-medium mb-1">{insights.fitSummary.summary}</p>
            {quickFit.fills && quickFit.skills.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Your skills: {quickFit.skills.join(', ')}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  if (variant === 'compact') {
    // Compact card for startup detail sidebar
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-accent/5 via-card to-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">Why This Fits You</CardTitle>
              </div>
              <TalentDisclaimer size="sm" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              {insights.fitSummary.summary}
            </p>
            
            {/* Why good fit bullets */}
            {insights.whyGoodFit.length > 0 && (
              <ul className="space-y-1.5">
                {insights.whyGoodFit.slice(0, 3).map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{reason}</span>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Impact preview */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-primary">Potential Impact:</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {insights.impactPrediction.summary}
              </p>
            </div>
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
          <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Opportunity Fit Analysis</h3>
            <p className="text-xs text-muted-foreground">
              AI-assisted insights based on your profile
            </p>
          </div>
        </div>
        <TalentDisclaimer />
      </div>
      
      {/* Fit Summary */}
      <AIInsightCard insight={insights.fitSummary} />
      
      {/* Why You're a Good Fit */}
      {insights.whyGoodFit.length > 0 && (
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Why You May Be a Good Fit
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {insights.whyGoodFit.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-success mt-1">•</span>
                  <span className="text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Impact Prediction */}
      <AIInsightCard insight={insights.impactPrediction} />
      
      {/* Transparency notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          This is an AI-assisted suggestion based on available data.
          You decide what's right for your career.
        </p>
      </div>
    </motion.div>
  );
}

// Transparency disclaimer component
function TalentDisclaimer({ size = 'default' }: { size?: 'sm' | 'default' }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'bg-muted/50 border-border/50 cursor-help',
              size === 'sm' ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'
            )}
          >
            <Info className={cn('mr-1', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
            AI-Assisted
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[250px]">
          <p className="text-xs">
            These insights help you evaluate opportunities, but the decision is yours.
            We present data transparently — no hidden algorithms.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
