
CREATE TABLE public.tour_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  name text NOT NULL,
  service_type text NOT NULL DEFAULT 'with_transport',
  public_price_adult_usd numeric NOT NULL DEFAULT 0,
  public_price_child_usd numeric NOT NULL DEFAULT 0,
  cost_adult_usd numeric NOT NULL DEFAULT 0,
  cost_child_usd numeric NOT NULL DEFAULT 0,
  tax_adult_usd numeric NOT NULL DEFAULT 0,
  tax_child_usd numeric NOT NULL DEFAULT 0,
  mandatory_fees_usd numeric NOT NULL DEFAULT 0,
  exchange_rate_tour numeric NOT NULL DEFAULT 0,
  price_adult_mxn numeric NOT NULL DEFAULT 0,
  price_child_mxn numeric NOT NULL DEFAULT 0,
  includes text[] NOT NULL DEFAULT '{}',
  excludes text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read tour_packages" ON public.tour_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tour_packages" ON public.tour_packages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tour_packages" ON public.tour_packages FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tour_packages" ON public.tour_packages FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.sale_items ADD COLUMN tour_package_id uuid REFERENCES public.tour_packages(id);
