
-- A) Add columns to reservations
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS confirmation_status text NOT NULL DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES public.sales(id);

-- B) Add receipt_number to sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS receipt_number text;

-- C) Create operator_payables
CREATE TABLE IF NOT EXISTS public.operator_payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id),
  operator_id uuid NOT NULL REFERENCES public.operators(id),
  service_date date NOT NULL,
  payment_rule_snapshot text NOT NULL DEFAULT 'prepago',
  due_date date NOT NULL,
  payable_month text,
  amount_mxn numeric NOT NULL DEFAULT 0,
  amount_fx numeric,
  currency_fx text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_payables ENABLE ROW LEVEL SECURITY;

-- RLS for operator_payables
CREATE POLICY "Admin full payables" ON public.operator_payables FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Auth read payables" ON public.operator_payables FOR SELECT TO authenticated USING (true);

-- Allow sellers to insert payables (created during checkout)
CREATE POLICY "Auth insert payables" ON public.operator_payables FOR INSERT TO authenticated WITH CHECK (true);
