import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserMinus, Crown } from 'lucide-react';
import { TrustScore } from '@/components/trust/TrustScore';
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

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface TeamMembersSectionProps {
  startupId: string;
  founderId: string;
  founderName: string;
  founderAvatarUrl?: string | null;
  isOwner: boolean;
}

export function TeamMembersSection({
  startupId,
  founderId,
  founderName,
  founderAvatarUrl,
  isOwner,
}: TeamMembersSectionProps) {
  const { teamMembers, loading, removeTeamMember } = useTeamMembers(startupId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const handleRemove = async (memberId: string) => {
    await removeTeamMember(memberId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team ({teamMembers.length + 1})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Founder - Always first */}
        <Link
          to={`/profile/${founderId}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src={getAvatarUrl(founderAvatarUrl)} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(founderName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{founderName}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Founder
              </Badge>
            </div>
          </div>
        </Link>

        {/* Team Members */}
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <Link to={`/profile/${member.user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={getAvatarUrl(member.user?.avatar_url)} />
                <AvatarFallback>
                  {member.user ? getInitials(member.user.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{member.user?.full_name}</p>
                <div className="flex items-center gap-2">
                  {member.role_in_team ? (
                    <Badge variant="outline" className="text-xs">
                      {member.role_in_team}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Team Member</span>
                  )}
                </div>
              </div>
            </Link>
            
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {member.user?.full_name} from the team?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleRemove(member.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}

        {teamMembers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No team members yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
