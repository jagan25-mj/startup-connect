-- ============================================
-- TRUST & SAFETY FEATURES MIGRATION
-- ============================================

-- ===========================================
-- 1. EXTEND PROFILES TABLE
-- ===========================================

-- Add transparency and intent fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS looking_for TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT CHECK (availability IN ('full_time', 'part_time', 'consulting', 'not_available')),
ADD COLUMN IF NOT EXISTS commitment_type TEXT CHECK (commitment_type IN ('cofounder', 'employee', 'contractor', 'advisor'));

-- Add linked accounts for trust verification
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add trust metadata
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Add calculated trust metrics (updated by triggers)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS endorsement_count INTEGER DEFAULT 0;

-- ===========================================
-- 2. CREATE ENDORSEMENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endorsed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('skill', 'work_ethic', 'collaboration')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_endorsement UNIQUE(endorser_id, endorsed_id, type),
  CONSTRAINT no_self_endorsement CHECK (endorser_id != endorsed_id)
);

-- Enable RLS
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for endorsements
CREATE POLICY IF NOT EXISTS "Anyone can view endorsements"
ON public.endorsements FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Users can create endorsements for others"
ON public.endorsements FOR INSERT
WITH CHECK (
  auth.uid() = endorser_id AND
  endorser_id != endorsed_id
);

CREATE POLICY IF NOT EXISTS "Users can delete own endorsements"
ON public.endorsements FOR DELETE
USING (auth.uid() = endorser_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_endorsements_endorsed_id ON public.endorsements(endorsed_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser_id ON public.endorsements(endorser_id);

-- ===========================================
-- 3. CREATE USER REPORTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'fake_profile', 'harassment', 'misuse', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT no_self_report CHECK (reporter_id != reported_id)
);

-- Enable RLS
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports (users can only see their own reports)
CREATE POLICY IF NOT EXISTS "Users can view own reports"
ON public.user_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY IF NOT EXISTS "Users can create reports"
ON public.user_reports FOR INSERT
WITH CHECK (
  auth.uid() = reporter_id AND
  reporter_id != reported_id
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_id ON public.user_reports(reported_id);

-- ===========================================
-- 4. CREATE RATE LIMITS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('interest', 'message', 'report', 'endorsement')),
  count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day'),
  CONSTRAINT unique_rate_limit UNIQUE(user_id, action_type)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see/update their own limits)
CREATE POLICY IF NOT EXISTS "Users can view own rate limits"
ON public.rate_limits FOR SELECT
USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);

-- ===========================================
-- 5. TRUST SCORE CALCULATION FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.calculate_trust_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 0;
  v_profile profiles%ROWTYPE;
  v_endorsement_count INTEGER;
BEGIN
  -- Get profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- Profile completeness (max 30 points)
  IF v_profile.bio IS NOT NULL AND length(v_profile.bio) > 10 THEN 
    v_score := v_score + 10; 
  END IF;
  
  IF v_profile.skills IS NOT NULL AND array_length(v_profile.skills, 1) >= 3 THEN 
    v_score := v_score + 10; 
  END IF;
  
  IF v_profile.avatar_url IS NOT NULL THEN 
    v_score := v_score + 10; 
  END IF;
  
  -- Linked accounts (max 20 points)
  IF v_profile.github_url IS NOT NULL THEN 
    v_score := v_score + 10; 
  END IF;
  
  IF v_profile.linkedin_url IS NOT NULL THEN 
    v_score := v_score + 10; 
  END IF;
  
  -- Account age (max 20 points)
  IF v_profile.created_at < NOW() - INTERVAL '30 days' THEN 
    v_score := v_score + 10; 
  END IF;
  
  IF v_profile.created_at < NOW() - INTERVAL '90 days' THEN 
    v_score := v_score + 10; 
  END IF;
  
  -- Activity (max 15 points)
  IF v_profile.last_active_at IS NOT NULL AND v_profile.last_active_at > NOW() - INTERVAL '7 days' THEN 
    v_score := v_score + 15; 
  END IF;
  
  -- Endorsements (max 15 points, 3 points each up to 5)
  SELECT COUNT(*) INTO v_endorsement_count FROM endorsements WHERE endorsed_id = p_user_id;
  v_score := v_score + LEAST(15, v_endorsement_count * 3);
  
  RETURN LEAST(100, v_score);
