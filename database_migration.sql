-- First, update the enum to include 'investor' if not already present
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t 
                 JOIN pg_enum e ON t.oid = e.enumtypid 
                 WHERE t.typname = 'user_role' AND e.enumlabel = 'investor') THEN
    ALTER TYPE public.user_role ADD VALUE 'investor';
  END IF;
END $$;

-- Drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_role user_role;
BEGIN
  -- Extract full name with fallback
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    NEW.email,
    'New User'
  );
  
  -- Extract and validate role with fallback
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'talent'::user_role
  );
  
  -- Insert profile with explicit error handling
  BEGIN
    INSERT INTO public.profiles (id, full_name, role, skills, bio, avatar_url)
    VALUES (
      NEW.id,
      v_full_name,
      v_role,
      ARRAY[]::TEXT[],
      NULL,
      NULL
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, update it instead
      UPDATE public.profiles
      SET full_name = v_full_name,
          role = v_role
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Log the error and re-raise
      RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
      RAISE;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Catch any other errors and log them
    RAISE WARNING 'Unexpected error in handle_new_user for %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Create investor_interests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.investor_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_investor_interest UNIQUE(investor_id, startup_id)
);

-- Enable RLS on investor_interests
ALTER TABLE public.investor_interests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Investors can view own interests" ON public.investor_interests;
DROP POLICY IF EXISTS "Founders can view investor interests on their startups" ON public.investor_interests;
DROP POLICY IF EXISTS "Investors can express interest" ON public.investor_interests;
DROP POLICY IF EXISTS "Investors can remove own interest" ON public.investor_interests;

-- RLS Policies for investor_interests
CREATE POLICY "Investors can view own interests"
ON public.investor_interests FOR SELECT
USING (auth.uid() = investor_id);

CREATE POLICY "Founders can view investor interests on their startups"
ON public.investor_interests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.startups
    WHERE id = startup_id AND founder_id = auth.uid()
  )
);

CREATE POLICY "Investors can express interest"
ON public.investor_interests FOR INSERT
WITH CHECK (
  auth.uid() = investor_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'investor'
  )
);

CREATE POLICY "Investors can remove own interest"
ON public.investor_interests FOR DELETE
USING (auth.uid() = investor_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investor_interests_investor_id ON public.investor_interests(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_interests_startup_id ON public.investor_interests(startup_id);

-- Enable realtime for investor_interests
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_interests;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS investor_interest_created_trigger ON public.investor_interests;
DROP FUNCTION IF EXISTS public.on_investor_interest_created();

-- Recreate the notification function for investor interest
CREATE OR REPLACE FUNCTION public.on_investor_interest_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_founder_id UUID;
  v_startup_name TEXT;
  v_investor_name TEXT;
BEGIN
  -- Get startup founder and name
  SELECT founder_id, name INTO v_founder_id, v_startup_name
  FROM startups WHERE id = NEW.startup_id;
  
  -- Get investor name
  SELECT full_name INTO v_investor_name
  FROM profiles WHERE id = NEW.investor_id;
  
  -- Create notification for founder
  PERFORM create_notification(
    v_founder_id,
    'Investor Interest!',
    v_investor_name || ' is interested in ' || v_startup_name,
    'investor_interest',
    NEW.startup_id
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the insert if notification fails
    RAISE WARNING 'Failed to create notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER investor_interest_created_trigger
AFTER INSERT ON public.investor_interests
FOR EACH ROW
EXECUTE FUNCTION on_investor_interest_created();

-- Verify the setup
DO $$ 
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'user_role enum values: %', (SELECT array_agg(enumlabel) FROM pg_enum WHERE enumtypid = 'user_role'::regtype);
END $$;

-- ==============================================================

-- COMPREHENSIVE DATABASE CHECK AND FIX SCRIPT

-- Run this in your Supabase SQL Editor

-- ==============================================================

-- 1. Check if all required tables exist
DO $$ 
BEGIN
  RAISE NOTICE '=== Checking Tables ===';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE '✓ profiles table exists';
  ELSE
    RAISE WARNING '✗ profiles table missing!';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'startups') THEN
    RAISE NOTICE '✓ startups table exists';
  ELSE
    RAISE WARNING '✗ startups table missing!';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investor_interests') THEN
    RAISE NOTICE '✓ investor_interests table exists';
  ELSE
    RAISE WARNING '✗ investor_interests table missing!';
  END IF;
END $$;

-- 2. Check and fix user_role enum
DO $$ 
BEGIN
  RAISE NOTICE '=== Checking user_role Enum ===';
  
  -- Check if 'investor' value exists
  IF EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'investor'
  ) THEN
    RAISE NOTICE '✓ investor role exists in enum';
  ELSE
    RAISE NOTICE 'Adding investor role to enum...';
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'investor';
    RAISE NOTICE '✓ investor role added';
  END IF;
  
  -- Display all enum values
  RAISE NOTICE 'Current user_role values: %', (
    SELECT array_agg(enumlabel ORDER BY enumsortorder) 
    FROM pg_enum 
    WHERE enumtypid = 'user_role'::regtype
  );
END $$;

-- 3. Fix the handle_new_user function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_role user_role;
  v_error_detail TEXT;
BEGIN
  -- Extract full name with multiple fallbacks
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'New User'
  );
  
  -- Extract and validate role with fallback to 'talent'
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION
    WHEN OTHERS THEN
      v_role := 'talent'::user_role;
  END;
  
  -- Ensure role is not null
  IF v_role IS NULL THEN
    v_role := 'talent'::user_role;
  END IF;
  
  -- Insert profile
  BEGIN
    INSERT INTO public.profiles (
      id, 
      full_name, 
      role, 
      skills, 
      bio, 
      avatar_url,
      created_at
    )
    VALUES (
      NEW.id,
      v_full_name,
      v_role,
      ARRAY[]::TEXT[],
      NULL,
      NULL,
      NOW()
    );
    
    RAISE NOTICE 'Profile created for user % with role %', NEW.id, v_role;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, try to update it
      UPDATE public.profiles
      SET 
        full_name = v_full_name,
        role = v_role
      WHERE id = NEW.id;
      
      RAISE NOTICE 'Profile updated for existing user %', NEW.id;
      
    WHEN OTHERS THEN
      -- Get error details
      GET STACKED DIAGNOSTICS v_error_detail = MESSAGE_TEXT;
      RAISE WARNING 'Error creating profile for user %: %', NEW.id, v_error_detail;
      
      -- Re-raise the error so signup fails
      RAISE EXCEPTION 'Database error saving new user: %', v_error_detail;
  END;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

RAISE NOTICE '✓ handle_new_user function and trigger recreated';

-- 4. Verify RLS is enabled on all tables
DO $$ 
BEGIN
  RAISE NOTICE '=== Checking RLS Status ===';
  
  -- Enable RLS on all tables if not already enabled
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.startup_interests ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investor_interests') THEN
    ALTER TABLE public.investor_interests ENABLE ROW LEVEL SECURITY;
  END IF;
  
  RAISE NOTICE '✓ RLS enabled on all tables';
END $$;