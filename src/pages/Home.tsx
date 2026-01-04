import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket,
  Search,
  TrendingUp,
  Clock,
  Users,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { STAGE_LABELS, STAGE_COLORS, INDUSTRIES } from '@/types/database';
import type { Startup, Profile, StartupStage } from '@/types/database';
import { ActivityFeed } from '@/components/activity/ActivityFeed';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}

type SortOption = 'recent' | 'trending' | 'newest';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const { data: startups, isLoading } = useQuery({
    queryKey: ['all-startups', sortBy],
    queryFn: async () => {
      // Fetch startups with founder info
      const { data: startupsData, error: startupsError } = await supabase
        .from('startups')
        .select(`
          *,
          founder:profiles!startups_founder_id_fkey(id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (startupsError) throw startupsError;

      // Fetch interest counts for each startup
      const startupIds = startupsData?.map(s => s.id) || [];
      
      if (startupIds.length > 0) {
        const { data: interests } = await supabase
          .from('startup_interests')
          .select('startup_id')
          .in('startup_id', startupIds);

        // Count interests per startup
        const interestCounts: Record<string, number> = {};
        interests?.forEach(i => {
          interestCounts[i.startup_id] = (interestCounts[i.startup_id] || 0) + 1;
        });

        // Add interest count to startups
        const startupsWithCounts = startupsData?.map(s => ({
          ...s,
          interest_count: interestCounts[s.id] || 0,
        })) || [];

        return startupsWithCounts as (Startup & { founder?: Profile; interest_count: number })[];
      }

      return (startupsData?.map(s => ({ ...s, interest_count: 0 })) || []) as (Startup & { founder?: Profile; interest_count: number })[];
    },
  });

  // Filter and sort startups
  const filteredStartups = startups
    ?.filter((startup) => {
      const matchesSearch =
        !searchQuery ||
        startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.industry.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesIndustry = industryFilter === 'all' || startup.industry === industryFilter;

      return matchesSearch && matchesIndustry;
    })
    .sort((a, b) => {
      if (sortBy === 'trending') {
        return (b.interest_count || 0) - (a.interest_count || 0);
      }
      // Default: newest/recent
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover <span className="text-gradient">Startups</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore innovative startups, follow their progress, and find opportunities to collaborate.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search startups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Most Recent
                    </div>
                  </SelectItem>
                  <SelectItem value="trending">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Trending
                    </div>
                  </SelectItem>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Newest
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Startups Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                All Startups
              </h2>
              <Badge variant="secondary">
                {filteredStartups?.length || 0} startups
              </Badge>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : filteredStartups && filteredStartups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStartups.map((startup, index) => (
                  <motion.div
                    key={startup.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/startups/${startup.id}`}>
                      <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                                {startup.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {startup.industry}
                                </Badge>
                                <Badge className={`text-xs ${STAGE_COLORS[startup.stage as StartupStage]}`}>
                                  {STAGE_LABELS[startup.stage as StartupStage]}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {startup.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 border border-border">
                                <AvatarImage src={getAvatarUrl(startup.founder?.avatar_url)} />
                                <AvatarFallback className="text-xs bg-muted">
                                  {startup.founder?.full_name ? getInitials(startup.founder.full_name) : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                                {startup.founder?.full_name}
                              </span>
                            </div>

                            {startup.interest_count > 0 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{startup.interest_count}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <Rocket className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No startups found</p>
                  <p className="text-sm">Try adjusting your search or filters.</p>
                </div>
              </Card>
            )}
          </div>

          {/* Activity Feed Sidebar */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </Layout>
  );
}