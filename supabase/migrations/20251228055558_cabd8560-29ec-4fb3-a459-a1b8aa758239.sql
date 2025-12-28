-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('founder', 'talent');

-- Create enum for startup stages
CREATE TYPE public.startup_stage AS ENUM ('idea', 'mvp', 'early_stage', 'growth', 'scaling');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create startups table
CREATE TABLE public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL,
  stage startup_stage NOT NULL DEFAULT 'idea',
  founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create startup_interests table
CREATE TABLE public.startup_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(startup_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_interests ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
-- Users can read all profiles (for discovery)
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Startups RLS Policies
-- Anyone can view startups
CREATE POLICY "Anyone can view startups"
  ON public.startups FOR SELECT
  USING (true);

-- Only founders can create startups
CREATE POLICY "Founders can create startups"
  ON public.startups FOR INSERT
  WITH CHECK (
    auth.uid() = founder_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'founder'
    )
  );

-- Founders can update their own startups
CREATE POLICY "Founders can update own startups"
  ON public.startups FOR UPDATE
  USING (auth.uid() = founder_id);

-- Founders can delete their own startups
CREATE POLICY "Founders can delete own startups"
  ON public.startups FOR DELETE
  USING (auth.uid() = founder_id);

-- Startup Interests RLS Policies
-- Users can view their own interests
CREATE POLICY "Users can view own interests"
  ON public.startup_interests FOR SELECT
  USING (auth.uid() = user_id);

-- Founders can view interests on their startups
CREATE POLICY "Founders can view interests on their startups"
  ON public.startup_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.startups
      WHERE id = startup_id AND founder_id = auth.uid()
    )
  );

-- Users can express interest
CREATE POLICY "Users can express interest"
  ON public.startup_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their interest
CREATE POLICY "Users can remove own interest"
  ON public.startup_interests FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'talent')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();