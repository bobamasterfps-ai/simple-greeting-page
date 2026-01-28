-- Fix function search paths and create missing views

-- Create team_stats view
CREATE OR REPLACE VIEW public.team_stats AS
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

-- Create strategy_stats view
CREATE OR REPLACE VIEW public.strategy_stats AS
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

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;