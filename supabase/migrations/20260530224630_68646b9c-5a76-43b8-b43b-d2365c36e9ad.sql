
CREATE TABLE public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  client_name text NOT NULL DEFAULT '',
  client_phone text NOT NULL DEFAULT '',
  client_email text NOT NULL DEFAULT '',
  service_date date NOT NULL,
  pickup_time text NOT NULL DEFAULT '',
  pax_adults integer NOT NULL DEFAULT 1,
  pax_children integer NOT NULL DEFAULT 0,
  origin text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  vehicle_type text NOT NULL DEFAULT 'Sedán',
  hotel_name text NOT NULL DEFAULT '',
  room_number text NOT NULL DEFAULT '',
  flight_info text NOT NULL DEFAULT '',
  operator_id uuid,
  price_mxn numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MXN',
  exchange_rate numeric NOT NULL DEFAULT 1,
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_method text,
  status text NOT NULL DEFAULT 'scheduled',
  notes text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfers TO authenticated;
GRANT ALL ON public.transfers TO service_role;

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can insert transfers"
  ON public.transfers FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Sellers read own transfers"
  ON public.transfers FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers update own transfers"
  ON public.transfers FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete transfers"
  ON public.transfers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_transfers_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Folio trigger for transfers (TRF-XXX)
CREATE OR REPLACE FUNCTION public.generate_transfer_folio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _seq bigint;
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(folio, '^TRF-', ''), '')::bigint), 0) + 1
    INTO _seq FROM public.transfers WHERE folio LIKE 'TRF-%';
    NEW.folio := 'TRF-' || lpad(_seq::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER transfers_folio_trigger
  BEFORE INSERT ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.generate_transfer_folio();
