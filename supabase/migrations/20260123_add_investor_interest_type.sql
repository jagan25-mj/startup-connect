-- Add interest_type column to startup_interests
-- This allows distinguishing between talent interest and investor interest
ALTER TABLE public.startup_interests
ADD COLUMN interest_type VARCHAR(50) DEFAULT 'talent' CHECK (interest_type IN ('talent', 'investor'));

-- Create index for filtering by interest type
CREATE INDEX idx_startup_interests_type ON public.startup_interests(interest_type);

-- Update constraint to allow both talent and investor interests for same user/startup combo
-- First drop the old unique constraint if it exists
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.startup_interests DROP CONSTRAINT startup_interests_startup_id_user_id_key;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Add new unique constraint that allows multiple interest types
ALTER TABLE public.startup_interests
ADD CONSTRAINT unique_startup_interest_type UNIQUE (startup_id, user_id, interest_type);
