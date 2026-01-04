import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  fullName: string;
  onUploadComplete: (url: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  fullName,
  onUploadComplete,
  size = 'lg',
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getAvatarUrl = () => {
    if (!currentAvatarUrl) return null;
    if (currentAvatarUrl.startsWith('http')) return currentAvatarUrl;
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(currentAvatarUrl);
    return data.publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or WebP image.',
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Image must be less than 2MB.',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Delete old avatar if exists
      if (currentAvatarUrl && !currentAvatarUrl.startsWith('http')) {
        await supabase.storage.from('avatars').remove([currentAvatarUrl]);
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUploadComplete(filePath);
      
      toast({
        title: 'Avatar updated!',
        description: 'Your profile picture has been changed.',
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Could not upload avatar. Please try again.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl) return;

    setIsUploading(true);

    try {
      // Delete from storage if not external URL
      if (!currentAvatarUrl.startsWith('http')) {
        await supabase.storage.from('avatars').remove([currentAvatarUrl]);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      onUploadComplete(null);

      toast({
        title: 'Avatar removed',
        description: 'Your profile picture has been deleted.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'Could not remove avatar. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="relative group">
        <Avatar className={cn(sizeClasses[size], 'border-4 border-border')}>
          <AvatarImage src={avatarUrl || undefined} alt={fullName} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        
        {/* Overlay on hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer',
            isUploading && 'opacity-100'
          )}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <Camera className="h-8 w-8 text-white" />
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          {currentAvatarUrl ? 'Change' : 'Upload'}
        </Button>
        
        {currentAvatarUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isUploading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP. Max 2MB.
      </p>
    </div>
  );
}