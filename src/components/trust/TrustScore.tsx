import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Profile } from '@/types/database';
import { cn } from '@/lib/utils';
import { Shield, Info } from 'lucide-react';

interface TrustScoreProps {
    profile: Profile;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

// Calculate trust score based on available profile data
function calculateTrustScore(profile: Profile): number {
    let score = 0;
    
    // Profile completeness (40 points)
    if (profile.full_name && profile.full_name.length > 2) score += 10;
    if (profile.bio && profile.bio.length > 20) score += 15;
    if (profile.skills && profile.skills.length > 0) score += 15;
    
    // Avatar (10 points)
    if (profile.avatar_url) score += 10;
    
    // Account age (30 points)
    score += getAccountAgePoints(profile.created_at);
    
    // Base activity score (20 points for having a profile)
    score += 20;
    
    return Math.min(100, score);
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-muted-foreground';
}

function getScoreRingColor(score: number): string {
    if (score >= 80) return 'stroke-green-500';
    if (score >= 60) return 'stroke-blue-500';
    if (score >= 40) return 'stroke-amber-500';
    return 'stroke-muted-foreground';
}

function getScoreLabel(score: number): string {
    if (score >= 80) return 'Highly Trusted';
    if (score >= 60) return 'Trusted';
    if (score >= 40) return 'Building Trust';
    return 'New Member';
}

export function TrustScore({ profile, size = 'md', showLabel = true }: TrustScoreProps) {
    const score = calculateTrustScore(profile);
    const circumference = 2 * Math.PI * 20;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const sizeClasses = {
        sm: 'h-10 w-10',
        md: 'h-14 w-14',
        lg: 'h-20 w-20',
    };

    const fontSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-lg',
    };

    const breakdownItems = [
        { label: 'Name', value: profile.full_name && profile.full_name.length > 2 ? 10 : 0, max: 10 },
        { label: 'Bio', value: profile.bio && profile.bio.length > 20 ? 15 : 0, max: 15 },
        { label: 'Skills', value: profile.skills && profile.skills.length > 0 ? 15 : 0, max: 15 },
        { label: 'Avatar', value: profile.avatar_url ? 10 : 0, max: 10 },
        { label: 'Account Age', value: getAccountAgePoints(profile.created_at), max: 30 },
        { label: 'Base', value: 20, max: 20 },
    ];

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                    <div className={cn('relative', sizeClasses[size])}>
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="40%"
                                fill="none"
                                className="stroke-muted"
                                strokeWidth="3"
                            />
                            <circle
                                cx="50%"
                                cy="50%"
                                r="40%"
                                fill="none"
                                className={cn('transition-all duration-500', getScoreRingColor(score))}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                            />
                        </svg>
                        <div className={cn(
                            'absolute inset-0 flex items-center justify-center font-semibold',
                            fontSizes[size],
                            getScoreColor(score)
                        )}>
                            {score}
                        </div>
                    </div>
                    {showLabel && size !== 'sm' && (
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Trust Score</span>
                            <span className={cn('text-sm font-medium', getScoreColor(score))}>
                                {getScoreLabel(score)}
                            </span>
                        </div>
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent className="w-64">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 font-medium">
                        <Shield className="h-4 w-4" />
                        Trust Score Breakdown
                    </div>
                    <div className="space-y-1.5">
                        {breakdownItems.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className={item.value > 0 ? 'text-green-500' : 'text-muted-foreground'}>
                                    +{item.value}/{item.max}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Complete your profile to increase score
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

function getAccountAgePoints(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    let points = 0;
    if (daysSinceCreation >= 7) points += 10;
    if (daysSinceCreation >= 30) points += 10;
    if (daysSinceCreation >= 90) points += 10;
    return points;
}

// Compact version for cards
export function TrustScoreCompact({ profile }: { profile: Profile }) {
    const score = calculateTrustScore(profile);
    
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    'flex items-center gap-1 text-xs font-medium cursor-help',
                    getScoreColor(score)
                )}>
                    <Shield className="h-3.5 w-3.5" />
                    {score}%
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Trust Score: {getScoreLabel(score)}</p>
            </TooltipContent>
        </Tooltip>
    );
}
