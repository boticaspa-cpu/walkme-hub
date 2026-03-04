-- Enum for session status
CREATE TYPE public.cash_session_status AS ENUM ('open', 'closed');

-- Enum for movement types
CREATE TYPE public.cash_movement_type AS ENUM (
  'sale_cash','sale_card','sale_transfer','in_cash','out_cash','refund','withdrawal','adjustment'
);

-- cash_registers
CREATE TABLE public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Caja Principal',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read registers" ON public.cash_registers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage registers" ON public.cash_registers FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.cash_registers (name) VALUES ('Caja Principal');

-- cash_sessions
CREATE TABLE public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id uuid NOT NULL REFERENCES public.cash_registers(id),
  opened_by uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  business_date date NOT NULL DEFAULT CURRENT_DATE,
  opening_float_mxn numeric NOT NULL DEFAULT 0,
  opening_fx jsonb,
  status cash_session_status NOT NULL DEFAULT 'open',
  closed_by uuid,
  closed_at timestamptz,
  expected_cash_mxn numeric,
  counted_cash_mxn numeric,
  variance_mxn numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX uq_open_session_per_register ON public.cash_sessions (register_id) WHERE status = 'open';

CREATE POLICY "Admin full sessions" ON public.cash_sessions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Seller read own sessions" ON public.cash_sessions FOR SELECT TO authenticated
  USING (opened_by = auth.uid());
CREATE POLICY "Seller insert sessions" ON public.cash_sessions FOR INSERT TO authenticated
  WITH CHECK (opened_by = auth.uid());
CREATE POLICY "Seller update own open" ON public.cash_sessions FOR UPDATE TO authenticated
  USING (opened_by = auth.uid() AND status = 'open');

-- cash_movements
CREATE TABLE public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cash_sessions(id),
  type cash_movement_type NOT NULL,
  amount_mxn numeric NOT NULL DEFAULT 0,
  amount_fx numeric,
  currency_fx text,
  reference text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full movements" ON public.cash_movements FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Seller read own movements" ON public.cash_movements FOR SELECT TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "Seller insert movements" ON public.cash_movements FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Link sales to sessions
ALTER TABLE public.sales ADD COLUMN cash_session_id uuid REFERENCES public.cash_sessions(id);