import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface EndorseButtonProps {
    userId: string;
    userName?: string;
    onEndorsementChange?: () => void;
    size?: 'sm' | 'md';
}

export function EndorseButton({ userId, userName = 'this user', onEndorsementChange, size = 'md' }: EndorseButtonProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [hasEndorsed, setHasEndorsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // Check if current user has already endorsed this user
    useEffect(() => {
        async function checkEndorsement() {
            if (!user || user.id === userId) {
                setChecking(false);
                return;
            }

            const { data } = await supabase
                .from('endorsements')
                .select('id')
                .eq('endorser_id', user.id)
                .eq('endorsed_id', userId)
                .maybeSingle();

            setHasEndorsed(!!data);
            setChecking(false);
        }
        checkEndorsement();
    }, [user, userId]);

    // Don't show button if not logged in or viewing own profile
    if (!user || user.id === userId) {
        return null;
    }

    const handleEndorse = async () => {
        if (loading) return;
        setLoading(true);

        try {
            if (hasEndorsed) {
                // Remove endorsement
                const { error } = await supabase
                    .from('endorsements')
                    .delete()
                    .eq('endorser_id', user.id)
                    .eq('endorsed_id', userId);

                if (error) throw error;

                setHasEndorsed(false);
                toast({
                    title: 'Endorsement removed',
                    description: `You removed your endorsement for ${userName}.`,
                });
            } else {
                // Add endorsement
                const { error } = await supabase
                    .from('endorsements')
                    .insert({
                        endorser_id: user.id,
                        endorsed_id: userId,
                        type: 'skill'
                    });

                if (error) {
                    if (error.code === '23505') {
                        toast({
                            variant: 'destructive',
                            title: 'Already endorsed',
                            description: 'You have already endorsed this user.',
                        });
                        setHasEndorsed(true);
                        return;
                    }
                    throw error;
                }

                setHasEndorsed(true);
                toast({
                    title: 'Endorsed!',
                    description: `You endorsed ${userName}. This helps build their trust score.`,
                });
            }

            onEndorsementChange?.();
        } catch (error) {
            console.error('Endorsement error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update endorsement. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return null;
    }

    const sizeClasses = size === 'sm'
        ? 'h-7 px-2 text-xs gap-1'
        : 'h-9 px-3 text-sm gap-1.5';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant={hasEndorsed ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleEndorse}
                    disabled={loading}
                    className={cn(
                        sizeClasses,
                        hasEndorsed
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'hover:border-green-500 hover:text-green-500'
                    )}
                >
                    {loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <ThumbsUp className={cn(
                            'h-3.5 w-3.5',
                            hasEndorsed && 'fill-current'
                        )} />
                    )}
                    {hasEndorsed ? 'Endorsed' : 'Endorse'}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                {hasEndorsed
                    ? 'Click to remove your endorsement'
                    : 'Endorse this person to help build their trust score'}
            </TooltipContent>
        </Tooltip>
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
