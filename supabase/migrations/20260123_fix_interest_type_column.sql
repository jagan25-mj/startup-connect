-- Fix: Ensure interest_type column exists on startup_interests
-- This migration handles the case where previous migration failed

-- Step 1: Check if column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'startup_interests' AND column_name = 'interest_type'
  ) THEN
    ALTER TABLE public.startup_interests
    ADD COLUMN interest_type VARCHAR(50) DEFAULT 'talent' 
    CHECK (interest_type IN ('talent', 'investor'));
  END IF;
END $$;

-- Step 2: Create or replace index for filtering by interest type
DROP INDEX IF EXISTS idx_startup_interests_type;
CREATE INDEX idx_startup_interests_type ON public.startup_interests(interest_type);

-- Step 3: Drop old unique constraint if it exists (the one on just startup_id, user_id)
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.startup_interests 
    DROP CONSTRAINT startup_interests_startup_id_user_id_key;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Step 4: Add new unique constraint allowing both talent and investor interests
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.startup_interests
    ADD CONSTRAINT unique_startup_interest_type UNIQUE (startup_id, user_id, interest_type);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
