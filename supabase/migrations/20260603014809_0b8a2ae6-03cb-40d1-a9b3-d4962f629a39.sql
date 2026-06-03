
-- Fix: clients PII only visible to creator or admin
DROP POLICY IF EXISTS "Auth users can read clients" ON public.clients;
CREATE POLICY "Owners or admins can read clients"
ON public.clients FOR SELECT TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Fix: daily_closings admin only
DROP POLICY IF EXISTS "Auth users can read daily_closings" ON public.daily_closings;
CREATE POLICY "Admins read daily_closings"
ON public.daily_closings FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Fix: leads only assigned seller or admin
DROP POLICY IF EXISTS "Auth users can read leads" ON public.leads;
CREATE POLICY "Assigned or admins can read leads"
ON public.leads FOR SELECT TO authenticated
USING (assigned_to = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Fix: operator_payables - remove public read, admins only
DROP POLICY IF EXISTS "Seller view operator_payables" ON public.operator_payables;

-- Fix: profiles - own or admin
DROP POLICY IF EXISTS "Auth users can read profiles" ON public.profiles;
CREATE POLICY "Own profile or admin"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Fix: promo_packages admin write only
DROP POLICY IF EXISTS "Auth delete promo_packages" ON public.promo_packages;
DROP POLICY IF EXISTS "Auth insert promo_packages" ON public.promo_packages;
DROP POLICY IF EXISTS "Auth update promo_packages" ON public.promo_packages;
CREATE POLICY "Admins write promo_packages"
ON public.promo_packages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Fix: promo_package_tours admin write only
DROP POLICY IF EXISTS "Auth delete promo_package_tours" ON public.promo_package_tours;
DROP POLICY IF EXISTS "Auth insert promo_package_tours" ON public.promo_package_tours;
DROP POLICY IF EXISTS "Auth update promo_package_tours" ON public.promo_package_tours;
CREATE POLICY "Admins write promo_package_tours"
ON public.promo_package_tours FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Fix: reservation_items - owners or admin
DROP POLICY IF EXISTS "Auth read reservation_items" ON public.reservation_items;
CREATE POLICY "Owners or admins read reservation_items"
ON public.reservation_items FOR SELECT TO authenticated
USING (owns_reservation(reservation_id) OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Auth insert reservation_items" ON public.reservation_items;
CREATE POLICY "Owners or admins insert reservation_items"
ON public.reservation_items FOR INSERT TO authenticated
WITH CHECK (owns_reservation(reservation_id) OR has_role(auth.uid(), 'admin'));

-- Fix: transfers - INSERT must set created_by = auth.uid()
DROP POLICY IF EXISTS "Auth users can insert transfers" ON public.transfers;
CREATE POLICY "Sellers insert own transfers"
ON public.transfers FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
