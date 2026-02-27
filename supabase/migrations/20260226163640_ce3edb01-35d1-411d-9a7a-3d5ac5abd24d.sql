
CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read destinations" ON public.destinations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert destinations" ON public.destinations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update destinations" ON public.destinations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete destinations" ON public.destinations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.tours ADD COLUMN destination_id uuid REFERENCES public.destinations(id);
