-- Fix SECURITY DEFINER views by adding security_invoker
DROP VIEW IF EXISTS public.strategy_stats;
DROP VIEW IF EXISTS public.team_stats;

-- Recreate strategy_stats with security_invoker
CREATE VIEW public.strategy_stats
WITH (security_invoker = on) AS
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

-- Recreate team_stats with security_invoker  
CREATE VIEW public.team_stats
WITH (security_invoker = on) AS
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

-- Grant select on views
GRANT SELECT ON public.strategy_stats TO authenticated;
GRANT SELECT ON public.strategy_stats TO anon;
GRANT SELECT ON public.team_stats TO authenticated;