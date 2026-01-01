import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Profile } from '@/types/database';
import { Users, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntentBadgesProps {
    profile: Profile;
    size?: 'sm' | 'md';
}

export function IntentBadges({ profile, size = 'sm' }: IntentBadgesProps) {
    // Show role badge
    const roleConfig = profile.role === 'founder' 
        ? { label: 'Founder', icon: <Lightbulb className="h-3 w-3" />, color: 'bg-primary/10 text-primary border-primary/30' }
        : { label: 'Talent', icon: <Users className="h-3 w-3" />, color: 'bg-accent/10 text-accent border-accent/30' };

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn(
                            'gap-1 cursor-help',
                            roleConfig.color,
                            size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
                        )}
                    >
                        {roleConfig.icon}
                        {size === 'md' && roleConfig.label}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Role: {roleConfig.label}</p>
                </TooltipContent>
            </Tooltip>

            {/* Skills count badge */}
            {profile.skills && profile.skills.length > 0 && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            className={cn(
                                'gap-1 cursor-help bg-muted/50 text-muted-foreground border-border',
                                size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
                            )}
                        >
                            {profile.skills.length} skills
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{profile.skills.slice(0, 5).join(', ')}{profile.skills.length > 5 ? '...' : ''}</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

// Display bio excerpt
export function LookingForText({ bio }: { bio: string | null }) {
    if (!bio) return null;

    return (
        <div className="text-sm">
            <span className="text-muted-foreground">About: </span>
            <span className="font-medium line-clamp-1">{bio}</span>
        </div>
    );
}
