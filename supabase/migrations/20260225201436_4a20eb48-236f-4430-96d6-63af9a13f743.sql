
-- Add exchange_rate_tour column
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS exchange_rate_tour numeric NOT NULL DEFAULT 0;

-- Recreate RLS policies as PERMISSIVE
DROP POLICY IF EXISTS "Admins can delete tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can insert tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can update tours" ON public.tours;
DROP POLICY IF EXISTS "Auth users can read tours" ON public.tours;

CREATE POLICY "Admins can delete tours" ON public.tours FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert tours" ON public.tours FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tours" ON public.tours FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can read tours" ON public.tours FOR SELECT TO authenticated USING (true);
