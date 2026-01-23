-- Add interest_type column to startup_interests table
-- Simple direct migration - just add the column if it doesn't exist

ALTER TABLE public.startup_interests
ADD COLUMN IF NOT EXISTS interest_type VARCHAR(50) DEFAULT 'talent';

-- Add check constraint
ALTER TABLE public.startup_interests
ADD CONSTRAINT check_interest_type CHECK (interest_type IN ('talent', 'investor'));

-- Drop old unique constraint to allow multiple interest types per user/startup
ALTER TABLE public.startup_interests
DROP CONSTRAINT IF EXISTS startup_interests_startup_id_user_id_key;

-- Create new unique constraint with interest_type
ALTER TABLE public.startup_interests
ADD CONSTRAINT unique_startup_interest_type UNIQUE (startup_id, user_id, interest_type);

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_startup_interests_type ON public.startup_interests(interest_type);
