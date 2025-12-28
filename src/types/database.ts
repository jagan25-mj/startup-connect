export type UserRole = 'founder' | 'talent' | 'investor';

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

export interface Match {
  id: string;
  startup_id: string;
  talent_id: string;
  score: number;
  created_at: string;
  updated_at: string;
  startup?: Startup;
  talent?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
  other_participant?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface InvestorInterest {
  id: string;
  investor_id: string;
  startup_id: string;
  created_at: string;
  investor?: Profile;
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

export const SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Machine Learning',
  'Data Science',
  'UI/UX Design',
  'Product Management',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'Business Development',
  'Mobile Development',
  'DevOps',
  'Cloud Computing',
  'Blockchain',
  'Healthcare',
  'Legal',
];
