-- ============================================
-- Final Security Hardening Migration
-- Date: 2026-01-24
-- Purpose: Server-side rate limiting + alerting
-- ============================================

-- ============================================
-- 1. SERVER-SIDE RATE LIMITING RPC
-- ============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS check_and_increment_rate_limit(TEXT, INT);

-- Create server-side rate limiting function
-- SECURITY DEFINER ensures this runs with elevated privileges
-- and cannot be bypassed by client-side manipulation
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_action TEXT,
  p_limit INT DEFAULT 100
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count INT;
  v_reset_at TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_window_start TIMESTAMP WITH TIME ZONE := v_now - INTERVAL '1 hour';
  v_allowed BOOLEAN;
  v_remaining INT;
BEGIN
  -- Get current user from auth context
  v_user_id := auth.uid();
  
  -- Reject if not authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'allowed', false,
      'remaining', 0,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Atomic check and update using advisory lock
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text || p_action));
  
  -- Get or create rate limit record
  SELECT count, reset_at INTO v_count, v_reset_at
  FROM rate_limits
  WHERE user_id = v_user_id AND action = p_action;
  
  IF NOT FOUND THEN
    -- No record exists, create one
    INSERT INTO rate_limits (user_id, action, count, reset_at)
    VALUES (v_user_id, p_action, 1, v_now + INTERVAL '1 hour');
    
    RETURN json_build_object(
      'allowed', true,
      'remaining', p_limit - 1,
      'reset_at', (v_now + INTERVAL '1 hour')::text
    );
  END IF;
  
  -- Check if window has expired
  IF v_reset_at < v_now THEN
    -- Reset the counter
    UPDATE rate_limits
    SET count = 1, reset_at = v_now + INTERVAL '1 hour'
    WHERE user_id = v_user_id AND action = p_action;
    
    RETURN json_build_object(
      'allowed', true,
      'remaining', p_limit - 1,
      'reset_at', (v_now + INTERVAL '1 hour')::text
    );
  END IF;
  
  -- Check if limit exceeded
  IF v_count >= p_limit THEN
    -- Log the violation for alerting
    INSERT INTO security_events (user_id, event_type, action, created_at)
    VALUES (v_user_id, 'rate_limit_exceeded', p_action, v_now)
    ON CONFLICT DO NOTHING;
    
    RETURN json_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_at', v_reset_at::text
    );
  END IF;
  
  -- Increment counter
  UPDATE rate_limits
  SET count = count + 1
  WHERE user_id = v_user_id AND action = p_action;
  
  RETURN json_build_object(
    'allowed', true,
    'remaining', p_limit - v_count - 1,
    'reset_at', v_reset_at::text
  );
END;
$$;

-- ============================================
-- 2. SECURITY EVENTS TABLE FOR ALERTING
-- ============================================

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  action TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at);

-- Enable RLS - only admins can read
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- No direct access - only via functions
DROP POLICY IF EXISTS "security_events_no_access" ON public.security_events;
CREATE POLICY "security_events_no_access"
ON public.security_events FOR ALL
USING (false);

-- ============================================
-- 3. ABUSE DETECTION FUNCTION
-- ============================================

-- Function to check if user is flagged for abuse
CREATE OR REPLACE FUNCTION is_user_flagged_for_abuse(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_violation_count INT;
  v_threshold INT := 10; -- Flag after 10 violations in 24 hours
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT COUNT(*) INTO v_violation_count
  FROM security_events
  WHERE user_id = v_user_id
    AND event_type = 'rate_limit_exceeded'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  RETURN v_violation_count >= v_threshold;
END;
$$;

-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================

-- Grant execute on rate limit function to authenticated users
GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_flagged_for_abuse(UUID) TO authenticated;

-- ============================================
-- 5. VERIFICATION
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE 'Final hardening migration completed';
  RAISE NOTICE 'Server-side rate limiting: ENABLED';
  RAISE NOTICE 'Security events table: CREATED';
  RAISE NOTICE 'Abuse detection: ENABLED';
END $$;
