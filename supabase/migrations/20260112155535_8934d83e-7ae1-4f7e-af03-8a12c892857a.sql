-- Explicitly deny all write operations on lineups table
-- Since lineups are managed via migrations/admin only, users should not be able to modify them
CREATE POLICY "Deny all inserts on lineups"
ON public.lineups
FOR INSERT
TO public
WITH CHECK (false);

CREATE POLICY "Deny all updates on lineups"
ON public.lineups
FOR UPDATE
TO public
USING (false);

CREATE POLICY "Deny all deletes on lineups"
ON public.lineups
FOR DELETE
TO public
USING (false);

-- Explicitly deny all write operations on lineup_images table
CREATE POLICY "Deny all inserts on lineup_images"
ON public.lineup_images
FOR INSERT
TO public
WITH CHECK (false);

CREATE POLICY "Deny all updates on lineup_images"
ON public.lineup_images
FOR UPDATE
TO public
USING (false);

CREATE POLICY "Deny all deletes on lineup_images"
ON public.lineup_images
FOR DELETE
TO public
USING (false);