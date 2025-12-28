import { HelpCircle, Award, Building, TrendingUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface MatchScoreBreakdownProps {
  score: number;
  skillMatch?: number;
  industryMatch?: number;
  stageBonus?: number;
}

/**
 * Match Score Breakdown Component
 * Shows detailed breakdown of match score with tooltips explaining each factor
 */
export function MatchScoreBreakdown({
  score,
  skillMatch = 0,
  industryMatch = 0,
  stageBonus = 0,
}: MatchScoreBreakdownProps) {
  // Calculate percentages based on max points
  const skillPercentage = (skillMatch / 50) * 100;
  const industryPercentage = (industryMatch / 30) * 100;
  const stagePercentage = (stageBonus / 20) * 100;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            <span className="font-semibold text-lg">{score}%</span>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-80 p-4">
          <div className="space-y-3">
            <div>
              <p className="font-semibold mb-2">Match Score Breakdown</p>
              <p className="text-xs text-muted-foreground mb-3">
                This score is calculated based on three key factors:
              </p>
            </div>

            {/* Skill Match */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">Skills Alignment</span>
                </div>
                <span className="text-muted-foreground">
                  {skillMatch}/50 pts
                </span>
              </div>
              <Progress value={skillPercentage} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                Based on overlapping skills between talent and startup needs
              </p>
            </div>

            {/* Industry Match */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-accent" />
                  <span className="font-medium">Industry Relevance</span>
                </div>
                <span className="text-muted-foreground">
                  {industryMatch}/30 pts
                </span>
              </div>
              <Progress value={industryPercentage} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                How well your expertise matches the startup's industry
              </p>
            </div>

            {/* Stage Bonus */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  <span className="font-medium">Stage Fit</span>
                </div>
                <span className="text-muted-foreground">
                  {stageBonus}/20 pts
                </span>
              </div>
              <Progress value={stagePercentage} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                Bonus points for startups in stages that need more help
              </p>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Total Match Score</span>
                <span className="text-primary">{score}%</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
