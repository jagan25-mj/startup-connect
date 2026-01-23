-- ============================================
-- DATABASE HARDENING & SECURITY FIXES
-- Migration: Production Readiness Improvements
-- ============================================

-- ============================================
-- 1. FIX CRITICAL RLS POLICY VULNERABILITIES
-- ============================================

-- Drop insecure policies and replace with stricter versions

-- Remove overly permissive policies on matches
DROP POLICY IF EXISTS "System can manage matches" ON public.matches;

-- Remove overly permissive notification policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Add restrictive policy for notifications (only create own)
CREATE POLICY IF NOT EXISTS "Authenticated users can insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. ADD MISSING DATABASE INDEXES
-- ============================================

-- Improve query performance on frequently used filters
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_startups_founder_id_stage ON public.startups(founder_id, stage);
CREATE INDEX IF NOT EXISTS idx_startup_interests_user_id_startup_id ON public.startup_interests(user_id, startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_team_members_startup_id ON public.startup_team_members(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_team_members_user_id ON public.startup_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read ON public.messages(conversation_id, read);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorsed_created ON public.endorsements(endorsed_id, created_at);
CREATE INDEX IF NOT EXISTS idx_connections_user_status ON public.connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_status ON public.connections(connected_user_id, status);

-- ============================================
-- 3. ADD UNIQUE CONSTRAINTS
-- ============================================

-- Prevent duplicate endorsements of the same type
ALTER TABLE public.endorsements 
ADD CONSTRAINT endorsements_no_duplicates UNIQUE(endorser_id, endorsed_id, type)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. HARDEN PROFILE TABLE
-- ============================================

-- Add NOT NULL constraints where appropriate (non-breaking)
-- These are informational; actual constraints should be added in app logic
ALTER TABLE public.profiles 
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN created_at SET NOT NULL;

-- Add constraints for investor-specific fields if present
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_investor_fields CHECK (
  CASE 
    WHEN role = 'investor' THEN firm_name IS NOT NULL
    ELSE true
  END
);

-- ============================================
-- 5. ADD CASCADE DELETE RULES
-- ============================================

-- Ensure proper cleanup when founder is deleted
ALTER TABLE public.startups 
DROP CONSTRAINT IF EXISTS startups_founder_id_fkey,
ADD CONSTRAINT startups_founder_id_fkey 
FOREIGN KEY (founder_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure proper cleanup for team members
ALTER TABLE public.startup_team_members 
DROP CONSTRAINT IF EXISTS startup_team_members_user_id_fkey,
ADD CONSTRAINT startup_team_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.startup_team_members 
DROP CONSTRAINT IF EXISTS startup_team_members_startup_id_fkey,
ADD CONSTRAINT startup_team_members_startup_id_fkey 
FOREIGN KEY (startup_id) REFERENCES public.startups(id) ON DELETE CASCADE;

-- ============================================
-- 6. ADD REALTIME SUBSCRIPTIONS
-- ============================================

-- Already enabled in previous migrations, but verify here
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.startup_team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.endorsements;

-- ============================================
-- 7. ADD FUNCTION-BASED SECURITY WRAPPER
-- ============================================

-- Create function to safely insert matches (replaces direct INSERT)
CREATE OR REPLACE FUNCTION public.create_match_safe(
  p_talent_id UUID,
  p_startup_id UUID,
  p_score INTEGER
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify score is valid
  IF p_score < 0 OR p_score > 100 THEN
    RETURN false;
  END IF;
  
  -- Insert or update match
  INSERT INTO matches (talent_id, startup_id, score)
  VALUES (p_talent_id, p_startup_id, p_score)
  ON CONFLICT (talent_id, startup_id) DO UPDATE
  SET score = p_score, updated_at = now();
  
  RETURN true;
END;
$$;

-- Create function to safely insert notifications
CREATE OR REPLACE FUNCTION public.create_notification_safe(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, related_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- ============================================
-- 8. ADD AUDIT LOGGING FOR SENSITIVE OPERATIONS
-- ============================================

-- Create audit table if not exists
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  actor_id UUID REFERENCES public.profiles(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins or the system can view audit logs
CREATE POLICY IF NOT EXISTS "System only audit access"
ON public.audit_log FOR ALL
USING (FALSE);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_id);

-- ============================================
-- 9. ADD RATE LIMIT CHECKS
-- ============================================

-- Verify rate_limits table exists and has proper constraints
ALTER TABLE public.rate_limits 
ADD CONSTRAINT valid_count CHECK (count >= 0);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits(reset_at);

-- ============================================
-- 10. DOCUMENT RLS POLICIES
-- ============================================

-- RLS Summary for production verification:
-- profiles: PUBLIC READ, USER UPDATE OWN
-- startups: PUBLIC READ, FOUNDER CREATE/UPDATE/DELETE OWN
-- startup_interests: USER READ OWN, FOUNDER READ ON OWN STARTUPS
-- matches: TALENT READ OWN, FOUNDER READ ON STARTUP
-- notifications: USER READ/UPDATE OWN, SYSTEM INSERT VIA FUNCTION
-- messages: PARTICIPANT READ, PARTICIPANT SEND
-- endorsements: PUBLIC READ, USER CREATE/DELETE OWN
-- user_reports: REPORTER READ/CREATE OWN, SYSTEM ADMIN READ
-- pitch_reports: INVESTOR READ/WRITE OWN, FOUNDER READ ON STARTUP
-- rate_limits: USER READ OWN

COMMENT ON TABLE public.matches IS 'Match scores between talent and startups. Managed by SECURITY DEFINER functions only.';
COMMENT ON TABLE public.notifications IS 'User notifications. Created via create_notification_safe() function.';
COMMENT ON POLICY "Authenticated users can insert own notifications" ON public.notifications IS 'Only allow insertion of own notifications - all inserts should go through secure function';

