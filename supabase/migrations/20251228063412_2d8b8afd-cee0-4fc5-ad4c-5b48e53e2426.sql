-- Create matches table for storing talent-startup match scores
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(startup_id, talent_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  related_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for matches
-- Talents can view their own matches
CREATE POLICY "Talents can view own matches"
ON public.matches FOR SELECT
USING (auth.uid() = talent_id);

-- Founders can view matches for their startups
CREATE POLICY "Founders can view startup matches"
ON public.matches FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.startups
  WHERE startups.id = matches.startup_id
  AND startups.founder_id = auth.uid()
));

-- Matches are managed ONLY by SECURITY DEFINER functions and triggers
-- No direct user access allowed - preventing unauthorized match creation

-- RLS policies for notifications
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Authenticated users can only insert their own notifications via SECURITY DEFINER functions
CREATE POLICY "Authenticated users can insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_matches_startup_id ON public.matches(startup_id);
CREATE INDEX idx_matches_talent_id ON public.matches(talent_id);
CREATE INDEX idx_matches_score ON public.matches(score DESC);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_startups_industry ON public.startups(industry);
CREATE INDEX idx_startups_stage ON public.startups(stage);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.startup_interests;

-- Function to calculate match score between a talent and startup
CREATE OR REPLACE FUNCTION public.calculate_match_score(
  p_talent_id uuid,
  p_startup_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_skills text[];
  v_startup_industry text;
  v_startup_stage startup_stage;
  v_founder_skills text[];
  v_skill_overlap integer := 0;
  v_industry_match integer := 0;
  v_stage_bonus integer := 0;
  v_total_score integer := 0;
BEGIN
  -- Get talent skills
  SELECT skills INTO v_talent_skills
  FROM profiles WHERE id = p_talent_id;
  
  -- Get startup details and founder skills
  SELECT s.industry, s.stage, p.skills
  INTO v_startup_industry, v_startup_stage, v_founder_skills
  FROM startups s
  JOIN profiles p ON p.id = s.founder_id
  WHERE s.id = p_startup_id;
  
  -- Calculate skill overlap (max 50 points)
  IF v_talent_skills IS NOT NULL AND v_founder_skills IS NOT NULL THEN
    SELECT COUNT(*) INTO v_skill_overlap
    FROM unnest(v_talent_skills) t
    WHERE t = ANY(v_founder_skills);
    
    v_skill_overlap := LEAST(v_skill_overlap * 10, 50);
  END IF;
  
  -- Industry relevance bonus (max 30 points)
  IF v_startup_industry IS NOT NULL THEN
    -- Check if any talent skill relates to industry
    IF v_talent_skills IS NOT NULL THEN
      IF v_startup_industry = ANY(v_talent_skills) OR
         LOWER(v_startup_industry) = ANY(SELECT LOWER(unnest(v_talent_skills))) THEN
        v_industry_match := 30;
      ELSIF v_startup_industry IN ('Technology', 'AI/ML', 'SaaS') AND 
            ARRAY['JavaScript', 'Python', 'React', 'Node.js', 'Machine Learning', 'Data Science'] && v_talent_skills THEN
        v_industry_match := 20;
      ELSIF v_startup_industry = 'Healthcare' AND 
            ARRAY['Healthcare', 'Medical', 'Biology', 'Research'] && v_talent_skills THEN
        v_industry_match := 20;
      ELSIF v_startup_industry = 'Finance' AND 
            ARRAY['Finance', 'Accounting', 'Analytics', 'Data Analysis'] && v_talent_skills THEN
        v_industry_match := 20;
      ELSE
        v_industry_match := 10;
      END IF;
    END IF;
  END IF;
  
  -- Stage bonus (max 20 points) - early stages need more help
  CASE v_startup_stage
    WHEN 'idea' THEN v_stage_bonus := 20;
    WHEN 'mvp' THEN v_stage_bonus := 18;
    WHEN 'early_stage' THEN v_stage_bonus := 15;
    WHEN 'growth' THEN v_stage_bonus := 10;
    WHEN 'scaling' THEN v_stage_bonus := 5;
    ELSE v_stage_bonus := 10;
  END CASE;
  
  v_total_score := v_skill_overlap + v_industry_match + v_stage_bonus;
  
  RETURN LEAST(v_total_score, 100);
END;
$$;

-- Function to generate matches for a startup
CREATE OR REPLACE FUNCTION public.generate_startup_matches(p_startup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent record;
  v_score integer;
BEGIN
  -- Get all talents and calculate their match scores
  FOR v_talent IN 
    SELECT id FROM profiles WHERE role = 'talent'
  LOOP
    v_score := calculate_match_score(v_talent.id, p_startup_id);
    
    -- Only store matches with score > 20
    IF v_score > 20 THEN
      INSERT INTO matches (startup_id, talent_id, score)
      VALUES (p_startup_id, v_talent.id, v_score)
      ON CONFLICT (startup_id, talent_id) 
      DO UPDATE SET score = v_score, updated_at = now();
    END IF;
  END LOOP;
END;
$$;

-- Function to generate matches for a talent
CREATE OR REPLACE FUNCTION public.generate_talent_matches(p_talent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_startup record;
  v_score integer;
BEGIN
  -- Get all startups and calculate match scores
  FOR v_startup IN 
    SELECT id FROM startups
  LOOP
    v_score := calculate_match_score(p_talent_id, v_startup.id);
    
    -- Only store matches with score > 20
    IF v_score > 20 THEN
      INSERT INTO matches (startup_id, talent_id, score)
      VALUES (v_startup.id, p_talent_id, v_score)
      ON CONFLICT (startup_id, talent_id) 
      DO UPDATE SET score = v_score, updated_at = now();
    END IF;
  END LOOP;
END;
$$;

-- Trigger to auto-generate matches when startup is created
CREATE OR REPLACE FUNCTION public.on_startup_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM generate_startup_matches(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER startup_created_trigger
AFTER INSERT ON public.startups
FOR EACH ROW
EXECUTE FUNCTION on_startup_created();

-- Trigger to regenerate matches when talent updates skills
CREATE OR REPLACE FUNCTION public.on_profile_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'talent' AND (OLD.skills IS DISTINCT FROM NEW.skills) THEN
    PERFORM generate_talent_matches(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_updated_trigger
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION on_profile_updated();

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_related_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, related_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger to notify founder when someone shows interest
CREATE OR REPLACE FUNCTION public.on_interest_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_founder_id uuid;
  v_startup_name text;
  v_talent_name text;
BEGIN
  -- Get startup founder and name
  SELECT founder_id, name INTO v_founder_id, v_startup_name
  FROM startups WHERE id = NEW.startup_id;
  
  -- Get talent name
  SELECT full_name INTO v_talent_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification for founder
  PERFORM create_notification(
    v_founder_id,
    'New Interest!',
    v_talent_name || ' is interested in ' || v_startup_name,
    'interest',
    NEW.startup_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER interest_created_trigger
AFTER INSERT ON public.startup_interests
FOR EACH ROW
EXECUTE FUNCTION on_interest_created();

-- Add unique constraint to prevent duplicate interests
ALTER TABLE public.startup_interests 
ADD CONSTRAINT unique_startup_interest UNIQUE (startup_id, user_id);