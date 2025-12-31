-- ============================================
-- STARTUP ACTIVITY FEED - DATABASE SCHEMA
-- ============================================

-- Post types enum
DO $$ BEGIN
  CREATE TYPE post_type AS ENUM (
    'progress',      -- product updates, feature shipping
    'achievement',   -- certifications, hackathons, milestones
    'hiring',        -- looking for teammates
    'milestone',     -- funding, MVP launch, beta release
    'learning'       -- technical or startup learning
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Visibility enum
DO $$ BEGIN
  CREATE TYPE post_visibility AS ENUM ('public', 'network');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Impact level enum
DO $$ BEGIN
  CREATE TYPE impact_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- POSTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_startup_id UUID REFERENCES public.startups(id) ON DELETE SET NULL,
  
  -- Content
  post_type post_type NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 2000),
  media_url TEXT,
  tags TEXT[] DEFAULT '{}',
  visibility post_visibility DEFAULT 'public',
  
  -- AI-generated metadata
  impact_level impact_level DEFAULT 'medium',
  trust_score_change INTEGER DEFAULT 0 CHECK (trust_score_change >= -10 AND trust_score_change <= 10),
  detected_skills TEXT[] DEFAULT '{}',
  recommended_audience TEXT[] DEFAULT '{}',
  
  -- Engagement (minimal - not vanity focused)
  save_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POST SAVES (bookmarks, not likes)
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_startup_id ON public.posts(related_startup_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_impact ON public.posts(impact_level);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_skills ON public.posts USING GIN(detected_skills);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

-- Posts: Everyone can view public posts
CREATE POLICY "Anyone can view public posts"
  ON public.posts FOR SELECT
  USING (visibility = 'public' OR author_id = auth.uid());

-- Posts: Authenticated users can create
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Posts: Authors can update/delete their own posts
CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id);

-- Post saves: Users can save any public post
CREATE POLICY "Users can save public posts"
  ON public.post_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own saves"
  ON public.post_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can unsave"
  ON public.post_saves FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Update save_count
-- ============================================

CREATE OR REPLACE FUNCTION update_post_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET save_count = save_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET save_count = save_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_save_count ON public.post_saves;
CREATE TRIGGER trigger_update_save_count
  AFTER INSERT OR DELETE ON public.post_saves
  FOR EACH ROW EXECUTE FUNCTION update_post_save_count();

-- ============================================
-- TRIGGER: Update author trust score on post
-- ============================================

CREATE OR REPLACE FUNCTION update_author_trust_on_post()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET trust_score = LEAST(100, GREATEST(0, trust_score + NEW.trust_score_change))
  WHERE id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_trust_on_post ON public.posts;
CREATE TRIGGER trigger_update_trust_on_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_author_trust_on_post();

-- ============================================
-- FUNCTION: Get ranked feed
-- ============================================

CREATE OR REPLACE FUNCTION get_ranked_feed(
  p_user_id UUID,
  p_user_skills TEXT[] DEFAULT '{}',
  p_user_role TEXT DEFAULT 'talent',
  p_post_type post_type DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  author_name TEXT,
  author_avatar TEXT,
  author_role TEXT,
  related_startup_id UUID,
  startup_name TEXT,
  post_type post_type,
  content TEXT,
  media_url TEXT,
  tags TEXT[],
  visibility post_visibility,
  impact_level impact_level,
  detected_skills TEXT[],
  save_count INTEGER,
  created_at TIMESTAMPTZ,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_id,
    pr.full_name AS author_name,
    pr.avatar_url AS author_avatar,
    pr.role::TEXT AS author_role,
    p.related_startup_id,
    s.name AS startup_name,
    p.post_type,
    p.content,
    p.media_url,
    p.tags,
    p.visibility,
    p.impact_level,
    p.detected_skills,
    p.save_count,
    p.created_at,
    -- Relevance scoring
    (
      -- Recency (0-30 points)
      (30.0 * EXP(-EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400.0))
      -- Impact level (0-25 points)
      + CASE p.impact_level 
          WHEN 'high' THEN 25 
          WHEN 'medium' THEN 15 
          ELSE 5 
        END
      -- Author trust score (0-20 points)
      + (pr.trust_score * 0.2)
      -- Skill overlap (0-15 points)
      + (COALESCE(array_length(ARRAY(SELECT unnest(p.detected_skills) INTERSECT SELECT unnest(p_user_skills)), 1), 0) * 5.0)
      -- Role relevance (0-10 points)
      + CASE 
          WHEN p_user_role = 'founder' AND p.post_type IN ('hiring', 'progress') THEN 10
          WHEN p_user_role = 'talent' AND p.post_type IN ('hiring', 'milestone') THEN 10
          ELSE 3
        END
    )::FLOAT AS relevance_score
  FROM public.posts p
  JOIN public.profiles pr ON p.author_id = pr.id
  LEFT JOIN public.startups s ON p.related_startup_id = s.id
  WHERE 
    p.visibility = 'public'
    AND (p_post_type IS NULL OR p.post_type = p_post_type)
  ORDER BY relevance_score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE
-- ============================================
