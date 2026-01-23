import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Startup, Profile, STAGE_LABELS, STAGE_COLORS } from '@/types/database';
import { Building2, Calendar, ArrowRight, Zap, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MatchScoreBreakdown } from '@/components/match/MatchScoreBreakdown';
import { TalentAIInsights } from '@/components/ai/TalentAIInsights';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface StartupCardProps {
  startup: Startup;
  interestCount?: number;
  matchScore?: number;
  showTrustScore?: boolean;
  onInvest?: (startup: Startup) => void;
}

function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}

export function StartupCard({ startup, interestCount, matchScore, showTrustScore, onInvest }: StartupCardProps) {
  const { profile } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="transition-all duration-300"
    >
      <Link to={`/startups/${startup.id}`}>
        <Card className="group h-full overflow-hidden border-border/50 bg-card/70 backdrop-blur-sm hover:bg-card/90 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors duration-300">
                  {startup.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{startup.industry}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={STAGE_COLORS[startup.stage]} variant="secondary">
                  {STAGE_LABELS[startup.stage]}
                </Badge>
                {matchScore !== undefined && matchScore > 0 && (
                  <MatchScoreBreakdown score={matchScore} />
                )}
                {/* AI Fit Badge for Talent */}
                {profile?.role === 'talent' && (
                  <TalentAIInsights
                    talent={profile}
                    startup={startup}
                    matchScore={matchScore}
                    variant="badge"
                  />
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4 relative z-10">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {startup.description}
            </p>
          </CardContent>

          <CardFooter className="pt-0 border-t border-border/50 relative z-10">
            <div className="flex flex-col gap-4 w-full pt-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {startup.founder && (
                    <>
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarImage src={getAvatarUrl(startup.founder.avatar_url)} />
                        <AvatarFallback className="text-xs bg-muted">
                          {getInitials(startup.founder.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                        {startup.founder.full_name}
                      </span>
                      {showTrustScore && startup.founder?.trust_score !== undefined && (
                        <div className="flex items-center gap-1 ml-2 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                          <Shield className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-600">
                            {startup.founder.trust_score}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {typeof interestCount === 'number' && (
                    <span className="text-primary font-medium">
                      {interestCount} interested
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(startup.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              {onInvest && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    onInvest(startup);
                  }}
                  className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Zap className="h-4 w-4" />
                  Mark as Investment Opportunity
                </Button>
              )}
              
              <Link to={`/startups/${startup.id}`} className="w-full">
                <Button variant="outline" className="w-full gap-2">
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
