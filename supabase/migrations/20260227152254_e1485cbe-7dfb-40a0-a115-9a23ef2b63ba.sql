
CREATE TABLE public.tour_price_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  tour_package_id uuid REFERENCES public.tour_packages(id) ON DELETE CASCADE,
  is_mexican boolean NOT NULL DEFAULT false,
  zone text NOT NULL DEFAULT 'Cancun',
  price_adult_mxn numeric NOT NULL DEFAULT 0,
  price_child_mxn numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_tour_variant 
  ON public.tour_price_variants(tour_id, COALESCE(tour_package_id, '00000000-0000-0000-0000-000000000000'), is_mexican, zone);

ALTER TABLE public.tour_price_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read tour_price_variants" ON public.tour_price_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tour_price_variants" ON public.tour_price_variants FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tour_price_variants" ON public.tour_price_variants FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tour_price_variants" ON public.tour_price_variants FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.sale_items ADD COLUMN tour_price_variant_id uuid REFERENCES public.tour_price_variants(id);
