import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { EndorsementType } from '@/types/database';
import { ThumbsUp, Award, Handshake, Target, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EndorseButtonProps {
    userId: string;
    currentEndorsements?: EndorsementType[];
    onEndorsementChange?: () => void;
    size?: 'sm' | 'md';
}

const ENDORSEMENT_OPTIONS: { type: EndorsementType; label: string; icon: React.ReactNode; description: string }[] = [
    {
        type: 'skill',
        label: 'Skills',
        icon: <Award className="h-4 w-4" />,
        description: 'Great technical skills'
    },
    {
        type: 'work_ethic',
        label: 'Work Ethic',
        icon: <Target className="h-4 w-4" />,
        description: 'Dedicated and reliable'
    },
    {
        type: 'collaboration',
        label: 'Collaboration',
        icon: <Handshake className="h-4 w-4" />,
        description: 'Great team player'
    },
];

export function EndorseButton({ userId, currentEndorsements = [], onEndorsementChange, size = 'md' }: EndorseButtonProps) {
    const [loading, setLoading] = useState<EndorsementType | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    // Can't endorse yourself
    if (user?.id === userId) return null;

    const handleEndorse = async (type: EndorsementType) => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Sign in required',
                description: 'Please sign in to endorse users.',
            });
            return;
        }

        setLoading(type);

        const isEndorsed = currentEndorsements.includes(type);

        if (isEndorsed) {
            // Remove endorsement
            const { error } = await supabase
                .from('endorsements')
                .delete()
                .eq('endorser_id', user.id)
                .eq('endorsed_id', userId)
                .eq('type', type);

            if (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to remove endorsement.',
                });
            } else {
                toast({
                    title: 'Endorsement removed',
                });
                onEndorsementChange?.();
            }
        } else {
            // Add endorsement
            const { error } = await supabase
                .from('endorsements')
                .insert({
                    endorser_id: user.id,
                    endorsed_id: userId,
                    type,
                });

            if (error) {
                if (error.code === '23505') {
                    toast({
                        variant: 'destructive',
                        title: 'Already endorsed',
                        description: 'You have already endorsed this user for this category.',
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to add endorsement.',
                    });
                }
            } else {
                toast({
                    title: 'Endorsement added!',
                    description: 'Thank you for endorsing this user.',
                });
                onEndorsementChange?.();
            }
        }

        setLoading(null);
    };

    const endorsedCount = currentEndorsements.length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={endorsedCount > 0 ? 'default' : 'outline'}
                    size={size === 'sm' ? 'sm' : 'default'}
                    className={cn(
                        'gap-2',
                        endorsedCount > 0 && 'bg-green-600 hover:bg-green-700'
                    )}
                >
                    <ThumbsUp className={cn('h-4 w-4', endorsedCount > 0 && 'fill-current')} />
                    {endorsedCount > 0 ? `Endorsed (${endorsedCount})` : 'Endorse'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {ENDORSEMENT_OPTIONS.map((option) => {
                    const isEndorsed = currentEndorsements.includes(option.type);
                    const isLoading = loading === option.type;

                    return (
                        <DropdownMenuItem
                            key={option.type}
                            onClick={() => handleEndorse(option.type)}
                            disabled={isLoading}
                            className="flex items-center gap-3 cursor-pointer"
                        >
                            <div className={cn(
                                'p-1.5 rounded-full',
                                isEndorsed ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                            )}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : option.icon}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{option.label}</p>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                            </div>
                            {isEndorsed && <Check className="h-4 w-4 text-green-600" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
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
