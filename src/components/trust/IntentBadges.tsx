import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Profile, AvailabilityType, CommitmentType } from '@/types/database';
import {
    Clock, Briefcase, Users2, UserCheck,
    CalendarCheck, Coffee, Building, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntentBadgesProps {
    profile: Profile;
    size?: 'sm' | 'md';
}

const AVAILABILITY_CONFIG: Record<AvailabilityType, { label: string; icon: React.ReactNode; color: string }> = {
    full_time: {
        label: 'Full-time',
        icon: <Briefcase className="h-3 w-3" />,
        color: 'bg-green-500/10 text-green-600 border-green-500/30'
    },
    part_time: {
        label: 'Part-time',
        icon: <Clock className="h-3 w-3" />,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/30'
    },
    consulting: {
        label: 'Consulting',
        icon: <Coffee className="h-3 w-3" />,
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/30'
    },
    not_available: {
        label: 'Not Available',
        icon: <CalendarCheck className="h-3 w-3" />,
        color: 'bg-muted text-muted-foreground border-border'
    },
};

const COMMITMENT_CONFIG: Record<CommitmentType, { label: string; icon: React.ReactNode; color: string }> = {
    cofounder: {
        label: 'Co-founder',
        icon: <Users2 className="h-3 w-3" />,
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/30'
    },
    employee: {
        label: 'Employee',
        icon: <Building className="h-3 w-3" />,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/30'
    },
    contractor: {
        label: 'Contractor',
        icon: <UserCheck className="h-3 w-3" />,
        color: 'bg-green-500/10 text-green-600 border-green-500/30'
    },
    advisor: {
        label: 'Advisor',
        icon: <Lightbulb className="h-3 w-3" />,
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/30'
    },
};

export function IntentBadges({ profile, size = 'sm' }: IntentBadgesProps) {
    const availability = profile.availability ? AVAILABILITY_CONFIG[profile.availability] : null;
    const commitment = profile.commitment_type ? COMMITMENT_CONFIG[profile.commitment_type] : null;

    if (!availability && !commitment && !profile.looking_for) return null;

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {availability && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            className={cn(
                                'gap-1 cursor-help',
                                availability.color,
                                size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
                            )}
                        >
                            {availability.icon}
                            {size === 'md' && availability.label}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Availability: {availability.label}</p>
                    </TooltipContent>
                </Tooltip>
            )}

            {commitment && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            className={cn(
                                'gap-1 cursor-help',
                                commitment.color,
                                size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
                            )}
                        >
                            {commitment.icon}
                            {size === 'md' && commitment.label}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Looking for: {commitment.label} role</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

// Display "Looking for" as text
export function LookingForText({ lookingFor }: { lookingFor: string | null }) {
    if (!lookingFor) return null;

    return (
        <div className="text-sm">
            <span className="text-muted-foreground">Looking for: </span>
            <span className="font-medium">{lookingFor}</span>
        </div>
    );
}
