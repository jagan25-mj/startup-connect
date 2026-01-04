import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Startup, StartupInterest, STAGE_LABELS, STAGE_COLORS, Profile } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StartChatButton } from '@/components/messages/StartChatButton';
import {
  Loader2, ArrowLeft, Building2, Calendar, Edit, Trash2,
  Heart, HeartOff, Users, Plus
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { TeamHealth, FillsSkillGapBadge } from '@/components/startup/TeamHealth';
import { talentFillsSkillGap } from '@/lib/skillGap';
import { EndorseButton } from '@/components/trust/EndorseButton';
import { ReportButton } from '@/components/trust/ReportButton';
import { FounderAIInsights } from '@/components/ai/FounderAIInsights';
import { TalentAIInsights } from '@/components/ai/TalentAIInsights';
import { StartupUpdatesTimeline } from '@/components/startup/StartupUpdatesTimeline';
import { StartupUpdateForm } from '@/components/startup/StartupUpdateForm';
import { TeamMembersSection } from '@/components/startup/TeamMembersSection';
import { InterestedTalentList } from '@/components/startup/InterestedTalentList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}

export default function StartupDetail() {
  const { id } = useParams<{ id: string }>();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [interests, setInterests] = useState<StartupInterest[]>([]);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isOwner = startup?.founder_id === user?.id;

  const fetchStartup = useCallback(async () => {
    const { data, error } = await supabase
      .from('startups')
      .select(`
        *,
        founder:profiles!startups_founder_id_fkey(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setStartup(data as unknown as Startup);
    }
    setLoading(false);
  }, [id]);

  const fetchInterests = useCallback(async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('startup_interests')
      .select(`
        *,
        user:profiles!startup_interests_user_id_fkey(*)
      `)
      .eq('startup_id', id);

    if (!error && data) {
      setInterests(data as unknown as StartupInterest[]);
      if (user) {
        setHasExpressedInterest(data.some((i) => i.user_id === user.id));
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (id) {
      fetchStartup();
      fetchInterests();
    }
  }, [id, user, fetchStartup, fetchInterests]);

  const handleExpressInterest = async () => {
    if (!user || !id) return;

    setActionLoading(true);

    if (hasExpressedInterest) {
      const { error } = await supabase
        .from('startup_interests')
        .delete()
        .eq('startup_id', id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to remove interest. Please try again.',
        });
      } else {
        setHasExpressedInterest(false);
        toast({
          title: 'Interest removed',
          description: 'You are no longer interested in this startup.',
        });
        fetchInterests();
      }
    } else {
      const { error } = await supabase
        .from('startup_interests')
        .insert({ startup_id: id, user_id: user.id });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to express interest. Please try again.',
        });
      } else {
        setHasExpressedInterest(true);
        toast({
          title: 'Interest expressed!',
          description: 'The founder will be notified of your interest.',
        });
        fetchInterests();
      }
    }

    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;

    const { error } = await supabase
      .from('startups')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete startup. Please try again.',
      });
    } else {
      toast({
        title: 'Startup deleted',
        description: 'Your startup has been successfully deleted.',
      });
      navigate('/dashboard');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!startup) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Startup not found</h1>
          <Button asChild>
            <Link to="/startups">Back to Startups</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/startups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Startups
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-fade-in">
              <div className="flex flex-wrap items-start gap-4 mb-4">
                <h1 className="text-3xl font-bold">{startup.name}</h1>
                <Badge className={STAGE_COLORS[startup.stage]} variant="secondary">
                  {STAGE_LABELS[startup.stage]}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{startup.industry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {format(new Date(startup.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-3 mb-6">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/startups/${startup.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Startup?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your startup and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{startup.description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Interested Users with Accept/Reject (Only visible to founder) */}
            {isOwner && id && (
              <InterestedTalentList
                startupId={id}
                startupName={startup.name}
                interests={interests}
              />
            )}

            {/* Progress Updates Section */}
            <div className="space-y-4">
              {isOwner && (
                showUpdateForm ? (
                  <StartupUpdateForm
                    startupId={startup.id}
                    startupName={startup.name}
                    onSuccess={() => setShowUpdateForm(false)}
                    onCancel={() => setShowUpdateForm(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowUpdateForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Post Progress Update
                  </Button>
                )
              )}
              <StartupUpdatesTimeline startupId={startup.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Founder Card */}
            {startup.founder && (
              <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle>Founder</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link to={`/profile/${startup.founder.id}`} className="flex items-center gap-4 mb-4 group">
                    <Avatar className="h-14 w-14 border-2 border-primary/20 group-hover:ring-2 group-hover:ring-primary/30 transition-all">
                      <AvatarImage src={getAvatarUrl(startup.founder.avatar_url)} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(startup.founder.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">{startup.founder.full_name}</p>
                      {startup.founder.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{startup.founder.bio}</p>
                      )}
                    </div>
                  </Link>
                  {user && !isOwner && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <StartChatButton
                          userId={startup.founder.id}
                          userName={startup.founder.full_name}
                          variant="outline"
                          className="flex-1"
                        />
                        <EndorseButton
                          userId={startup.founder.id}
                          userName={startup.founder.full_name}
                          size="md"
                        />
                      </div>
                      <div className="flex justify-end">
                        <ReportButton
                          userId={startup.founder.id}
                          userName={startup.founder.full_name}
                          variant="text"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Team Members Section */}
            {id && startup.founder && (
              <TeamMembersSection
                startupId={id}
                founderId={startup.founder.id}
                founderName={startup.founder.full_name}
                founderAvatarUrl={startup.founder.avatar_url}
                isOwner={isOwner}
              />
            )}

            {/* Express Interest Card */}
            {user && !isOwner && (
              <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleExpressInterest}
                    variant={hasExpressedInterest ? 'outline' : 'gradient'}
                    className="w-full"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : hasExpressedInterest ? (
                      <HeartOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Heart className="mr-2 h-4 w-4" />
                    )}
                    {hasExpressedInterest ? 'Remove Interest' : 'Express Interest'}
                  </Button>
                  {/* Skill Gap Badge for Talent */}
                  {profile?.role === 'talent' && profile?.skills && startup && (() => {
                    const gapAnalysis = talentFillsSkillGap(profile.skills, startup);
                    return gapAnalysis.fills ? (
                      <div className="mt-3 flex justify-center">
                        <FillsSkillGapBadge matchedSkills={gapAnalysis.matchedSkills} />
                      </div>
                    ) : null;
                  })()}
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {hasExpressedInterest
                      ? 'The founder knows you\'re interested'
                      : 'Let the founder know you\'re interested in joining'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Team Health - Only visible to owner */}
            {isOwner && startup && (
              <TeamHealth
                startup={startup}
                interestedTalentSkills={interests.flatMap(i => i.user?.skills || [])}
              />
            )}

            {/* Founder AI Insights - Only visible to owner */}
            {isOwner && startup && (
              <FounderAIInsights
                startup={startup}
                interestedTalentSkills={interests.flatMap(i => i.user?.skills || [])}
                interestCount={interests.length}
                variant="compact"
              />
            )}

            {/* Talent AI Insights - Only visible to non-owner talent */}
            {user && !isOwner && profile?.role === 'talent' && startup && (
              <TalentAIInsights
                talent={profile}
                startup={startup}
                variant="compact"
              />
            )}

            {!user && (
              <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Sign in to express interest in this startup
                  </p>
                  <Button asChild variant="gradient" className="w-full">
                    <Link to="/auth/login">Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}