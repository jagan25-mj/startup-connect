-- ============================================
-- SKILL GAP ANALYSIS - DATABASE EXTENSION
-- ============================================

-- Add required_skills and team_skills to startups table
ALTER TABLE public.startups 
ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS team_skills TEXT[] DEFAULT '{}';

-- Update startups RLS to include new columns (already allowed by SELECT *)

-- ============================================
-- PROFILE INTENT FIELDS (if not already added)
-- ============================================

-- These may already exist from trust migration, adding IF NOT EXISTS for safety
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS intent TEXT CHECK (intent IN ('exploring', 'active', 'serious')),
ADD COLUMN IF NOT EXISTS hours_per_week INTEGER CHECK (hours_per_week >= 0 AND hours_per_week <= 168);

-- ============================================
-- DONE
-- ============================================
