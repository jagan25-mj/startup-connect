import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { StartupCard } from '@/components/startup/StartupCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Startup, INDUSTRIES, STAGE_LABELS, SKILLS, Match } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Search, Plus, Rocket, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

type SortOption = 'recent' | 'matched' | 'name';

export default function StartupsList() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchStartups();
    if (user && profile?.role === 'talent') {
      fetchMatches();
    }
  }, [user, profile]);

  const fetchStartups = async () => {
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
    setLoading(false);
  };

  const fetchMatches = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('talent_id', user.id);

    if (!error && data) {
      setMatches(data as Match[]);
    }
  };

  const getMatchScore = (startupId: string): number => {
    const match = matches.find((m) => m.startup_id === startupId);
    return match?.score || 0;
  };

  const filteredAndSortedStartups = useMemo(() => {
    let result = startups.filter((startup) => {
      const matchesSearch = 
        startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = industryFilter === 'all' || startup.industry === industryFilter;
      const matchesStage = stageFilter === 'all' || startup.stage === stageFilter;
      
      // Skill filter - check if founder has any of the selected skills
      const matchesSkills = skillFilters.length === 0 || 
        (startup.founder?.skills && 
          skillFilters.some(skill => startup.founder?.skills?.includes(skill)));
      
      return matchesSearch && matchesIndustry && matchesStage && matchesSkills;
    });

    // Sort
    switch (sortBy) {
      case 'matched':
        result = result.sort((a, b) => getMatchScore(b.id) - getMatchScore(a.id));
        break;
      case 'name':
        result = result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
      default:
        result = result.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return result;
  }, [startups, searchQuery, industryFilter, stageFilter, skillFilters, sortBy, matches]);

  const toggleSkillFilter = (skill: string) => {
    setSkillFilters((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setIndustryFilter('all');
    setStageFilter('all');
    setSkillFilters([]);
    setSortBy('recent');
  };

  const hasActiveFilters = searchQuery || industryFilter !== 'all' || stageFilter !== 'all' || skillFilters.length > 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Explore Startups</h1>
            <p className="text-muted-foreground mt-1">
              Discover innovative startups and find your next opportunity
            </p>
          </div>
          {profile?.role === 'founder' && (
            <Button asChild variant="gradient">
              <Link to="/startups/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Startup
              </Link>
            </Button>
          )}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-4 md:flex-row mb-6">
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
                {profile?.role === 'talent' && (
                  <SelectItem value="matched">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Best Match
                    </span>
                  </SelectItem>
                )}
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {skillFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {skillFilters.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>
                    Filter startups by founder skills
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Skills</h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {SKILLS.map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill}
                            checked={skillFilters.includes(skill)}
                            onCheckedChange={() => toggleSkillFilter(skill)}
                          />
                          <Label htmlFor={skill} className="text-sm cursor-pointer">
                            {skill}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {industryFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {industryFilter}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setIndustryFilter('all')} 
                />
              </Badge>
            )}
            {stageFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {STAGE_LABELS[stageFilter as keyof typeof STAGE_LABELS]}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setStageFilter('all')} 
                />
              </Badge>
            )}
            {skillFilters.map((skill) => (
              <Badge key={skill} variant="secondary" className="gap-1">
                {skill}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleSkillFilter(skill)} 
                />
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs h-6"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
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
              <Rocket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No startups found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Be the first to create a startup!'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
            {!hasActiveFilters && profile?.role === 'founder' && (
              <Button asChild variant="gradient">
                <Link to="/startups/create">Create Startup</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedStartups.map((startup) => (
              <StartupCard 
                key={startup.id} 
                startup={startup} 
                matchScore={profile?.role === 'talent' ? getMatchScore(startup.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
