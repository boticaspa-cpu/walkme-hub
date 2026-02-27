
-- Migration 1: Add columns to operators
ALTER TABLE public.operators
  ADD COLUMN IF NOT EXISTS exchange_rate numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS base_currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payment_rules text NOT NULL DEFAULT 'prepago';

-- Migration 2: Add image_urls array to tours, migrate data, drop old column
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
UPDATE public.tours SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_url != '';
ALTER TABLE public.tours DROP COLUMN IF EXISTS image_url;

-- Migration 3: Drop and recreate tour_price_variants
DROP TABLE IF EXISTS public.tour_price_variants CASCADE;

CREATE TABLE public.tour_price_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  zone text NOT NULL DEFAULT 'Cancun',
  pax_type text NOT NULL DEFAULT 'Adulto',
  nationality text NOT NULL DEFAULT 'Extranjero',
  sale_price numeric NOT NULL DEFAULT 0,
  net_cost numeric NOT NULL DEFAULT 0,
  tax_fee numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_variant_lookup
  ON public.tour_price_variants(tour_id, operator_id, zone, pax_type, nationality);

ALTER TABLE public.tour_price_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read tour_price_variants"
  ON public.tour_price_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tour_price_variants"
  ON public.tour_price_variants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tour_price_variants"
  ON public.tour_price_variants FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tour_price_variants"
  ON public.tour_price_variants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Migration 4: Create seller-safe VIEW (excludes net_cost)
CREATE OR REPLACE VIEW public.tour_price_variants_seller
WITH (security_invoker = on) AS
  SELECT id, tour_id, operator_id, zone, pax_type, nationality,
         sale_price, tax_fee, active, created_at
  FROM public.tour_price_variants;

-- Migration 5: Update sale_items FK constraint
ALTER TABLE public.sale_items
  DROP CONSTRAINT IF EXISTS sale_items_tour_price_variant_id_fkey;
ALTER TABLE public.sale_items
  ADD CONSTRAINT sale_items_tour_price_variant_id_fkey
  FOREIGN KEY (tour_price_variant_id) REFERENCES public.tour_price_variants(id);
