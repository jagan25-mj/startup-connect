import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    MatchAnalysis,
    getMatchQuality,
    analyzeProfileStartupMatch
} from '@/lib/aiMatchingEngine';
import { Profile, Startup } from '@/types/database';
import {
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    Briefcase,
    TrendingUp,
    Lightbulb,
    Target,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchAnalysisCardProps {
    startup: Startup;
    candidate: Profile;
    existingTeamSkills?: string[];
    compact?: boolean;
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
}

function getProgressColor(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
}

export function MatchAnalysisCard({
    startup,
    candidate,
    existingTeamSkills = [],
    compact = false
}: MatchAnalysisCardProps) {
    const analysis = useMemo(
        () => analyzeProfileStartupMatch(startup, candidate, existingTeamSkills),
        [startup, candidate, existingTeamSkills]
    );

    const quality = getMatchQuality(analysis.compatibilityScore);

    if (compact) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                        <Sparkles className={cn('h-4 w-4', getScoreColor(analysis.compatibilityScore))} />
                        <span className={cn('text-sm font-semibold', getScoreColor(analysis.compatibilityScore))}>
                            {analysis.compatibilityScore}%
                        </span>
                        <span className="text-xs text-muted-foreground">AI Match</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <p className="font-medium">{quality.emoji} {quality.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{analysis.fitSummary}</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Card className="animate-slide-up overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Match Analysis
                    <Badge variant="outline" className="ml-auto text-xs">
                        Powered by AI
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {/* Compatibility Score */}
                <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-4xl font-bold mb-1">
                        <span className={getScoreColor(analysis.compatibilityScore)}>
                            {analysis.compatibilityScore}
                        </span>
                        <span className="text-lg text-muted-foreground">/100</span>
                    </div>
                    <div className={cn('text-sm font-medium', getScoreColor(analysis.compatibilityScore))}>
                        {quality.emoji} {quality.label}
                    </div>
                    <div className="mt-2 relative h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className={cn('h-full transition-all duration-500', getProgressColor(analysis.compatibilityScore))}
                            style={{ width: `${analysis.compatibilityScore}%` }}
                        />
                    </div>
                </div>

                {/* Fit Summary */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.fitSummary}
                </p>

                {/* Strengths */}
                {analysis.strengths.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Strengths
                        </div>
                        <ul className="space-y-1">
                            {analysis.strengths.map((strength, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-green-500 mt-1">•</span>
                                    {strength}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Risks */}
                {analysis.risks.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            Risks / Gaps
                        </div>
                        <ul className="space-y-1">
                            {analysis.risks.map((risk, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-amber-500 mt-1">•</span>
                                    {risk}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recommended Role */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Recommended Role
                    </div>
                    <div className="text-base font-semibold text-primary">
                        {analysis.recommendedRole.title}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {analysis.recommendedRole.responsibility}
                    </p>
                </div>

                {/* Skills Coverage */}
                <div className="flex flex-wrap gap-2">
                    {analysis.skillGapsCovered.map((skill) => (
                        <Badge key={skill} className="bg-green-500/10 text-green-600 border-green-500/30">
                            ✓ {skill}
                        </Badge>
                    ))}
                    {analysis.skillGapsRemaining.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-muted-foreground">
                            ○ {skill}
                        </Badge>
                    ))}
                </div>

                {/* Team Impact */}
                <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Team Impact Prediction
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {analysis.teamImpactPrediction}
                    </p>
                </div>

                {/* Strategic Insight */}
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-600 mb-1">
                        <Lightbulb className="h-4 w-4" />
                        Strategic Insight
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {analysis.optionalInsight}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// Compact badge version for lists
export function MatchScoreBadge({
    startup,
    candidate
}: {
    startup: Startup;
    candidate: Profile;
}) {
    const analysis = useMemo(
        () => analyzeProfileStartupMatch(startup, candidate),
        [startup, candidate]
    );

    const quality = getMatchQuality(analysis.compatibilityScore);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge
                    className={cn(
                        'gap-1 cursor-help',
                        analysis.compatibilityScore >= 80 ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                            analysis.compatibilityScore >= 60 ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                                analysis.compatibilityScore >= 40 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                                    'bg-red-500/10 text-red-600 border-red-500/30'
                    )}
                    variant="outline"
                >
                    <Sparkles className="h-3 w-3" />
                    {analysis.compatibilityScore}% Match
                </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
                <div className="space-y-2">
                    <p className="font-semibold">{quality.emoji} {quality.label}</p>
                    <p className="text-xs">{analysis.fitSummary}</p>
                    {analysis.strengths.length > 0 && (
                        <p className="text-xs text-green-400">✓ {analysis.strengths[0]}</p>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
