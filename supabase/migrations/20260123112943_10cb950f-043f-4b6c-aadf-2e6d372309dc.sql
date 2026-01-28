-- =====================================
-- AutoStat Database Schema
-- =====================================

-- 1. Create app_role enum for team member roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'coach', 'player', 'viewer');

-- 2. Profiles table (stores additional user info)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  valorant_name TEXT,
  valorant_tag TEXT,
  rank TEXT DEFAULT 'Unranked',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Team members junction table with roles
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role DEFAULT 'player' NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- 5. Team invites table
CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role app_role DEFAULT 'player' NOT NULL,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days') NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. User roles table (for global app roles like admin)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- =====================================
-- Security Functions (SECURITY DEFINER)
-- =====================================

-- Check if user has a global role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is member of a team
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

-- Check if user has specific role in team
CREATE OR REPLACE FUNCTION public.has_team_role(_user_id UUID, _team_id UUID, _role app_role)
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

-- Check if user is team admin or owner
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id AND role IN ('owner', 'admin')
  )
$$;

-- =====================================
-- Enable RLS on all tables
-- =====================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================
-- RLS Policies: Profiles
-- =====================================
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================
-- RLS Policies: Teams
-- =====================================
CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
TO authenticated
USING (public.is_team_member(auth.uid(), id) OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team admins can update their team"
ON public.teams FOR UPDATE
TO authenticated
USING (public.is_team_admin(auth.uid(), id));

CREATE POLICY "Team owners can delete their team"
ON public.teams FOR DELETE
TO authenticated
USING (public.has_team_role(auth.uid(), id, 'owner'));

-- =====================================
-- RLS Policies: Team Members
-- =====================================
CREATE POLICY "Team members can view other members"
ON public.team_members FOR SELECT
TO authenticated
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can add members"
ON public.team_members FOR INSERT
TO authenticated
WITH CHECK (public.is_team_admin(auth.uid(), team_id) OR auth.uid() = user_id);

CREATE POLICY "Team admins can update member roles"
ON public.team_members FOR UPDATE
TO authenticated
USING (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can remove members"
ON public.team_members FOR DELETE
TO authenticated
USING (public.is_team_admin(auth.uid(), team_id) OR auth.uid() = user_id);

-- =====================================
-- RLS Policies: Team Invites
-- =====================================
CREATE POLICY "Team admins can view invites"
ON public.team_invites FOR SELECT
TO authenticated
USING (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Anyone can view invite by token"
ON public.team_invites FOR SELECT
TO authenticated
USING (token IS NOT NULL);

CREATE POLICY "Team admins can create invites"
ON public.team_invites FOR INSERT
TO authenticated
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can delete invites"
ON public.team_invites FOR DELETE
TO authenticated
USING (public.is_team_admin(auth.uid(), team_id));

-- =====================================
-- RLS Policies: User Roles (admin only)
-- =====================================
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =====================================
-- Triggers: Auto-create profile on signup
-- =====================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================
-- Triggers: Auto-add creator as team owner
-- =====================================
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

-- =====================================
-- Triggers: Update timestamps
-- =====================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();