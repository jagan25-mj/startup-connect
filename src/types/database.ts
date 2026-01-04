export type UserRole = 'founder' | 'talent';

export type StartupStage = 'idea' | 'mvp' | 'early_stage' | 'growth' | 'scaling';

export type AchievementType = 'hackathon' | 'internship' | 'project' | 'certification' | 'award';

export type UpdateTag = 'milestone' | 'update' | 'looking_for_talent';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  bio: string | null;
  skills: string[];
  avatar_url: string | null;
  created_at: string;
  resume_url?: string | null;
  resume_filename?: string | null;
  resume_uploaded_at?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
}

export interface ProfileAchievement {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  achievement_type: AchievementType;
  year: number | null;
  proof_link: string | null;
  created_at: string;
  updated_at: string;
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
  interest_count?: number;
}

export interface StartupInterest {
  id: string;
  startup_id: string;
  user_id: string;
  created_at: string;
  user?: Profile;
  startup?: Startup;
}

export interface StartupUpdate {
  id: string;
  startup_id: string;
  title: string;
  description: string | null;
  tag: UpdateTag | null;
  created_at: string;
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

export const UPDATE_TAG_LABELS: Record<UpdateTag, string> = {
  milestone: 'Milestone',
  update: 'Update',
  looking_for_talent: 'Looking for Talent',
};

export const UPDATE_TAG_COLORS: Record<UpdateTag, string> = {
  milestone: 'bg-success/10 text-success border-success/20',
  update: 'bg-primary/10 text-primary border-primary/20',
  looking_for_talent: 'bg-accent/10 text-accent border-accent/20',
};

export const ACHIEVEMENT_TYPE_LABELS: Record<AchievementType, string> = {
  hackathon: 'Hackathon',
  internship: 'Internship',
  project: 'Project',
  certification: 'Certification',
  award: 'Award',
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