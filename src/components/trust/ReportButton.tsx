import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const REPORT_REASONS = [
    { value: 'spam', label: 'Spam or misleading content' },
    { value: 'fake_profile', label: 'Fake or impersonating profile' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'misuse', label: 'Platform misuse' },
    { value: 'other', label: 'Other' },
] as const;

type ReportReason = typeof REPORT_REASONS[number]['value'];

interface ReportButtonProps {
    userId: string;
    userName?: string;
    variant?: 'icon' | 'text';
}

export function ReportButton({ userId, userName = 'this user', variant = 'icon' }: ReportButtonProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<ReportReason | ''>('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    // Don't show button if not logged in or viewing own profile
    if (!user || user.id === userId) {
        return null;
    }

    const handleSubmit = async () => {
        if (!reason) {
            toast({
                variant: 'destructive',
                title: 'Please select a reason',
                description: 'A report reason is required.',
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('user_reports')
                .insert({
                    reporter_id: user.id,
                    reported_id: userId,
                    reason,
                    details: details.trim() || null,
                });

            if (error) {
                if (error.code === '23505') {
                    toast({
                        variant: 'destructive',
                        title: 'Already reported',
                        description: 'You have already reported this user.',
                    });
                    setOpen(false);
                    return;
                }
                throw error;
            }

            toast({
                title: 'Report submitted',
                description: 'Thank you for helping keep our community safe. We will review your report.',
            });
            setOpen(false);
            setReason('');
            setDetails('');
        } catch (error) {
            console.error('Report error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to submit report. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {variant === 'icon' ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                                <Flag className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Report this user</TooltipContent>
                    </Tooltip>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive gap-1.5"
                    >
                        <Flag className="h-3.5 w-3.5" />
                        Report
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report {userName}</DialogTitle>
                    <DialogDescription>
                        Help us keep the community safe. Your report will be reviewed by our team.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for report *</Label>
                        <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {REPORT_REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="details">Additional details (optional)</Label>
                        <Textarea
                            id="details"
                            placeholder="Provide any additional context..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            maxLength={500}
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            {details.length}/500 characters
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !reason} variant="destructive">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

