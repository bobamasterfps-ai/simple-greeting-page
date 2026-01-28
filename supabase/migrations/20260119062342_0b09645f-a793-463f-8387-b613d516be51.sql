-- =============================================================
-- COMPLETE SECURITY & FEATURE MIGRATION
-- Fixes: RLS policies, strategy stats view, coach permissions
-- =============================================================

-- 1. Ensure auth config is set properly
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 2. Create strategy_stats view (aggregated, no individual vote exposure)
CREATE OR REPLACE VIEW public.strategy_stats AS
SELECT 
  strategy_id,
  COUNT(*) AS total_votes,
  COUNT(*) FILTER (WHERE worked = true) AS wins,
  COUNT(*) FILTER (WHERE worked = false) AS losses,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  ROUND(
    (COUNT(*) FILTER (WHERE worked = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE worked IS NOT NULL), 0)) * 100,
    1
  ) AS win_rate
FROM strategy_ratings
GROUP BY strategy_id;

-- Grant access to authenticated users
GRANT SELECT ON public.strategy_stats TO authenticated;
GRANT SELECT ON public.strategy_stats TO anon;

-- 3. Create round_plans table for coaches
CREATE TABLE IF NOT EXISTS public.round_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  map TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('attack', 'defense')),
  rounds JSONB NOT NULL DEFAULT '[]'::jsonb,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.round_plans ENABLE ROW LEVEL SECURITY;

-- Round plans policies
CREATE POLICY "Team members can view round plans"
ON public.round_plans FOR SELECT
USING (
  creator_id = auth.uid() OR
  (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
);

CREATE POLICY "Users can create round plans"
ON public.round_plans FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Coaches and owners can update round plans"
ON public.round_plans FOR UPDATE
USING (
  creator_id = auth.uid() OR
  (team_id IS NOT NULL AND (
    public.has_team_role(auth.uid(), team_id, 'owner') OR
    public.has_team_role(auth.uid(), team_id, 'coach')
  ))
);

CREATE POLICY "Coaches and owners can delete round plans"
ON public.round_plans FOR DELETE
USING (
  creator_id = auth.uid() OR
  (team_id IS NOT NULL AND public.has_team_role(auth.uid(), team_id, 'owner'))
);

-- 4. Create match_results table for tracking
CREATE TABLE IF NOT EXISTS public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  map TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('attack', 'defense')),
  score_us INTEGER NOT NULL DEFAULT 0,
  score_them INTEGER NOT NULL DEFAULT 0,
  won BOOLEAN GENERATED ALWAYS AS (score_us > score_them) STORED,
  round_plan_id UUID REFERENCES public.round_plans(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Match results policies
CREATE POLICY "Team members can view match results"
ON public.match_results FOR SELECT
USING (
  user_id = auth.uid() OR
  (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
);

CREATE POLICY "Users can create match results"
ON public.match_results FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own match results"
ON public.match_results FOR UPDATE
USING (user_id = auth.uid());

-- 5. Add playstyle column to strategies if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategies' AND column_name = 'title') THEN
    ALTER TABLE strategies ADD COLUMN title TEXT;
  END IF;
END $$;

-- 6. Update updated_at trigger for round_plans
CREATE OR REPLACE TRIGGER update_round_plans_updated_at
BEFORE UPDATE ON public.round_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create team_stats view for coach dashboard
CREATE OR REPLACE VIEW public.team_stats AS
SELECT 
  t.id AS team_id,
  t.name AS team_name,
  COUNT(DISTINCT s.id) AS total_strategies,
  COUNT(DISTINCT mr.id) AS total_matches,
  COUNT(DISTINCT mr.id) FILTER (WHERE mr.won = true) AS matches_won,
  ROUND(
    (COUNT(DISTINCT mr.id) FILTER (WHERE mr.won = true)::numeric / NULLIF(COUNT(DISTINCT mr.id), 0)) * 100,
    1
  ) AS team_win_rate
FROM teams t
LEFT JOIN strategies s ON s.team_id = t.id
LEFT JOIN match_results mr ON mr.team_id = t.id
GROUP BY t.id, t.name;

GRANT SELECT ON public.team_stats TO authenticated;