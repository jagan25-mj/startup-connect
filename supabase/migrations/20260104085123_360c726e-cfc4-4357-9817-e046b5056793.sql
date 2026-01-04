-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create startup_updates table for progress updates
CREATE TABLE public.startup_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT CHECK (tag IN ('milestone', 'update', 'looking_for_talent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.startup_updates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view updates
CREATE POLICY "Anyone can view startup updates"
ON public.startup_updates FOR SELECT
USING (true);

-- Only startup founders can create updates
CREATE POLICY "Founders can create updates for their startups"
ON public.startup_updates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM startups
    WHERE startups.id = startup_updates.startup_id
    AND startups.founder_id = auth.uid()
  )
);

-- Only startup founders can update their updates
CREATE POLICY "Founders can update their startup updates"
ON public.startup_updates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM startups
    WHERE startups.id = startup_updates.startup_id
    AND startups.founder_id = auth.uid()
  )
);

-- Only startup founders can delete their updates
CREATE POLICY "Founders can delete their startup updates"
ON public.startup_updates FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM startups
    WHERE startups.id = startup_updates.startup_id
    AND startups.founder_id = auth.uid()
  )
);

-- Add index for performance
CREATE INDEX idx_startup_updates_startup_id ON public.startup_updates(startup_id);
CREATE INDEX idx_startup_updates_created_at ON public.startup_updates(created_at DESC);

-- Enable realtime for startup_updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.startup_updates;