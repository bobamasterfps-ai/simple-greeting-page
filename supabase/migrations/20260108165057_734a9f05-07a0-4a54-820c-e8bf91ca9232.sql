-- Lineups table for agent-based lineups
CREATE TABLE public.lineups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('attack', 'defense')),
  map TEXT NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read lineups (public content)
CREATE POLICY "Lineups are viewable by everyone" 
ON public.lineups 
FOR SELECT 
USING (true);

-- Insert some sample lineups data
INSERT INTO public.lineups (agent, side, map, image_url, title, description) VALUES
('Sova', 'attack', 'Ascent', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400', 'A Site Recon Arrow', 'Land this arrow at A Site to reveal all defenders'),
('Sova', 'defense', 'Ascent', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400', 'A Main Watch Arrow', 'Early round arrow to spot A rushes'),
('Viper', 'attack', 'Breeze', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400', 'A Site Wall', 'Full site wall to split defenders'),
('Viper', 'defense', 'Breeze', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400', 'Mid Control Wall', 'Block mid crossing to isolate attackers'),
('KAY/O', 'attack', 'Haven', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400', 'C Site Knife', 'Suppress defenders on C site'),
('Brimstone', 'attack', 'Bind', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400', 'A Site Smokes', 'Default A execute smokes'),
('Cypher', 'defense', 'Split', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400', 'A Main Tripwire', 'Early warning tripwire setup'),
('Killjoy', 'defense', 'Icebox', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400', 'B Site Lockdown', 'Post-plant lockdown position');