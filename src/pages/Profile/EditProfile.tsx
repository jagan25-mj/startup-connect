import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Loader2, ArrowLeft, User, X, Upload, FileText, Trash2, Plus, Github, Linkedin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AchievementCard } from '@/components/profile/AchievementCard';
import { AchievementForm } from '@/components/profile/AchievementForm';
import type { ProfileAchievement } from '@/types/database';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  github_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { user, profile, refreshProfile, profileLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<ProfileAchievement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['my-achievements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_achievements')
        .select('*')
        .eq('user_id', user!.id)
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data as ProfileAchievement[];
    },
    enabled: !!user?.id,
  });

  // Delete achievement mutation
  const deleteAchievementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profile_achievements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-achievements'] });
      toast({ title: 'Achievement deleted' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to delete achievement' });
    },
  });

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
      github_url: '',
      linkedin_url: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
      });
    }
  }, [profile, reset]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a PDF file.',
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Resume must be less than 2MB.',
      });
      return;
    }

    setIsUploadingResume(true);

    try {
      // Upload to Supabase Storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update profile with resume info
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          resume_url: filePath,
          resume_filename: file.name,
          resume_uploaded_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: 'Resume uploaded!',
        description: 'Your resume has been saved.',
      });
    } catch (error) {
      console.error('Resume upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Could not upload resume. Please try again.',
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!user || !profile?.resume_url) return;

    setIsUploadingResume(true);

    try {
      // Delete from storage
      await supabase.storage.from('resumes').remove([profile.resume_url]);

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          resume_url: null,
          resume_filename: null,
          resume_uploaded_at: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Resume deleted',
        description: 'Your resume has been removed.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'Could not delete resume. Please try again.',
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  if (profileLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="space-y-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 flex-1" />
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
        github_url: data.github_url || null,
        linkedin_url: data.linkedin_url || null,
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

  const handleAchievementSuccess = () => {
    setShowAchievementForm(false);
    setEditingAchievement(null);
    queryClient.invalidateQueries({ queryKey: ['my-achievements'] });
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

        {/* Basic Info Card */}
        <Card className="animate-fade-in mb-6">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github_url" className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub URL
                  </Label>
                  <Input
                    id="github_url"
                    placeholder="https://github.com/username"
                    {...register('github_url')}
                    className={errors.github_url ? 'border-destructive' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn URL
                  </Label>
                  <Input
                    id="linkedin_url"
                    placeholder="https://linkedin.com/in/username"
                    {...register('linkedin_url')}
                    className={errors.linkedin_url ? 'border-destructive' : ''}
                  />
                </div>
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

        {/* Resume Upload Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume
            </CardTitle>
            <CardDescription>Upload your resume to showcase your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleResumeUpload}
              className="hidden"
            />

            {profile.resume_url && profile.resume_filename ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{profile.resume_filename}</p>
                    <p className="text-sm text-muted-foreground">PDF Document</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingResume}
                  >
                    {isUploadingResume ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Replace'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={handleDeleteResume}
                    disabled={isUploadingResume}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-24 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingResume}
              >
                {isUploadingResume ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" />
                    <span>Upload Resume (PDF, max 2MB)</span>
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Achievements Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Showcase your hackathons, projects, and awards</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingAchievement(null);
                  setShowAchievementForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAchievementForm ? (
              <AchievementForm
                achievement={editingAchievement}
                userId={user.id}
                onSuccess={handleAchievementSuccess}
                onCancel={() => {
                  setShowAchievementForm(false);
                  setEditingAchievement(null);
                }}
              />
            ) : achievementsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : achievements && achievements.length > 0 ? (
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    showActions
                    onEdit={() => {
                      setEditingAchievement(achievement);
                      setShowAchievementForm(true);
                    }}
                    onDelete={() => deleteAchievementMutation.mutate(achievement.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 italic">
                No achievements added yet. Add your first achievement!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}