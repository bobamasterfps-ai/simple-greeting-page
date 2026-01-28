-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.get_strategy_win_rate(strategy_uuid UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(COUNT(*) FILTER (WHERE worked = true) * 100.0 / COUNT(*), 1)
    END
  FROM public.strategy_ratings
  WHERE strategy_id = strategy_uuid AND worked IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.get_strategy_avg_rating(strategy_uuid UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM public.strategy_ratings
  WHERE strategy_id = strategy_uuid AND rating IS NOT NULL
$$;