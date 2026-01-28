-- =====================================================
-- AUTOSTAT STRATEGY SYSTEM - COMPLETE SCHEMA
-- =====================================================

-- 1. PROFILES TABLE (User info for AutoStat)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  rank TEXT DEFAULT 'Unranked',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. TEAMS TABLE
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 3. TEAM MEMBERS TABLE (Separate roles table)
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'coach', 'player')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check team membership (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Security definer function to check team role
CREATE OR REPLACE FUNCTION public.has_team_role(_user_id UUID, _team_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id AND role = _role
  )
$$;

-- Teams RLS policies
CREATE POLICY "Team members can view their teams"
  ON public.teams FOR SELECT
  USING (public.is_team_member(auth.uid(), id) OR owner_id = auth.uid());

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = owner_id);

-- Team members RLS policies
CREATE POLICY "Team members can view team roster"
  ON public.team_members FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team owners/coaches can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    public.has_team_role(auth.uid(), team_id, 'owner') OR
    public.has_team_role(auth.uid(), team_id, 'coach')
  );

CREATE POLICY "Team owners can update roles"
  ON public.team_members FOR UPDATE
  USING (public.has_team_role(auth.uid(), team_id, 'owner'));

CREATE POLICY "Team owners can remove members"
  ON public.team_members FOR DELETE
  USING (public.has_team_role(auth.uid(), team_id, 'owner') OR auth.uid() = user_id);

-- 4. STRATEGIES TABLE
CREATE TABLE public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  map TEXT NOT NULL,
  site TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('attack', 'defense')),
  rank TEXT DEFAULT 'Diamond',
  playstyle TEXT DEFAULT 'Slow Default',
  json_data JSONB NOT NULL,
  locked BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategies"
  ON public.strategies FOR SELECT
  USING (
    creator_id = auth.uid() OR
    visibility = 'public' OR
    (visibility = 'team' AND public.is_team_member(auth.uid(), team_id))
  );

CREATE POLICY "Authenticated users can create strategies"
  ON public.strategies FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their strategies"
  ON public.strategies FOR UPDATE
  USING (
    creator_id = auth.uid() OR
    (team_id IS NOT NULL AND (
      public.has_team_role(auth.uid(), team_id, 'owner') OR
      public.has_team_role(auth.uid(), team_id, 'coach')
    ))
  );

CREATE POLICY "Creators can delete their strategies"
  ON public.strategies FOR DELETE
  USING (creator_id = auth.uid());

-- 5. STRATEGY VERSIONS TABLE (versioning)
CREATE TABLE public.strategy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  json_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (strategy_id, version_number)
);

ALTER TABLE public.strategy_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of viewable strategies"
  ON public.strategy_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = strategy_id AND (
        s.creator_id = auth.uid() OR
        s.visibility = 'public' OR
        (s.visibility = 'team' AND public.is_team_member(auth.uid(), s.team_id))
      )
    )
  );

CREATE POLICY "Strategy creators can add versions"
  ON public.strategy_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = strategy_id AND s.creator_id = auth.uid()
    )
  );

-- 6. STRATEGY RATINGS TABLE
CREATE TABLE public.strategy_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  worked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (strategy_id, user_id)
);

ALTER TABLE public.strategy_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
  ON public.strategy_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can rate"
  ON public.strategy_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rating"
  ON public.strategy_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. STRATEGY COMMENTS TABLE
CREATE TABLE public.strategy_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.strategy_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments on viewable strategies"
  ON public.strategy_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = strategy_id AND (
        s.visibility = 'public' OR
        s.creator_id = auth.uid() OR
        (s.visibility = 'team' AND public.is_team_member(auth.uid(), s.team_id))
      )
    )
  );

CREATE POLICY "Authenticated users can comment"
  ON public.strategy_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.strategy_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Function to get strategy win rate
CREATE OR REPLACE FUNCTION public.get_strategy_win_rate(strategy_uuid UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(COUNT(*) FILTER (WHERE worked = true) * 100.0 / COUNT(*), 1)
    END
  FROM public.strategy_ratings
  WHERE strategy_id = strategy_uuid AND worked IS NOT NULL
$$;

-- 9. Function to get strategy average rating
CREATE OR REPLACE FUNCTION public.get_strategy_avg_rating(strategy_uuid UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM public.strategy_ratings
  WHERE strategy_id = strategy_uuid AND rating IS NOT NULL
$$;

-- 10. Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Indexes for performance
CREATE INDEX idx_strategies_creator ON public.strategies(creator_id);
CREATE INDEX idx_strategies_team ON public.strategies(team_id);
CREATE INDEX idx_strategies_map ON public.strategies(map);
CREATE INDEX idx_strategies_visibility ON public.strategies(visibility);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_strategy_ratings_strategy ON public.strategy_ratings(strategy_id);
CREATE INDEX idx_strategy_comments_strategy ON public.strategy_comments(strategy_id);