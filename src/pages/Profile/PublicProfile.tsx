import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { TrustScore } from '@/components/trust/TrustScore';
import { TrustBadge } from '@/components/trust/TrustBadge';
import { IntentBadges } from '@/components/trust/IntentBadges';
import { AchievementCard } from '@/components/profile/AchievementCard';
import { ResumeSection } from '@/components/profile/ResumeSection';
import { StartChatButton } from '@/components/messages/StartChatButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Lightbulb, Users, Github, Linkedin, ArrowLeft, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { Profile, ProfileAchievement } from '@/types/database';

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!id,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['profile-achievements', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_achievements')
        .select('*')
        .eq('user_id', id)
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data as ProfileAchievement[];
    },
    enabled: !!id,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isOwnProfile = user?.id === id;

  if (profileLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Card className="overflow-hidden">
            <div className="h-32 gradient-primary" />
            <CardContent className="relative pt-0 -mt-16 p-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
                <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
            <p className="text-muted-foreground mb-4">This user doesn't exist or has been removed.</p>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back button */}
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <Card className="animate-fade-in overflow-hidden">
          {/* Header/Banner */}
          <div className="h-32 gradient-primary" />

          {/* Profile Content */}
          <CardContent className="relative pt-0 -mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  <Badge
                    variant="secondary"
                    className={profile.role === 'founder'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent/10 text-accent'
                    }
                  >
                    {profile.role === 'founder' ? (
                      <><Lightbulb className="mr-1 h-3 w-3" /> Founder</>
                    ) : (
                      <><Users className="mr-1 h-3 w-3" /> Talent</>
                    )}
                  </Badge>
                  <TrustBadge profile={profile} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-2 mt-2">
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Button asChild variant="outline">
                    <Link to="/profile/edit">Edit Profile</Link>
                  </Button>
                ) : user && (
                  <StartChatButton userId={profile.id} userName={profile.full_name} />
                )}
              </div>
            </div>

            {/* Trust & Intent Section */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-lg bg-muted/30">
              <TrustScore profile={profile} size="md" />
              <div className="h-10 w-px bg-border hidden sm:block" />
              <IntentBadges profile={profile} size="md" />
            </div>

            {/* Bio */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.bio ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <p className="text-muted-foreground italic">No bio added yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No skills added yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Resume Section */}
            <ResumeSection profile={profile} isOwnProfile={false} />

            {/* Achievements Section */}
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                {achievementsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : achievements && achievements.length > 0 ? (
                  <div className="grid gap-4">
                    {achievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No achievements added yet.</p>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}