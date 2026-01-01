import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Profile } from '@/types/database';
import { CheckCircle2, Zap, Star, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
    profile: Profile;
    showAll?: boolean;
    size?: 'sm' | 'md';
}

// Calculate profile completeness
function getProfileCompleteness(profile: Profile): number {
    let complete = 0;
    const total = 4;
    if (profile.full_name && profile.full_name.length > 2) complete++;
    if (profile.bio && profile.bio.length > 10) complete++;
    if (profile.skills && profile.skills.length > 0) complete++;
    if (profile.avatar_url) complete++;
    return Math.round((complete / total) * 100);
}

// Calculate trust score
function getTrustScore(profile: Profile): number {
    let score = 0;
    if (profile.full_name && profile.full_name.length > 2) score += 15;
    if (profile.bio && profile.bio.length > 20) score += 20;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.avatar_url) score += 10;
    // Account age bonus
    const created = new Date(profile.created_at);
    const now = new Date();
    const daysSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) score += 10;
    if (daysSince >= 30) score += 10;
    score += 20; // base score
    return Math.min(100, score);
}

interface BadgeConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    condition: (profile: Profile) => boolean;
    tooltip: string;
}

const TRUST_BADGES: BadgeConfig[] = [
    {
        id: 'verified',
        label: 'Verified',
        icon: <CheckCircle2 className="h-3 w-3" />,
        color: 'bg-green-500/10 text-green-600 border-green-500/30',
        condition: (p) => getProfileCompleteness(p) >= 75,
        tooltip: 'Profile is mostly complete with verified information',
    },
    {
        id: 'active',
        label: 'Member',
        icon: <Zap className="h-3 w-3" />,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        condition: (p) => {
            const created = new Date(p.created_at);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return created <= sevenDaysAgo;
        },
        tooltip: 'Member for at least 7 days',
    },
    {
        id: 'skilled',
        label: 'Skilled',
        icon: <Star className="h-3 w-3" />,
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        condition: (p) => p.skills && p.skills.length >= 3,
        tooltip: 'Has listed 3 or more skills',
    },
    {
        id: 'trusted',
        label: 'Trusted',
        icon: <Shield className="h-3 w-3" />,
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
        condition: (p) => getTrustScore(p) >= 70,
        tooltip: 'High trust score based on profile completeness',
    },
];

export function TrustBadge({ profile, showAll = false, size = 'sm' }: TrustBadgeProps) {
    const earnedBadges = TRUST_BADGES.filter((badge) => badge.condition(profile));

    if (earnedBadges.length === 0) return null;

    const badgesToShow = showAll ? earnedBadges : earnedBadges.slice(0, 2);
    const hiddenCount = earnedBadges.length - badgesToShow.length;

    return (
        <div className="flex items-center gap-1 flex-wrap">
            {badgesToShow.map((badge) => (
                <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            className={cn(
                                'gap-1 cursor-help transition-all hover:scale-105',
                                badge.color,
                                size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
                            )}
                        >
                            {badge.icon}
                            {size === 'md' && badge.label}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-medium">{badge.label}</p>
                        <p className="text-xs text-muted-foreground">{badge.tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
            {hiddenCount > 0 && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 bg-muted/50 cursor-help"
                        >
                            +{hiddenCount}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{hiddenCount} more badge{hiddenCount > 1 ? 's' : ''}</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

// Simple inline badge for cards
export function TrustBadgeInline({ profile }: { profile: Profile }) {
    const isVerified = getProfileCompleteness(profile) >= 75;
    const isEstablished = new Date(profile.created_at) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (!isVerified && !isEstablished) return null;

    return (
        <div className="flex items-center gap-1">
            {isVerified && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>Verified Profile</TooltipContent>
                </Tooltip>
            )}
            {isEstablished && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Zap className="h-4 w-4 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>Established Member</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}
