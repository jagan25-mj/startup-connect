-- Create startup_team_members table for team formation
CREATE TABLE public.startup_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_team TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(startup_id, user_id)
);

-- Enable RLS for startup_team_members
ALTER TABLE public.startup_team_members ENABLE ROW LEVEL SECURITY;

-- Founders can manage their startup team members
CREATE POLICY "Founders can view their team members"
ON public.startup_team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM startups
    WHERE startups.id = startup_team_members.startup_id
    AND startups.founder_id = auth.uid()
  )
);

CREATE POLICY "Founders can add team members"
ON public.startup_team_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM startups
    WHERE startups.id = startup_team_members.startup_id
    AND startups.founder_id = auth.uid()
  )
);

CREATE POLICY "Founders can remove team members"
ON public.startup_team_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM startups
    WHERE startups.id = startup_team_members.startup_id
    AND startups.founder_id = auth.uid()
  )
);

-- Talents can view their own memberships
CREATE POLICY "Users can view their own team memberships"
ON public.startup_team_members
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can view team members of startups (for public profiles)
CREATE POLICY "Anyone can view startup team members"
ON public.startup_team_members
FOR SELECT
USING (true);

-- Create connections table for talent-to-talent networking
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);

-- Enable RLS for connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections (sent or received)
CREATE POLICY "Users can view their own connections"
ON public.connections
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Users can send connection requests
CREATE POLICY "Users can send connection requests"
ON public.connections
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Users can update connections they received (accept/reject)
CREATE POLICY "Users can update received connections"
ON public.connections
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Users can delete their own connection requests
CREATE POLICY "Users can delete their own connections"
ON public.connections
FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Create indexes for performance
CREATE INDEX idx_startup_team_members_startup ON public.startup_team_members(startup_id);
CREATE INDEX idx_startup_team_members_user ON public.startup_team_members(user_id);
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX idx_connections_status ON public.connections(status);

-- Enable realtime for connections
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.startup_team_members;