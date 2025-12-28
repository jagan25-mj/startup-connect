export type UserRole = 'founder' | 'talent';

export type StartupStage = 'idea' | 'mvp' | 'early_stage' | 'growth' | 'scaling';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  bio: string | null;
  skills: string[];
  avatar_url: string | null;
  created_at: string;
}

export interface Startup {
  id: string;
  name: string;
  description: string;
  industry: string;
  stage: StartupStage;
  founder_id: string;
  created_at: string;
  founder?: Profile;
}

export interface StartupInterest {
  id: string;
  startup_id: string;
  user_id: string;
  created_at: string;
  user?: Profile;
  startup?: Startup;
}

export const STAGE_LABELS: Record<StartupStage, string> = {
  idea: 'Idea Stage',
  mvp: 'MVP',
  early_stage: 'Early Stage',
  growth: 'Growth',
  scaling: 'Scaling',
};

export const STAGE_COLORS: Record<StartupStage, string> = {
  idea: 'bg-muted text-muted-foreground',
  mvp: 'bg-primary/10 text-primary',
  early_stage: 'bg-accent/10 text-accent',
  growth: 'bg-success/10 text-success',
  scaling: 'bg-warning/10 text-warning',
};

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'AI/ML',
  'SaaS',
  'Consumer',
  'Enterprise',
  'Gaming',
  'Social Media',
  'Green Tech',
  'Other',
];
