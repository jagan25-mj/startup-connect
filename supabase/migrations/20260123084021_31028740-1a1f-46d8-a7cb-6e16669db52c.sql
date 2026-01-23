-- Add investor to user_role enum  
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'investor';

-- Add investor-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS firm_name TEXT,
ADD COLUMN IF NOT EXISTS investment_stage TEXT,
ADD COLUMN IF NOT EXISTS sectors TEXT[];

-- Create pitch_reports table
CREATE TABLE IF NOT EXISTS public.pitch_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  recommendation TEXT NOT NULL CHECK (recommendation IN ('invest', 'pass', 'watch')),
  summary TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(investor_id, startup_id)
);

-- Enable RLS on pitch_reports
ALTER TABLE public.pitch_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for pitch_reports
CREATE POLICY "Investors can view own pitch reports"
ON public.pitch_reports FOR SELECT
USING (investor_id = auth.uid());

CREATE POLICY "Investors can create own pitch reports"
ON public.pitch_reports FOR INSERT
WITH CHECK (investor_id = auth.uid());

CREATE POLICY "Investors can update own pitch reports"
ON public.pitch_reports FOR UPDATE
USING (investor_id = auth.uid());

CREATE POLICY "Investors can delete own pitch reports"
ON public.pitch_reports FOR DELETE
USING (investor_id = auth.uid());

CREATE POLICY "Founders view reports on their startups"
ON public.pitch_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = pitch_reports.startup_id 
    AND startups.founder_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_pitch_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pitch_reports_updated_at
BEFORE UPDATE ON public.pitch_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_pitch_reports_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pitch_reports_investor_id ON public.pitch_reports(investor_id);
CREATE INDEX IF NOT EXISTS idx_pitch_reports_startup_id ON public.pitch_reports(startup_id);