-- Create aggregated view for strategy win rates (secure, no raw vote data exposed)
CREATE OR REPLACE VIEW public.strategy_win_rates AS
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

-- Grant select access to authenticated users
GRANT SELECT ON public.strategy_win_rates TO authenticated;

-- Grant select access to anon for public strategies
GRANT SELECT ON public.strategy_win_rates TO anon;

-- Add a comment explaining the purpose
COMMENT ON VIEW public.strategy_win_rates IS 'Aggregated strategy statistics - hides individual vote data for privacy';