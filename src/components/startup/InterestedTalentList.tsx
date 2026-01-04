import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StartupInterest, Profile } from '@/types/database';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { StartChatButton } from '@/components/messages/StartChatButton';
import { TrustScore } from '@/components/trust/TrustScore';
import { Users, UserPlus, Check, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface InterestedTalentListProps {
  startupId: string;
  interests: StartupInterest[];
}

export function InterestedTalentList({ startupId, interests }: InterestedTalentListProps) {
  const { addTeamMember, isTeamMember } = useTeamMembers(startupId);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<{ id: string; name: string } | null>(null);
  const [roleInTeam, setRoleInTeam] = useState('');

  const handleAccept = async (userId: string, userName: string) => {
    setSelectedTalent({ id: userId, name: userName });
    setShowRoleDialog(true);
  };

  const confirmAccept = async () => {
    if (!selectedTalent) return;
    
    setAcceptingId(selectedTalent.id);
    await addTeamMember(selectedTalent.id, roleInTeam || undefined);
    setAcceptingId(null);
    setShowRoleDialog(false);
    setSelectedTalent(null);
    setRoleInTeam('');
  };

  // Filter out interests where the user is already a team member
  const pendingInterests = interests.filter(
    (interest) => interest.user && !isTeamMember(interest.user.id)
  );

  if (pendingInterests.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interested Talent ({pendingInterests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingInterests.map((interest) => {
              const user = interest.user as Profile;
              if (!user) return null;

              return (
                <div
                  key={interest.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <Link
                    to={`/profile/${user.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <Avatar className="h-12 w-12 border border-border hover:ring-2 hover:ring-primary/30 transition-all">
                      <AvatarImage src={getAvatarUrl(user.avatar_url)} />
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate hover:text-primary transition-colors">
                        {user.full_name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {user.skills?.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {(user.skills?.length || 0) > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{(user.skills?.length || 0) - 2}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Interested {formatDistanceToNow(new Date(interest.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 ml-2">
                    <StartChatButton
                      userId={user.id}
                      userName={user.full_name}
                      size="sm"
                    />
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => handleAccept(user.id, user.full_name)}
                      disabled={acceptingId === user.id}
                    >
                      {acceptingId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Team</DialogTitle>
            <DialogDescription>
              Add {selectedTalent?.name} to your team. You can optionally assign a role.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Role in Team (optional)
            </label>
            <Input
              placeholder="e.g., Frontend Developer, Designer, Marketing Lead"
              value={roleInTeam}
              onChange={(e) => setRoleInTeam(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={confirmAccept}>
              <Check className="h-4 w-4 mr-2" />
              Add to Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
