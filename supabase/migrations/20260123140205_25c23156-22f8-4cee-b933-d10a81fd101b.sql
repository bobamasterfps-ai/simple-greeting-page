-- Drop and recreate view with security_invoker to fix security linter issue
DROP VIEW IF EXISTS public.strategy_win_rates;

-- Recreate with security_invoker=on (uses querying user's permissions, not creator's)
CREATE VIEW public.strategy_win_rates
WITH (security_invoker=on)
AS
SELECT
  strategy_id,
  count(*) AS total_uses,
  count(*) FILTER (WHERE worked = true) AS wins,
  ROUND(
    (count(*) FILTER (WHERE worked = true)::numeric / 
     NULLIF(count(*), 0)) * 100,
    1
  ) AS win_rate,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  max(created_at) AS last_used
FROM strategy_ratings
GROUP BY strategy_id;

-- Grant select access
GRANT SELECT ON public.strategy_win_rates TO authenticated;
GRANT SELECT ON public.strategy_win_rates TO anon;

-- Add explanation comment
COMMENT ON VIEW public.strategy_win_rates IS 'Aggregated strategy statistics - hides individual vote data for privacy. Uses security_invoker for proper RLS.';