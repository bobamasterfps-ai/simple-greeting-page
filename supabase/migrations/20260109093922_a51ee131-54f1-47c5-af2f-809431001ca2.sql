-- Add ability column to lineups table
ALTER TABLE public.lineups
ADD COLUMN ability text;

-- Create lineup_images table for multi-image lineups
CREATE TABLE public.lineup_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id uuid NOT NULL REFERENCES public.lineups(id) ON DELETE CASCADE,
  image_type text NOT NULL, -- 'throw', 'aim', 'result'
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on lineup_images
ALTER TABLE public.lineup_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view lineup images (same as lineups)
CREATE POLICY "Lineup images are viewable by everyone"
ON public.lineup_images
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_lineup_images_lineup_id ON public.lineup_images(lineup_id);

-- Add some sample lineup images for existing lineups
INSERT INTO public.lineup_images (lineup_id, image_type, image_url, display_order)
SELECT 
  id as lineup_id,
  'throw' as image_type,
  image_url,
  1 as display_order
FROM public.lineups
WHERE image_url IS NOT NULL;

-- Update existing lineups with abilities based on agent
UPDATE public.lineups SET ability = 
  CASE 
    WHEN agent = 'Viper' THEN 'Snake Bite'
    WHEN agent = 'Sova' THEN 'Recon Bolt'
    WHEN agent = 'Brimstone' THEN 'Incendiary'
    WHEN agent = 'Killjoy' THEN 'Nanoswarm'
    WHEN agent = 'Cypher' THEN 'Trapwire'
    WHEN agent = 'Kay/O' THEN 'FLASH/drive'
    WHEN agent = 'Gekko' THEN 'Mosh Pit'
    WHEN agent = 'Fade' THEN 'Seize'
    ELSE 'Utility'
  END
WHERE ability IS NULL;