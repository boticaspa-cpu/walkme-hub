
-- ============================================================
-- 1a. Create settings table
-- ============================================================
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read settings"
  ON public.settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert settings"
  ON public.settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings"
  ON public.settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete settings"
  ON public.settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed exchange rates
INSERT INTO public.settings (key, value) VALUES
  ('exchange_rate_usd', '17.50'),
  ('exchange_rate_eur', '19.00'),
  ('exchange_rate_cad', '13.00');

-- ============================================================
-- 1b. Add 6 columns to tours
-- ============================================================
ALTER TABLE public.tours ADD COLUMN price_adult_usd numeric NOT NULL DEFAULT 0;
ALTER TABLE public.tours ADD COLUMN price_child_usd numeric NOT NULL DEFAULT 0;
ALTER TABLE public.tours ADD COLUMN child_age_min integer NOT NULL DEFAULT 4;
ALTER TABLE public.tours ADD COLUMN child_age_max integer NOT NULL DEFAULT 10;
ALTER TABLE public.tours ADD COLUMN suggested_price_mxn numeric NOT NULL DEFAULT 0;
ALTER TABLE public.tours ADD COLUMN mandatory_fees_usd numeric NOT NULL DEFAULT 0;

-- ============================================================
-- 1c. Convert RLS from RESTRICTIVE to PERMISSIVE
-- ============================================================

-- categories
DROP POLICY "Auth users can read categories" ON public.categories;
DROP POLICY "Admins can insert categories" ON public.categories;
DROP POLICY "Admins can update categories" ON public.categories;
DROP POLICY "Admins can delete categories" ON public.categories;

CREATE POLICY "Auth users can read categories"
  ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- operators
DROP POLICY "Auth users can read operators" ON public.operators;
DROP POLICY "Admins can insert operators" ON public.operators;
DROP POLICY "Admins can update operators" ON public.operators;
DROP POLICY "Admins can delete operators" ON public.operators;

CREATE POLICY "Auth users can read operators"
  ON public.operators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert operators"
  ON public.operators FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update operators"
  ON public.operators FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete operators"
  ON public.operators FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- tours
DROP POLICY "Auth users can read tours" ON public.tours;
DROP POLICY "Admins can insert tours" ON public.tours;
DROP POLICY "Admins can update tours" ON public.tours;
DROP POLICY "Admins can delete tours" ON public.tours;

CREATE POLICY "Auth users can read tours"
  ON public.tours FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tours"
  ON public.tours FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tours"
  ON public.tours FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tours"
  ON public.tours FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
