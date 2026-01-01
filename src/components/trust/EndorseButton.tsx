import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// NOTE: Endorsement functionality is disabled until the endorsements table is created
// The database migration for this feature needs to be applied first

interface EndorseButtonProps {
    userId: string;
    currentEndorsements?: string[];
    onEndorsementChange?: () => void;
    size?: 'sm' | 'md';
}

export function EndorseButton({ userId, currentEndorsements = [], onEndorsementChange, size = 'md' }: EndorseButtonProps) {
    // Disabled until database table is created
    return null;
}

// Summary component showing endorsement counts by type
export function EndorsementSummary({
    endorsementCount,
    className
}: {
    endorsementCount: number;
    className?: string;
}) {
    if (endorsementCount === 0) return null;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn('flex items-center gap-1.5 text-sm', className)}>
                    <ThumbsUp className="h-4 w-4 text-green-500 fill-green-500/20" />
                    <span className="font-medium text-green-600">{endorsementCount}</span>
                    <span className="text-muted-foreground">endorsement{endorsementCount !== 1 ? 's' : ''}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>This user has received {endorsementCount} endorsement{endorsementCount !== 1 ? 's' : ''}</p>
            </TooltipContent>
        </Tooltip>
    );
}
