import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, User, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { user, profile, refreshProfile, profileLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setSkills(profile.skills || []);
    }
  }, [profile]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      bio: '',
      avatar_url: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile, reset]);

  if (profileLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 10) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;

    setIsLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        skills: skills,
      })
      .eq('id', user.id);

    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
      });
      return;
    }

    await refreshProfile();

    toast({
      title: 'Profile updated!',
      description: 'Your changes have been saved.',
    });
    navigate('/profile');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <Card className="animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  {...register('full_name')}
                  className={errors.full_name ? 'border-destructive' : ''}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  placeholder="https://example.com/avatar.jpg"
                  {...register('avatar_url')}
                  className={errors.avatar_url ? 'border-destructive' : ''}
                />
                {errors.avatar_url && (
                  <p className="text-sm text-destructive">{errors.avatar_url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself, your experience, and what you're looking for..."
                  rows={4}
                  {...register('bio')}
                  className={errors.bio ? 'border-destructive' : ''}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g., React, Design)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>
                    Add
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add up to 10 skills to help startups find you
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
