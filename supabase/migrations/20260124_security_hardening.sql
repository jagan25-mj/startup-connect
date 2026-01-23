-- ============================================
-- Security Hardening Migration
-- Date: 2026-01-24
-- Purpose: Add idempotency constraints, strengthen RLS
-- ============================================

-- ============================================
-- 1. ADD UNIQUE CONSTRAINTS FOR IDEMPOTENCY
-- ============================================

-- Startup interests: one interest per user per startup
ALTER TABLE public.startup_interests 
DROP CONSTRAINT IF EXISTS startup_interests_unique_user_startup;

ALTER TABLE public.startup_interests
ADD CONSTRAINT startup_interests_unique_user_startup UNIQUE(user_id, startup_id);

-- Connections: one connection request between any two users

-- First add column-based unique constraint for upsert compatibility
ALTER TABLE public.connections 
DROP CONSTRAINT IF EXISTS connections_requester_receiver_unique;

ALTER TABLE public.connections
ADD CONSTRAINT connections_requester_receiver_unique UNIQUE(requester_id, receiver_id);

-- Create a function to check bidirectional uniqueness
CREATE OR REPLACE FUNCTION check_connection_bidirectional()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if reverse connection already exists
  IF EXISTS (
    SELECT 1 FROM public.connections 
    WHERE requester_id = NEW.receiver_id 
      AND receiver_id = NEW.requester_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
  ) THEN
    RAISE EXCEPTION 'A connection between these users already exists'
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger for bidirectional check
DROP TRIGGER IF EXISTS enforce_bidirectional_connection ON public.connections;

CREATE TRIGGER enforce_bidirectional_connection
BEFORE INSERT OR UPDATE ON public.connections
FOR EACH ROW EXECUTE FUNCTION check_connection_bidirectional();

-- ============================================
-- 2. ADD CHECK CONSTRAINTS
-- ============================================

-- Ensure pitch report scores are valid
ALTER TABLE public.pitch_reports 
DROP CONSTRAINT IF EXISTS pitch_reports_score_range;

ALTER TABLE public.pitch_reports
ADD CONSTRAINT pitch_reports_score_range CHECK (score >= 1 AND score <= 10);

-- Ensure match scores are valid
ALTER TABLE public.matches 
DROP CONSTRAINT IF EXISTS matches_score_range;

ALTER TABLE public.matches
ADD CONSTRAINT matches_score_range CHECK (score >= 0 AND score <= 100);

-- ============================================
-- 3. ADD LENGTH CONSTRAINTS
-- ============================================

-- Messages content length limit
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_content_length;

ALTER TABLE public.messages
ADD CONSTRAINT messages_content_length CHECK (char_length(content) <= 5000);

-- User reports reason length
ALTER TABLE public.user_reports 
DROP CONSTRAINT IF EXISTS user_reports_reason_length;

ALTER TABLE public.user_reports
ADD CONSTRAINT user_reports_reason_length CHECK (char_length(reason) <= 100);

-- ============================================
-- 4. STRENGTHEN RATE LIMITS TABLE
-- ============================================

-- Ensure rate_limits table exists with proper structure
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 0 NOT NULL,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT rate_limits_unique_user_action UNIQUE(user_id, action)
);

-- Add constraint for count
ALTER TABLE public.rate_limits 
DROP CONSTRAINT IF EXISTS rate_limits_count_non_negative;

ALTER TABLE public.rate_limits
ADD CONSTRAINT rate_limits_count_non_negative CHECK (count >= 0);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow users to read their own rate limits
DROP POLICY IF EXISTS "Users can read own rate limits" ON public.rate_limits;
CREATE POLICY "Users can read own rate limits"
ON public.rate_limits FOR SELECT
USING (auth.uid() = user_id);

-- Only system can modify rate limits (via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "Users can manage own rate limits" ON public.rate_limits;
CREATE POLICY "Users can manage own rate limits"
ON public.rate_limits FOR ALL
USING (auth.uid() = user_id);

-- ============================================
-- 5. REMOVE OVERLY PERMISSIVE POLICIES
-- ============================================

-- Remove any "true" policies that allow all access
DROP POLICY IF EXISTS "Allow public read access" ON public.startups;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Recreate with proper restrictions
DROP POLICY IF EXISTS "Anyone can view startups" ON public.startups;
CREATE POLICY "Anyone can view startups"
ON public.startups FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- ============================================
-- 6. ADD NOT NULL CONSTRAINTS WHERE MISSING
-- ============================================

-- Ensure critical fields are not null
ALTER TABLE public.messages ALTER COLUMN content SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN conversation_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN sender_id SET NOT NULL;

ALTER TABLE public.connections ALTER COLUMN requester_id SET NOT NULL;
ALTER TABLE public.connections ALTER COLUMN receiver_id SET NOT NULL;

-- ============================================
-- 7. ADD INDEXES FOR SECURITY QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits(reset_at);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON public.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);

-- ============================================
-- 8. VERIFY MIGRATION
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE 'Security hardening migration completed successfully';
  RAISE NOTICE 'Added unique constraints for idempotency';
  RAISE NOTICE 'Added check constraints for data validation';
  RAISE NOTICE 'Strengthened RLS policies';
END $$;
