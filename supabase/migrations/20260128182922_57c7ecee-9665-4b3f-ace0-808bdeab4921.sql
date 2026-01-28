-- Fix security definer views - recreate them with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.team_stats;
DROP VIEW IF EXISTS public.strategy_stats;

-- Create views with explicit SECURITY INVOKER
CREATE VIEW public.team_stats WITH (security_invoker = on) AS
SELECT
  t.id as team_id,
  t.name as team_name,
  COUNT(DISTINCT s.id)::integer as total_strategies,
  0 as total_matches,
  0 as matches_won,
  0::numeric as team_win_rate
FROM public.teams t
LEFT JOIN public.strategies s ON s.team_id = t.id
GROUP BY t.id, t.name;

CREATE VIEW public.strategy_stats WITH (security_invoker = on) AS
SELECT
  s.id as strategy_id,
  COALESCE(AVG(sr.rating), 0)::numeric as avg_rating,
  COUNT(sr.id)::integer as total_votes,
  COALESCE(
    ROUND(
      (COUNT(CASE WHEN sr.worked = true THEN 1 END)::numeric / NULLIF(COUNT(CASE WHEN sr.worked IS NOT NULL THEN 1 END), 0)) * 100
    ), 0
  )::numeric as win_rate
FROM public.strategies s
LEFT JOIN public.strategy_ratings sr ON sr.strategy_id = s.id
GROUP BY s.id;

-- Fix remaining function search paths
CREATE OR REPLACE FUNCTION public.get_strategy_avg_rating(strategy_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(rating), 0) FROM public.strategy_ratings WHERE strategy_id = strategy_uuid;
$$ LANGUAGE SQL STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_strategy_win_rate(strategy_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    ROUND(
      (COUNT(CASE WHEN worked = true THEN 1 END)::numeric / NULLIF(COUNT(CASE WHEN worked IS NOT NULL THEN 1 END), 0)) * 100
    ), 0
  ) FROM public.strategy_ratings WHERE strategy_id = strategy_uuid;
$$ LANGUAGE SQL STABLE SET search_path = public;