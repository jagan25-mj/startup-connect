import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Profile, SKILLS, UserRole } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useConnections } from '@/hooks/useConnections';
import { ConnectButton } from '@/components/connections/ConnectButton';
import { TrustScoreCompact } from '@/components/trust/TrustScore';
import { motion } from 'framer-motion';
import {
  Users, Search, Filter, UserPlus, Check, Clock,
  Briefcase, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';

function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const PAGE_SIZE = 12;

export default function Network() {
  const { user, profile } = useAuth();
  const { connections, pendingRequests, getConnectionStatus } = useConnections();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');

  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .neq('id', user.id)
      .order('created_at', { ascending: false });

    // Apply role filter
    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter as UserRole);
    }

    // Apply skill filter
    if (skillFilter !== 'all') {
      query = query.contains('skills', [skillFilter]);
    }

    // Apply search filter
    if (searchQuery) {
      query = query.ilike('full_name', `%${searchQuery}%`);
    }

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (!error && data) {
      setProfiles(data as Profile[]);
      setTotalCount(count || 0);
    }

    setLoading(false);
  }, [user, page, roleFilter, skillFilter, searchQuery]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, skillFilter, searchQuery]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="h-3 w-3 text-success" />;
      case 'pending_sent':
      case 'pending_received':
        return <Clock className="h-3 w-3 text-warning" />;
      default:
        return null;
    }
  };

  const renderProfileCard = (profile: Profile) => {
    const status = getConnectionStatus(profile.id);
    const statusIcon = getStatusIcon(status);

    return (
      <motion.div
        key={profile.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="h-full hover:shadow-md transition-all hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Link to={`/profile/${profile.id}`} className="group">
                <Avatar className="h-16 w-16 border-2 border-border group-hover:ring-2 group-hover:ring-primary/30 transition-all">
                  <AvatarImage src={getAvatarUrl(profile.avatar_url)} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <Link
                to={`/profile/${profile.id}`}
                className="mt-3 font-semibold hover:text-primary transition-colors flex items-center gap-1"
              >
                {profile.full_name}
                {statusIcon}
              </Link>

              <Badge
                variant="secondary"
                className={`mt-1 text-xs ${
                  profile.role === 'founder'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/10 text-accent'
                }`}
              >
                {profile.role === 'founder' ? 'Founder' : 'Talent'}
              </Badge>

              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-3">
                  {profile.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {profile.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{profile.skills.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="mt-3">
                <TrustScoreCompact profile={profile} />
              </div>

              <div className="mt-4 w-full">
                <ConnectButton
                  userId={profile.id}
                  userName={profile.full_name}
                  size="sm"
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Network
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover and connect with founders and talent
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3 mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Check className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{connections.length}</p>
                  <p className="text-sm text-muted-foreground">Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCount}</p>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="founder">Founders</SelectItem>
              <SelectItem value="talent">Talent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {SKILLS.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList>
            <TabsTrigger value="explore" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-2">
              <Check className="h-4 w-4" />
              My Connections
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="space-y-6">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-4 w-24 mt-3" />
                        <Skeleton className="h-5 w-16 mt-2" />
                        <Skeleton className="h-8 w-full mt-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No profiles found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to find more people.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {profiles.map(renderProfileCard)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="connections">
            {connections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <UserPlus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No connections yet</h3>
                  <p className="text-muted-foreground">
                    Start connecting with founders and talent to grow your network.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {connections.map((conn) => {
                  const otherUser =
                    conn.requester_id === user?.id ? conn.receiver : conn.requester;
                  if (!otherUser) return null;
                  return renderProfileCard(otherUser as Profile);
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">
                    You don't have any pending connection requests.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pendingRequests.map((conn) => {
                  const requester = conn.requester;
                  if (!requester) return null;
                  return renderProfileCard(requester as Profile);
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
