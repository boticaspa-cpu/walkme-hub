
-- =============================================
-- Fix: Convert ALL RESTRICTIVE policies to PERMISSIVE
-- Tables: tours, categories, operators
-- =============================================

-- TOURS: Drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Auth users can read tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can insert tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can update tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can delete tours" ON public.tours;

CREATE POLICY "Auth users can read tours" ON public.tours FOR SELECT USING (true);
CREATE POLICY "Admins can insert tours" ON public.tours FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tours" ON public.tours FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tours" ON public.tours FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- CATEGORIES: Drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Auth users can read categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Auth users can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- OPERATORS: Drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Auth users can read operators" ON public.operators;
DROP POLICY IF EXISTS "Admins can insert operators" ON public.operators;
DROP POLICY IF EXISTS "Admins can update operators" ON public.operators;
DROP POLICY IF EXISTS "Admins can delete operators" ON public.operators;

CREATE POLICY "Auth users can read operators" ON public.operators FOR SELECT USING (true);
CREATE POLICY "Admins can insert operators" ON public.operators FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update operators" ON public.operators FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete operators" ON public.operators FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
