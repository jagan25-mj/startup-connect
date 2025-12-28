-- Add 'investor' role to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'investor';

-- Create investor_interests table for tracking investor interest in startups
CREATE TABLE IF NOT EXISTS public.investor_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(investor_id, startup_id)
);

-- Enable RLS on investor_interests
ALTER TABLE public.investor_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investor_interests
-- Investors can view their own interests
CREATE POLICY "Investors can view own interests"
ON public.investor_interests FOR SELECT
USING (auth.uid() = investor_id);

-- Founders can view interests on their startups
CREATE POLICY "Founders can view investor interests on their startups"
ON public.investor_interests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.startups
    WHERE id = startup_id AND founder_id = auth.uid()
  )
);

-- Investors can express interest
CREATE POLICY "Investors can express interest"
ON public.investor_interests FOR INSERT
WITH CHECK (
  auth.uid() = investor_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'investor'
  )
);

-- Investors can remove their interest
CREATE POLICY "Investors can remove own interest"
ON public.investor_interests FOR DELETE
USING (auth.uid() = investor_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investor_interests_investor_id ON public.investor_interests(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_interests_startup_id ON public.investor_interests(startup_id);

-- Enable realtime for investor_interests
ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_interests;

-- Trigger to notify founder when investor shows interest
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
END;
$$;

CREATE TRIGGER investor_interest_created_trigger
AFTER INSERT ON public.investor_interests
FOR EACH ROW
EXECUTE FUNCTION on_investor_interest_created();
