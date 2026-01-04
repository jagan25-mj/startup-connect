-- Add media_url column to startup_updates table for images/videos
ALTER TABLE public.startup_updates 
ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT NULL;

-- Create startup-updates storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('startup-updates', 'startup-updates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can view startup update media (public bucket)
CREATE POLICY "Public can view startup update media"
ON storage.objects FOR SELECT
USING (bucket_id = 'startup-updates');

-- Storage policy: Authenticated users can upload their own media
CREATE POLICY "Authenticated users can upload startup update media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'startup-updates' 
  AND auth.role() = 'authenticated'
);

-- Storage policy: Users can update their own uploaded media
CREATE POLICY "Users can update their own startup update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'startup-updates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Users can delete their own uploaded media
CREATE POLICY "Users can delete their own startup update media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'startup-updates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);