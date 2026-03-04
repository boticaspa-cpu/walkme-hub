
-- Enums
CREATE TYPE public.expense_type AS ENUM ('fixed', 'variable');
CREATE TYPE public.expense_frequency AS ENUM ('monthly', 'one_time');
CREATE TYPE public.expense_status AS ENUM ('planned', 'paid');
CREATE TYPE public.expense_payment_method AS ENUM ('cash', 'bank_transfer', 'card', 'other');

-- expense_concepts
CREATE TABLE public.expense_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  expense_type public.expense_type NOT NULL DEFAULT 'fixed',
  frequency public.expense_frequency NOT NULL DEFAULT 'monthly',
  default_due_day int,
  default_due_date date,
  estimated_amount_mxn numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- expense_items
CREATE TABLE public.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id uuid NOT NULL REFERENCES public.expense_concepts(id),
  period_month text NOT NULL,
  due_date date NOT NULL,
  estimated_amount_mxn numeric NOT NULL DEFAULT 0,
  status public.expense_status NOT NULL DEFAULT 'planned',
  paid_amount_mxn numeric,
  paid_at timestamptz,
  payment_method public.expense_payment_method,
  reference text,
  proof_image_path text,
  proof_image_url text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_monthly_concept_period ON public.expense_items (concept_id, period_month);

-- RLS
ALTER TABLE public.expense_concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full concepts" ON public.expense_concepts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full items" ON public.expense_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-proofs', 'expense-proofs', false);
CREATE POLICY "Admin upload proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expense-proofs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin read proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'expense-proofs' AND public.has_role(auth.uid(), 'admin'));
