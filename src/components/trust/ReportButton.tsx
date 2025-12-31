import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ReportReason } from '@/types/database';
import { Flag, AlertTriangle, UserX, MessageSquareWarning, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportButtonProps {
    userId: string;
    userName?: string;
    variant?: 'icon' | 'text';
}

const REPORT_REASONS: { reason: ReportReason; label: string; icon: React.ReactNode }[] = [
    { reason: 'spam', label: 'Spam or scam', icon: <MessageSquareWarning className="h-4 w-4" /> },
    { reason: 'fake_profile', label: 'Fake profile', icon: <UserX className="h-4 w-4" /> },
    { reason: 'harassment', label: 'Harassment', icon: <AlertTriangle className="h-4 w-4" /> },
    { reason: 'misuse', label: 'Platform misuse', icon: <Flag className="h-4 w-4" /> },
    { reason: 'other', label: 'Other', icon: <HelpCircle className="h-4 w-4" /> },
];

export function ReportButton({ userId, userName = 'this user', variant = 'icon' }: ReportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    // Can't report yourself
    if (user?.id === userId) return null;

    const handleSelectReason = (reason: ReportReason) => {
        setSelectedReason(reason);
        setIsOpen(true);
    };

    const handleSubmit = async () => {
        if (!user || !selectedReason) return;

        setLoading(true);

        const { error } = await supabase
            .from('user_reports')
            .insert({
                reporter_id: user.id,
                reported_id: userId,
                reason: selectedReason,
                details: details.trim() || null,
            });

        setLoading(false);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to submit report. Please try again.',
            });
        } else {
            toast({
                title: 'Report submitted',
                description: 'Thank you for helping keep our community safe.',
            });
            setIsOpen(false);
            setSelectedReason(null);
            setDetails('');
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {variant === 'icon' ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Flag className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-2">
                            <Flag className="h-4 w-4" />
                            Report
                        </Button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {REPORT_REASONS.map((option) => (
                        <DropdownMenuItem
                            key={option.reason}
                            onClick={() => handleSelectReason(option.reason)}
                            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                            {option.icon}
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Report {userName}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedReason && (
                                <span className="font-medium">
                                    Reason: {REPORT_REASONS.find(r => r.reason === selectedReason)?.label}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Additional details (optional)</label>
                            <Textarea
                                placeholder="Please provide any additional context..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                            <p>Reports are confidential and reviewed by our team. We take all reports seriously and will take appropriate action.</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
