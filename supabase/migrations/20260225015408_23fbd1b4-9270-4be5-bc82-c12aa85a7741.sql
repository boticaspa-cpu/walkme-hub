
-- =============================================
-- FULL SCHEMA: 13 tables + bucket + RLS + triggers
-- =============================================

-- 1) OPERATORS
CREATE TABLE public.operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text,
  logo_url text,
  tags text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- 2) CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3) TOURS
CREATE TABLE public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  operator_id uuid REFERENCES public.operators(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'shared',
  price_mxn numeric NOT NULL DEFAULT 0,
  days text[] NOT NULL DEFAULT '{}',
  image_url text,
  short_description text NOT NULL DEFAULT '',
  itinerary text NOT NULL DEFAULT '',
  includes text[] NOT NULL DEFAULT '{}',
  excludes text[] NOT NULL DEFAULT '{}',
  meeting_point text NOT NULL DEFAULT '',
  what_to_bring text[] NOT NULL DEFAULT '{}',
  recommendations text,
  tags text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- 4) CLIENTS
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 5) LEADS
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  origin text NOT NULL DEFAULT 'Walk-in',
  destination text NOT NULL DEFAULT '',
  travel_date date,
  pax integer NOT NULL DEFAULT 1,
  budget text,
  status text NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 6) RESERVATIONS
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text UNIQUE,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  reservation_date date NOT NULL,
  reservation_time text NOT NULL DEFAULT '',
  pax integer NOT NULL DEFAULT 1,
  modality text NOT NULL DEFAULT 'shared',
  status text NOT NULL DEFAULT 'scheduled',
  total_mxn numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 7) QUOTES
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  total_mxn numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 8) QUOTE_ITEMS
CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  qty integer NOT NULL DEFAULT 1,
  unit_price_mxn numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- 9) SALES
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  currency text NOT NULL DEFAULT 'MXN',
  exchange_rate numeric NOT NULL DEFAULT 1,
  subtotal_mxn numeric NOT NULL DEFAULT 0,
  discount_mxn numeric NOT NULL DEFAULT 0,
  total_mxn numeric NOT NULL DEFAULT 0,
  sold_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sold_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 10) SALE_ITEMS
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  qty integer NOT NULL DEFAULT 1,
  unit_price_mxn numeric NOT NULL DEFAULT 0
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- 11) COMMISSIONS
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rate numeric NOT NULL DEFAULT 0.10,
  amount_mxn numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- 12) DAILY_CLOSINGS
CREATE TABLE public.daily_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_date date NOT NULL UNIQUE,
  total_sales integer NOT NULL DEFAULT 0,
  cash_mxn numeric NOT NULL DEFAULT 0,
  cash_usd numeric NOT NULL DEFAULT 0,
  cash_eur numeric NOT NULL DEFAULT 0,
  cash_cad numeric NOT NULL DEFAULT 0,
  card_mxn numeric NOT NULL DEFAULT 0,
  transfer_mxn numeric NOT NULL DEFAULT 0,
  exchange_rate_usd numeric NOT NULL DEFAULT 1,
  exchange_rate_eur numeric NOT NULL DEFAULT 1,
  exchange_rate_cad numeric NOT NULL DEFAULT 1,
  grand_total_mxn numeric NOT NULL DEFAULT 0,
  closed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_tours_operator ON public.tours(operator_id);
CREATE INDEX idx_tours_category ON public.tours(category_id);
CREATE INDEX idx_leads_assigned_status ON public.leads(assigned_to, status);
CREATE INDEX idx_reservations_date_status ON public.reservations(reservation_date, status);
CREATE INDEX idx_sales_sold_by_at ON public.sales(sold_by, sold_at);
CREATE INDEX idx_commissions_seller ON public.commissions(seller_id);

-- =============================================
-- TRIGGERS: updated_at
-- =============================================
CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON public.operators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FOLIO GENERATOR
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_folio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix text;
  _seq bigint;
  _folio text;
BEGIN
  IF TG_TABLE_NAME = 'reservations' THEN
    _prefix := 'WM';
  ELSIF TG_TABLE_NAME = 'quotes' THEN
    _prefix := 'COT';
  ELSE
    _prefix := 'FOL';
  END IF;

  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(folio, '^[A-Z]+-', ''), '')::bigint
  ), 0) + 1
  INTO _seq
  FROM (
    SELECT folio FROM public.reservations WHERE TG_TABLE_NAME = 'reservations'
    UNION ALL
    SELECT folio FROM public.quotes WHERE TG_TABLE_NAME = 'quotes'
  ) sub;

  _folio := _prefix || '-' || lpad(_seq::text, 3, '0');
  NEW.folio := _folio;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reservations_folio BEFORE INSERT ON public.reservations
  FOR EACH ROW WHEN (NEW.folio IS NULL)
  EXECUTE FUNCTION public.generate_folio();

CREATE TRIGGER trg_quotes_folio BEFORE INSERT ON public.quotes
  FOR EACH ROW WHEN (NEW.folio IS NULL)
  EXECUTE FUNCTION public.generate_folio();

-- =============================================
-- RLS POLICIES
-- =============================================

-- OPERATORS: read all auth, write admins
CREATE POLICY "Auth users can read operators" ON public.operators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert operators" ON public.operators FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update operators" ON public.operators FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete operators" ON public.operators FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CATEGORIES
CREATE POLICY "Auth users can read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TOURS
CREATE POLICY "Auth users can read tours" ON public.tours FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tours" ON public.tours FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tours" ON public.tours FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tours" ON public.tours FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CLIENTS
CREATE POLICY "Auth users can read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- LEADS
CREATE POLICY "Auth users can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Sellers can update own leads" ON public.leads FOR UPDATE TO authenticated USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RESERVATIONS
CREATE POLICY "Auth users can read reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- QUOTES
CREATE POLICY "Auth users can read quotes" ON public.quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners or admins can update quotes" ON public.quotes FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete quotes" ON public.quotes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- QUOTE_ITEMS
CREATE POLICY "Auth users can read quote_items" ON public.quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert quote_items" ON public.quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update quote_items" ON public.quote_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete quote_items" ON public.quote_items FOR DELETE TO authenticated USING (true);

-- SALES
CREATE POLICY "Auth users can read sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update sales" ON public.sales FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sales" ON public.sales FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SALE_ITEMS
CREATE POLICY "Auth users can read sale_items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update sale_items" ON public.sale_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sale_items" ON public.sale_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COMMISSIONS
CREATE POLICY "Auth users can read own commissions" ON public.commissions FOR SELECT TO authenticated USING (seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert commissions" ON public.commissions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update commissions" ON public.commissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete commissions" ON public.commissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DAILY_CLOSINGS
CREATE POLICY "Auth users can read daily_closings" ON public.daily_closings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert daily_closings" ON public.daily_closings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update daily_closings" ON public.daily_closings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete daily_closings" ON public.daily_closings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE: media bucket
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Anyone can read media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Auth users can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
