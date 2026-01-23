import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { StartupCard } from '@/components/startup/StartupCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Startup, INDUSTRIES, STAGE_LABELS, PitchReport } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Search, Building2, TrendingUp, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SortOption = 'recent' | 'name' | 'stage';

export default function InvestorDashboard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [pitchReports, setPitchReports] = useState<PitchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const { user, profile } = useAuth();
  const ITEMS_PER_PAGE = 12;

  const fetchStartups = useCallback(async () => {
    const { data, error } = await supabase
      .from('startups')
      .select(`
        *,
        founder:profiles!startups_founder_id_fkey(id, full_name, avatar_url, skills)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStartups(data as unknown as Startup[]);
    }
  }, []);

  const fetchPitchReports = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('pitch_reports')
      .select(`
        *,
        startup:startups(id, name, industry, stage)
      `)
      .eq('investor_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPitchReports(data as unknown as PitchReport[]);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStartups(), fetchPitchReports()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStartups, fetchPitchReports]);

  const filteredAndSortedStartups = useMemo(() => {
    let result = startups.filter((startup) => {
      const matchesSearch =
        startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = industryFilter === 'all' || startup.industry === industryFilter;
      const matchesStage = stageFilter === 'all' || startup.stage === stageFilter;

      return matchesSearch && matchesIndustry && matchesStage;
    });

    switch (sortBy) {
      case 'name':
        result = result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'stage':
        const stageOrder = ['idea', 'mvp', 'early_stage', 'growth', 'scaling'];
        result = result.sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));
        break;
      case 'recent':
      default:
        result = result.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return result;
  }, [startups, searchQuery, industryFilter, stageFilter, sortBy]);

  const hasActiveFilters = searchQuery || industryFilter !== 'all' || stageFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setIndustryFilter('all');
    setStageFilter('all');
    setSortBy('recent');
  };

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStartups.length / ITEMS_PER_PAGE);
  const paginatedStartups = filteredAndSortedStartups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, industryFilter, stageFilter, sortBy]);

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'invest': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pass': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'watch': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Investor Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Discover startups and manage your pitch evaluations
            </p>
          </div>
          {profile?.firm_name && (
            <Badge variant="outline" className="gap-2 px-4 py-2">
              <Building2 className="h-4 w-4" />
              {profile.firm_name}
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Startups Reviewed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pitchReports.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Invest Recommendations</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {pitchReports.filter(r => r.recommendation === 'invest').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Startups</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{startups.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">Browse Startups</TabsTrigger>
            <TabsTrigger value="reports">My Pitch Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search startups by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-full md:w-40">
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

                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {Object.entries(STAGE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="stage">By Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {industryFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {industryFilter}
                  </Badge>
                )}
                {stageFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {STAGE_LABELS[stageFilter as keyof typeof STAGE_LABELS]}
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6">
                  Clear all
                </Button>
              </div>
            )}

            {/* Results Count */}
            {!loading && (
              <p className="text-sm text-muted-foreground">
                {filteredAndSortedStartups.length} startup{filteredAndSortedStartups.length !== 1 ? 's' : ''} found
              </p>
            )}

            {/* Results */}
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : filteredAndSortedStartups.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No startups found</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters ? 'Try adjusting your filters' : 'Check back later for new opportunities'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedStartups.map((startup) => (
                    <StartupCard key={startup.id} startup={startup} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : pitchReports.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No pitch reports yet</h3>
                <p className="text-muted-foreground mb-4">
                  Browse startups and create your first pitch evaluation
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pitchReports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 font-bold text-primary text-xl">
                          {report.score}
                        </div>
                        <div>
                          <Link 
                            to={`/startups/${report.startup_id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {report.startup?.name || 'Unknown Startup'}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {report.startup?.industry} • {STAGE_LABELS[report.startup?.stage as keyof typeof STAGE_LABELS] || report.startup?.stage}
                          </p>
                        </div>
                      </div>
                      <Badge className={getRecommendationColor(report.recommendation)}>
                        {report.recommendation.charAt(0).toUpperCase() + report.recommendation.slice(1)}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
