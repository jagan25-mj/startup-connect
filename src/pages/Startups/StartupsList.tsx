import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { StartupCard } from '@/components/startup/StartupCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Startup, INDUSTRIES, StartupStage, STAGE_LABELS } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Search, Plus, Rocket } from 'lucide-react';

export default function StartupsList() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const { profile } = useAuth();

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    const { data, error } = await supabase
      .from('startups')
      .select(`
        *,
        founder:profiles!startups_founder_id_fkey(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStartups(data as unknown as Startup[]);
    }
    setLoading(false);
  };

  const filteredStartups = startups.filter((startup) => {
    const matchesSearch = 
      startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || startup.industry === industryFilter;
    const matchesStage = stageFilter === 'all' || startup.stage === stageFilter;
    return matchesSearch && matchesIndustry && matchesStage;
  });

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

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row mb-8">
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
            <SelectTrigger className="w-full md:w-48">
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
            <SelectTrigger className="w-full md:w-48">
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
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredStartups.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Rocket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No startups found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || industryFilter !== 'all' || stageFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Be the first to create a startup!'}
            </p>
            {profile?.role === 'founder' && (
              <Button asChild variant="gradient">
                <Link to="/startups/create">Create Startup</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredStartups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
