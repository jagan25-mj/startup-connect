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
        condition: (p) => p.profile_completeness >= 80,
        tooltip: 'Profile is 80%+ complete with verified information',
    },
    {
        id: 'active',
        label: 'Active',
        icon: <Zap className="h-3 w-3" />,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        condition: (p) => {
            if (!p.last_active_at) return false;
            const lastActive = new Date(p.last_active_at);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return lastActive > sevenDaysAgo;
        },
        tooltip: 'Active in the last 7 days',
    },
    {
        id: 'engaged',
        label: 'Engaged',
        icon: <Star className="h-3 w-3" />,
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        condition: (p) => p.endorsement_count >= 5,
        tooltip: 'Received 5+ endorsements from other users',
    },
    {
        id: 'trusted',
        label: 'Trusted',
        icon: <Shield className="h-3 w-3" />,
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
        condition: (p) => p.trust_score >= 70,
        tooltip: 'High trust score based on profile, activity, and endorsements',
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
    const isVerified = profile.profile_completeness >= 80;
    const isActive = profile.last_active_at &&
        new Date(profile.last_active_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (!isVerified && !isActive) return null;

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
            {isActive && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Zap className="h-4 w-4 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>Active Recently</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}
