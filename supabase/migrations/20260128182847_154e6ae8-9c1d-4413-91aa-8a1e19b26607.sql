-- Create all tables first WITHOUT policies that reference other tables

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  valorant_name TEXT,
  valorant_tag TEXT,
  rank TEXT DEFAULT 'Unranked',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create teams table (without policies that reference team_members)
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  invite_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('owner', 'admin', 'coach', 'player', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Now add policies that reference team_members
CREATE POLICY "Teams are viewable by members" ON public.teams FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Team owners can update" ON public.teams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = id AND user_id = auth.uid() AND role = 'owner')
);
CREATE POLICY "Team owners can delete" ON public.teams FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = id AND user_id = auth.uid() AND role = 'owner')
);

CREATE POLICY "Members can view team members" ON public.team_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid())
);
CREATE POLICY "Team admins can insert members" ON public.team_members FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
);
CREATE POLICY "Team admins can update members" ON public.team_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
);
CREATE POLICY "Team admins can delete members" ON public.team_members FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
);

-- Create team_invites table
CREATE TABLE public.team_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view invites" ON public.team_invites FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_invites.team_id AND user_id = auth.uid())
);
CREATE POLICY "Team admins can create invites" ON public.team_invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_invites.team_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'coach'))
);

-- Create strategies table
CREATE TABLE public.strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  map TEXT NOT NULL,
  site TEXT NOT NULL,
  side TEXT NOT NULL,
  rank TEXT NOT NULL DEFAULT 'All',
  playstyle TEXT,
  title TEXT,
  description TEXT,
  json_data JSONB NOT NULL DEFAULT '{}',
  locked BOOLEAN DEFAULT false,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own strategies" ON public.strategies FOR SELECT USING (
  creator_id = auth.uid() OR
  visibility = 'public' OR
  (visibility = 'team' AND team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = strategies.team_id AND user_id = auth.uid()
  ))
);
CREATE POLICY "Users can insert own strategies" ON public.strategies FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own strategies" ON public.strategies FOR UPDATE USING (auth.uid() = creator_id OR
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = strategies.team_id AND user_id = auth.uid() AND role IN ('owner', 'coach')
  ))
);
CREATE POLICY "Users can delete own strategies" ON public.strategies FOR DELETE USING (auth.uid() = creator_id);

-- Create strategy_ratings table
CREATE TABLE public.strategy_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  worked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(strategy_id, user_id)
);

ALTER TABLE public.strategy_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ratings" ON public.strategy_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert own ratings" ON public.strategy_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.strategy_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Create lineups table
CREATE TABLE public.lineups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  side TEXT NOT NULL,
  map TEXT NOT NULL,
  ability TEXT,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lineups are viewable by all" ON public.lineups FOR SELECT USING (true);

-- Create lineup_images table
CREATE TABLE public.lineup_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id UUID NOT NULL REFERENCES public.lineups(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lineup_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lineup images are viewable by all" ON public.lineup_images FOR SELECT USING (true);

-- Create round_plans table
CREATE TABLE public.round_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  map TEXT NOT NULL,
  side TEXT NOT NULL,
  title TEXT NOT NULL,
  rounds JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.round_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view round plans" ON public.round_plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = round_plans.team_id AND user_id = auth.uid())
);
CREATE POLICY "Team coaches can insert round plans" ON public.round_plans FOR INSERT WITH CHECK (
  auth.uid() = creator_id AND
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = round_plans.team_id AND user_id = auth.uid() AND role IN ('owner', 'coach'))
);
CREATE POLICY "Team coaches can update round plans" ON public.round_plans FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = round_plans.team_id AND user_id = auth.uid() AND role IN ('owner', 'coach'))
);

-- Create RPC functions for ratings
CREATE OR REPLACE FUNCTION public.get_strategy_avg_rating(strategy_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(rating), 0) FROM public.strategy_ratings WHERE strategy_id = strategy_uuid;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.get_strategy_win_rate(strategy_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    ROUND(
      (COUNT(CASE WHEN worked = true THEN 1 END)::numeric / NULLIF(COUNT(CASE WHEN worked IS NOT NULL THEN 1 END), 0)) * 100
    ), 0
  ) FROM public.strategy_ratings WHERE strategy_id = strategy_uuid;
$$ LANGUAGE SQL STABLE;

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to auto-add team creator as owner
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_round_plans_updated_at BEFORE UPDATE ON public.round_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();