END;
$$;

-- ===========================================
-- 6. PROFILE COMPLETENESS FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.calculate_profile_completeness(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 0;
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- Basic info (40%)
  IF v_profile.full_name IS NOT NULL AND length(v_profile.full_name) > 1 THEN 
    v_score := v_score + 10; 
  END IF;
  
  IF v_profile.bio IS NOT NULL AND length(v_profile.bio) > 20 THEN 
    v_score := v_score + 15; 
  END IF;
  
  IF v_profile.avatar_url IS NOT NULL THEN 
    v_score := v_score + 15; 
  END IF;
  
  -- Skills (20%)
  IF v_profile.skills IS NOT NULL AND array_length(v_profile.skills, 1) >= 1 THEN 
    v_score := v_score + 10; 
  END IF;
  
  IF v_profile.skills IS NOT NULL AND array_length(v_profile.skills, 1) >= 3 THEN 
    v_score := v_score + 10; 
  END IF;
  
  -- Intent (20%)
  IF v_profile.looking_for IS NOT NULL THEN 
    v_score := v_score + 10; 
  END IF;
  
  IF v_profile.availability IS NOT NULL THEN 
    v_score := v_score + 10; 
  END IF;
  
  -- Social links (20%)
  IF v_profile.github_url IS NOT NULL THEN 
    v_score := v_score + 10; 
  END IF;
  
  IF v_profile.linkedin_url IS NOT NULL THEN 
    v_score := v_score + 10; 
  END IF;
  
  RETURN LEAST(100, v_score);
END;
$$;

-- ===========================================
-- 7. TRIGGER TO UPDATE TRUST METRICS
-- ===========================================

CREATE OR REPLACE FUNCTION public.update_trust_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update trust score and profile completeness
  UPDATE profiles
  SET 
    trust_score = calculate_trust_score(NEW.id),
    profile_completeness = calculate_profile_completeness(NEW.id),
    last_active_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profile updates
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_metrics();

-- ===========================================
-- 8. TRIGGER TO UPDATE ENDORSEMENT COUNT
-- ===========================================

CREATE OR REPLACE FUNCTION public.update_endorsement_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET endorsement_count = (SELECT COUNT(*) FROM endorsements WHERE endorsed_id = NEW.endorsed_id)
    WHERE id = NEW.endorsed_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET endorsement_count = (SELECT COUNT(*) FROM endorsements WHERE endorsed_id = OLD.endorsed_id)
    WHERE id = OLD.endorsed_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_endorsement_changed ON public.endorsements;
CREATE TRIGGER on_endorsement_changed
  AFTER INSERT OR DELETE ON public.endorsements
  FOR EACH ROW
  EXECUTE FUNCTION update_endorsement_count();

-- ===========================================
-- 9. RATE LIMIT CHECK FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_count INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record rate_limits%ROWTYPE;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_record 
  FROM rate_limits 
  WHERE user_id = p_user_id AND action_type = p_action_type;
  
  IF NOT FOUND THEN
    -- Create new record
    INSERT INTO rate_limits (user_id, action_type, count, reset_at)
    VALUES (p_user_id, p_action_type, 1, NOW() + INTERVAL '1 day');
    RETURN TRUE;
  END IF;
  
  -- Check if reset is needed
  IF v_record.reset_at < NOW() THEN
    UPDATE rate_limits
    SET count = 1, reset_at = NOW() + INTERVAL '1 day'
    WHERE id = v_record.id;
    RETURN TRUE;
  END IF;
  
  -- Check limit
  IF v_record.count >= p_max_count THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  UPDATE rate_limits
  SET count = count + 1
  WHERE id = v_record.id;
  
  RETURN TRUE;
END;
$$;

-- ===========================================
-- 10. ENABLE REALTIME FOR NEW TABLES
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.endorsements;

-- ===========================================
-- DONE
-- ===========================================
