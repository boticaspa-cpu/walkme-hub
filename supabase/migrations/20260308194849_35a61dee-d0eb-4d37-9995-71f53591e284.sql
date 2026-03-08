
-- Allow all authenticated users to manage promo_packages
DROP POLICY IF EXISTS "Admin insert promo_packages" ON public.promo_packages;
DROP POLICY IF EXISTS "Admin update promo_packages" ON public.promo_packages;
DROP POLICY IF EXISTS "Admin delete promo_packages" ON public.promo_packages;

CREATE POLICY "Auth insert promo_packages" ON public.promo_packages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update promo_packages" ON public.promo_packages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete promo_packages" ON public.promo_packages FOR DELETE TO authenticated USING (true);

-- Allow all authenticated users to manage promo_package_tours
DROP POLICY IF EXISTS "Admin insert promo_package_tours" ON public.promo_package_tours;
DROP POLICY IF EXISTS "Admin delete promo_package_tours" ON public.promo_package_tours;

CREATE POLICY "Auth insert promo_package_tours" ON public.promo_package_tours FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update promo_package_tours" ON public.promo_package_tours FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete promo_package_tours" ON public.promo_package_tours FOR DELETE TO authenticated USING (true);
