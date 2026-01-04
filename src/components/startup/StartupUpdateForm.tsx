import { useState, useRef } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, X, Image, Video, Trash2 } from 'lucide-react';
import type { UpdateTag } from '@/types/database';
import { UPDATE_TAG_LABELS } from '@/types/database';
import { notifyStartupUpdate } from '@/lib/emailNotifications';

interface StartupUpdateFormProps {
  startupId: string;
  startupName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function StartupUpdateForm({ startupId, startupName, onSuccess, onCancel }: StartupUpdateFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState<UpdateTag | ''>('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideoFile = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideoFile) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM).',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
      });
      return;
    }

    setMediaFile(file);
    setIsVideo(isVideoFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setIsVideo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('startup-updates')
        .upload(fileName, mediaFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('startup-updates')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Media upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload media. Please try again.',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // Upload media first if present
      let mediaUrl: string | null = null;
      if (mediaFile) {
        mediaUrl = await uploadMedia();
        if (!mediaUrl && mediaFile) {
          throw new Error('Failed to upload media');
        }
      }

      const { error } = await supabase
        .from('startup_updates')
        .insert({
          startup_id: startupId,
          title,
          description: description || null,
          tag: tag || null,
          media_url: mediaUrl,
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
          startupId,
          mediaUrl
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
      removeMedia();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Create update error:', error);
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

  const isSubmitting = createMutation.isPending || uploading;

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

          {/* Media Upload Section */}
          <div className="space-y-2">
            <Label>Media (optional)</Label>
            {!mediaPreview ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-border">
                {isVideo ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-64 object-contain bg-muted"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain bg-muted"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeMedia}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Max 10MB. Supported: JPEG, PNG, GIF, WebP, MP4, WebM
            </p>
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
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Post Update'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
