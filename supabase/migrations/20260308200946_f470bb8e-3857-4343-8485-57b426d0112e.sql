
-- Create promotions table
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  discount_mode text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  discount_mxn numeric NOT NULL DEFAULT 0,
  subtotal_mxn numeric NOT NULL DEFAULT 0,
  total_mxn numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create promotion_tours join table
CREATE TABLE public.promotion_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_tours ENABLE ROW LEVEL SECURITY;

-- Promotions RLS: admin full, auth read
CREATE POLICY "Admin full promotions" ON public.promotions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read promotions" ON public.promotions FOR SELECT TO authenticated
  USING (true);

-- Promotion tours RLS: admin full, auth read
CREATE POLICY "Admin full promotion_tours" ON public.promotion_tours FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth read promotion_tours" ON public.promotion_tours FOR SELECT TO authenticated
  USING (true);
