import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Startup } from '@/types/database';
import { calculateSkillGap, getCompletionMessage } from '@/lib/skillGap';
import { Users, AlertCircle, CheckCircle2, Lightbulb, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamHealthProps {
    startup: Startup;
    interestedTalentSkills?: string[];
    compact?: boolean;
}

function getHealthColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-blue-500';
    if (percentage >= 40) return 'text-amber-500';
    return 'text-red-500';
}

function getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
}

export function TeamHealth({ startup, interestedTalentSkills = [], compact = false }: TeamHealthProps) {
    const analysis = useMemo(
        () => calculateSkillGap(startup, interestedTalentSkills),
        [startup, interestedTalentSkills]
    );

    const message = getCompletionMessage(analysis.completionPercentage, analysis.suggestedRoles);

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                            <Users className={cn('h-4 w-4', getHealthColor(analysis.completionPercentage))} />
                            <span className={cn('text-sm font-medium', getHealthColor(analysis.completionPercentage))}>
                                {analysis.completionPercentage}%
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Team Completeness: {analysis.completionPercentage}%</p>
                        {analysis.missingSkills.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Missing: {analysis.missingSkills.slice(0, 3).join(', ')}
                            </p>
                        )}
                    </TooltipContent>
                </Tooltip>
            </div>
        );
    }

    return (
        <Card className="animate-slide-up">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Team Health
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Skill Coverage</span>
                        <span className={cn('text-sm font-semibold', getHealthColor(analysis.completionPercentage))}>
                            {analysis.completionPercentage}%
                        </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className={cn('h-full transition-all duration-500', getProgressColor(analysis.completionPercentage))}
                            style={{ width: `${analysis.completionPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Message */}
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                    {message}
                </p>

                {/* Missing Skills */}
                {analysis.missingSkills.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            Missing Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {analysis.missingSkills.map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="outline"
                                    className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs"
                                >
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Covered Skills */}
                {analysis.teamSkills.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Team Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {analysis.teamSkills.slice(0, 8).map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="outline"
                                    className="bg-green-500/10 text-green-600 border-green-500/30 text-xs"
                                >
                                    {skill}
                                </Badge>
                            ))}
                            {analysis.teamSkills.length > 8 && (
                                <Badge variant="outline" className="text-xs">
                                    +{analysis.teamSkills.length - 8} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Suggested Roles */}
                {analysis.suggestedRoles.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Suggested Hires
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {analysis.suggestedRoles.slice(0, 4).map((role) => (
                                <Badge
                                    key={role}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    {role}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Badge component to show when a talent fills a skill gap
export function FillsSkillGapBadge({ matchedSkills }: { matchedSkills: string[] }) {
    if (matchedSkills.length === 0) return null;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white gap-1 cursor-help">
                    <CheckCircle2 className="h-3 w-3" />
                    Fills Key Gap
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-medium">You match needed skills:</p>
                <p className="text-xs">{matchedSkills.join(', ')}</p>
            </TooltipContent>
        </Tooltip>
    );
}
