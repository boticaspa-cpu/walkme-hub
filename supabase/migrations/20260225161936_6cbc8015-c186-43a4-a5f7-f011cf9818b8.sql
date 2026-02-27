
-- Fix reservations RLS: drop RESTRICTIVE, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Auth users can read reservations" ON public.reservations;
DROP POLICY IF EXISTS "Auth users can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can delete reservations" ON public.reservations;

CREATE POLICY "Auth users can read reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix clients RLS: drop RESTRICTIVE, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Auth users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Auth users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;

CREATE POLICY "Auth users can read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
