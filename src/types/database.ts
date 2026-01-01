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
  // Trust & transparency fields
  looking_for: string | null;
  availability: 'full_time' | 'part_time' | 'consulting' | 'not_available' | null;
  commitment_type: 'cofounder' | 'employee' | 'contractor' | 'advisor' | null;
  github_url: string | null;
  linkedin_url: string | null;
  email_verified: boolean;
  last_active_at: string | null;
  trust_score: number;
  profile_completeness: number;
  endorsement_count: number;
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

// Trust & Safety Types
export type EndorsementType = 'skill' | 'work_ethic' | 'collaboration';
export type ReportReason = 'spam' | 'fake_profile' | 'harassment' | 'misuse' | 'other';
export type AvailabilityType = 'full_time' | 'part_time' | 'consulting' | 'not_available';
export type CommitmentType = 'cofounder' | 'employee' | 'contractor' | 'advisor';

export interface Endorsement {
  id: string;
  endorser_id: string;
  endorsed_id: string;
  type: EndorsementType;
  created_at: string;
  endorser?: Profile;
}

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  details: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
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
