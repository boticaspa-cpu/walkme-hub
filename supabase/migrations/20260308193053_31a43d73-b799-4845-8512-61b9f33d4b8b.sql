
-- Promo packages table
CREATE TABLE public.promo_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  discount_rule text NOT NULL DEFAULT 'xcaret_contract',
  public_price_adult_usd numeric NOT NULL DEFAULT 0,
  public_price_child_usd numeric NOT NULL DEFAULT 0,
  preferential_adult_usd numeric NOT NULL DEFAULT 0,
  preferential_child_usd numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 0.30,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read promo_packages" ON public.promo_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert promo_packages" ON public.promo_packages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update promo_packages" ON public.promo_packages FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete promo_packages" ON public.promo_packages FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Junction table for tours in a promo package
CREATE TABLE public.promo_package_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_package_id uuid NOT NULL REFERENCES public.promo_packages(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  UNIQUE (promo_package_id, tour_id)
);

ALTER TABLE public.promo_package_tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read promo_package_tours" ON public.promo_package_tours FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert promo_package_tours" ON public.promo_package_tours FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete promo_package_tours" ON public.promo_package_tours FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
