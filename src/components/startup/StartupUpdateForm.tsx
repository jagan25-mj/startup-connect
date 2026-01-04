import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, X } from 'lucide-react';
import type { UpdateTag } from '@/types/database';
import { UPDATE_TAG_LABELS } from '@/types/database';
import { notifyStartupUpdate } from '@/lib/emailNotifications';

interface StartupUpdateFormProps {
  startupId: string;
  startupName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StartupUpdateForm({ startupId, startupName, onSuccess, onCancel }: StartupUpdateFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState<UpdateTag | ''>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('startup_updates')
        .insert({
          startup_id: startupId,
          title,
          description: description || null,
          tag: tag || null,
        });

      if (error) throw error;
      
      // Get interested talents and team members to notify
      const [interestsResult, teamResult] = await Promise.all([
        supabase.from('startup_interests').select('user_id').eq('startup_id', startupId),
        supabase.from('startup_team_members').select('user_id').eq('startup_id', startupId),
      ]);

      const interestedIds = interestsResult.data?.map(i => i.user_id) || [];
      const teamIds = teamResult.data?.map(t => t.user_id) || [];
      const recipientIds = [...new Set([...interestedIds, ...teamIds])];

      // Send email notifications in background
      if (recipientIds.length > 0) {
        notifyStartupUpdate(
          recipientIds,
          startupName,
          title,
          description || null,
          startupId
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-updates', startupId] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      toast({ title: 'Update posted!' });
      setTitle('');
      setDescription('');
      setTag('');
      onSuccess?.();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Failed to post update',
        description: 'Please try again.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Post an Update</CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What's new with your startup?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Share more details about this update..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">Tag (optional)</Label>
            <Select value={tag} onValueChange={(value) => setTag(value as UpdateTag)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tag" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(UPDATE_TAG_LABELS) as UpdateTag[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {UPDATE_TAG_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!title.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Post Update
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}