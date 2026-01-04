import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { ProfileAchievement, AchievementType } from '@/types/database';
import { ACHIEVEMENT_TYPE_LABELS } from '@/types/database';

const achievementSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  achievement_type: z.enum(['hackathon', 'internship', 'project', 'certification', 'award']),
  year: z.number().min(1990).max(new Date().getFullYear()).optional(),
  proof_link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type AchievementFormData = z.infer<typeof achievementSchema>;

interface AchievementFormProps {
  achievement?: ProfileAchievement | null;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AchievementForm({ achievement, userId, onSuccess, onCancel }: AchievementFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!achievement;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AchievementFormData>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      title: achievement?.title || '',
      description: achievement?.description || '',
      achievement_type: achievement?.achievement_type || 'project',
      year: achievement?.year || new Date().getFullYear(),
      proof_link: achievement?.proof_link || '',
    },
  });

  const selectedType = watch('achievement_type');

  const onSubmit = async (data: AchievementFormData) => {
    setIsLoading(true);

    try {
      if (isEditing && achievement) {
        const { error } = await supabase
          .from('profile_achievements')
          .update({
            title: data.title,
            description: data.description || null,
            achievement_type: data.achievement_type,
            year: data.year || null,
            proof_link: data.proof_link || null,
          })
          .eq('id', achievement.id);

        if (error) throw error;

        toast({ title: 'Achievement updated!' });
      } else {
        const { error } = await supabase.from('profile_achievements').insert({
          user_id: userId,
          title: data.title,
          description: data.description || null,
          achievement_type: data.achievement_type,
          year: data.year || null,
          proof_link: data.proof_link || null,
        });

        if (error) throw error;

        toast({ title: 'Achievement added!' });
      }

      onSuccess();
    } catch (error) {
      console.error('Achievement save error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save achievement. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Won SIH 2024 Hackathon"
              {...register('title')}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue('achievement_type', value as AchievementType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACHIEVEMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min={1990}
                max={new Date().getFullYear()}
                {...register('year', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your achievement..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof_link">Proof Link (optional)</Label>
            <Input
              id="proof_link"
              placeholder="https://github.com/... or https://drive.google.com/..."
              {...register('proof_link')}
              className={errors.proof_link ? 'border-destructive' : ''}
            />
            {errors.proof_link && (
              <p className="text-sm text-destructive">{errors.proof_link.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Add'} Achievement
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}