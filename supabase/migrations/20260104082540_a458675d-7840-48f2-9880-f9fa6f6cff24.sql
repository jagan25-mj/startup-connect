-- Add resume fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS resume_filename TEXT,
ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Create profile_achievements table
CREATE TABLE IF NOT EXISTS public.profile_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('hackathon', 'internship', 'project', 'certification', 'award')),
  year INTEGER,
  proof_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profile_achievements
ALTER TABLE public.profile_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profile_achievements
CREATE POLICY "Anyone can view achievements"
  ON public.profile_achievements
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own achievements"
  ON public.profile_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON public.profile_achievements
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements"
  ON public.profile_achievements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_achievements_user_id ON public.profile_achievements(user_id);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_achievement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profile_achievements_updated_at
  BEFORE UPDATE ON public.profile_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_achievement_updated_at();

-- Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', true, 2097152, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes bucket
CREATE POLICY "Resume files are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'resumes');

CREATE POLICY "Users can upload their own resume"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own resume"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resume"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);