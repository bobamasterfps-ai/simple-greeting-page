-- =====================================
-- Additional Tables for AutoStat Features
-- =====================================

-- 1. Strategies table - stores AI-generated and saved strategies
CREATE TABLE public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  map TEXT NOT NULL,
  site TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('attack', 'defense')),
  rank TEXT DEFAULT 'Diamond',
  playstyle TEXT,
  title TEXT,
  description TEXT,
  json_data JSONB NOT NULL,
  locked BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Strategy ratings table
CREATE TABLE public.strategy_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  worked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(strategy_id, user_id)
);

-- 3. Lineups table - stores lineup guides
CREATE TABLE public.lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('attack', 'defense')),
  map TEXT NOT NULL,
  ability TEXT,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Lineup images table - step-by-step images
CREATE TABLE public.lineup_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID REFERENCES public.lineups(id) ON DELETE CASCADE NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('throw', 'aim', 'result')),
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- 5. Round plans table - team planning
CREATE TABLE public.round_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  map TEXT NOT NULL,
  side TEXT NOT NULL,
  title TEXT NOT NULL,
  rounds JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Team stats view (materialized for performance)
CREATE TABLE public.team_stats (
  team_id UUID PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  total_strategies INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  team_win_rate INTEGER DEFAULT 0
);

-- 7. Strategy stats table (for tracking usage)
CREATE TABLE public.strategy_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  win_rate INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0
);

-- =====================================
-- RLS for new tables
-- =====================================
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_stats ENABLE ROW LEVEL SECURITY;

-- Strategies policies
CREATE POLICY "Users can view own strategies"
ON public.strategies FOR SELECT
TO authenticated
USING (creator_id = auth.uid() OR visibility = 'public' OR 
       (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id)));

CREATE POLICY "Users can create strategies"
ON public.strategies FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own strategies"
ON public.strategies FOR UPDATE
TO authenticated
USING (creator_id = auth.uid() OR 
       (team_id IS NOT NULL AND public.is_team_admin(auth.uid(), team_id)));

CREATE POLICY "Users can delete own strategies"
ON public.strategies FOR DELETE
TO authenticated
USING (creator_id = auth.uid());

-- Strategy ratings policies
CREATE POLICY "Users can view ratings"
ON public.strategy_ratings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can rate strategies"
ON public.strategy_ratings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ratings"
ON public.strategy_ratings FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Lineups policies (public read)
CREATE POLICY "Anyone can view lineups"
ON public.lineups FOR SELECT
USING (true);

CREATE POLICY "Authenticated can create lineups"
ON public.lineups FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Lineup images policies
CREATE POLICY "Anyone can view lineup images"
ON public.lineup_images FOR SELECT
USING (true);

-- Round plans policies
CREATE POLICY "Team members can view round plans"
ON public.round_plans FOR SELECT
TO authenticated
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can create round plans"
ON public.round_plans FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid() AND public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can update round plans"
ON public.round_plans FOR UPDATE
TO authenticated
USING (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can delete round plans"
ON public.round_plans FOR DELETE
TO authenticated
USING (public.is_team_admin(auth.uid(), team_id));

-- Team stats policies
CREATE POLICY "Team members can view team stats"
ON public.team_stats FOR SELECT
TO authenticated
USING (public.is_team_member(auth.uid(), team_id));

-- Strategy stats policies
CREATE POLICY "Anyone can view strategy stats"
ON public.strategy_stats FOR SELECT
USING (true);

-- =====================================
-- Database functions for ratings
-- =====================================
CREATE OR REPLACE FUNCTION public.get_strategy_avg_rating(strategy_uuid UUID)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
  FROM public.strategy_ratings
  WHERE strategy_id = strategy_uuid
$$;

CREATE OR REPLACE FUNCTION public.get_strategy_win_rate(strategy_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (COUNT(*) FILTER (WHERE worked = true)::DECIMAL / NULLIF(COUNT(*) FILTER (WHERE worked IS NOT NULL), 0) * 100)::INTEGER,
    0
  )
  FROM public.strategy_ratings
  WHERE strategy_id = strategy_uuid
$$;

-- =====================================
-- Triggers
-- =====================================
CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create team_stats when team is created
CREATE OR REPLACE FUNCTION public.handle_team_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_stats (team_id, team_name)
  VALUES (NEW.id, NEW.name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_stats_init
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_team_stats();