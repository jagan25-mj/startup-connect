-- Create endorsements table
CREATE TABLE public.endorsements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    endorser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endorsed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT no_self_endorsement CHECK (endorser_id != endorsed_id),
    CONSTRAINT unique_endorsement UNIQUE (endorser_id, endorsed_id)
);

-- Create user_reports table
CREATE TABLE public.user_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT no_self_report CHECK (reporter_id != reported_id),
    CONSTRAINT unique_active_report UNIQUE (reporter_id, reported_id)
);

-- Enable RLS
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Endorsements policies
CREATE POLICY "Anyone can view endorsements"
ON public.endorsements FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create endorsements"
ON public.endorsements FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = endorser_id);

CREATE POLICY "Users can delete their own endorsements"
ON public.endorsements FOR DELETE
TO authenticated
USING (auth.uid() = endorser_id);

-- User reports policies (more restrictive)
CREATE POLICY "Users can view their own reports"
ON public.user_reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports"
ON public.user_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Create indexes for performance
CREATE INDEX idx_endorsements_endorsed_id ON public.endorsements(endorsed_id);
CREATE INDEX idx_endorsements_endorser_id ON public.endorsements(endorser_id);
CREATE INDEX idx_user_reports_reported_id ON public.user_reports(reported_id);
CREATE INDEX idx_user_reports_status ON public.user_reports(status);

-- Enable realtime for endorsements
ALTER PUBLICATION supabase_realtime ADD TABLE public.endorsements;