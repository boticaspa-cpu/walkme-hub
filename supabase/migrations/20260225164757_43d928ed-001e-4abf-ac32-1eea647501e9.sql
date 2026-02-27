
-- =========================================================
-- Phase 1a: Convert ALL restrictive RLS to PERMISSIVE
-- =========================================================

-- CATEGORIES
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Auth users can read categories" ON public.categories;

CREATE POLICY "Auth users can read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- OPERATORS
DROP POLICY IF EXISTS "Admins can delete operators" ON public.operators;
DROP POLICY IF EXISTS "Admins can insert operators" ON public.operators;
DROP POLICY IF EXISTS "Admins can update operators" ON public.operators;
DROP POLICY IF EXISTS "Auth users can read operators" ON public.operators;

CREATE POLICY "Auth users can read operators" ON public.operators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert operators" ON public.operators FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update operators" ON public.operators FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete operators" ON public.operators FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- TOURS
DROP POLICY IF EXISTS "Admins can delete tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can insert tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can update tours" ON public.tours;
DROP POLICY IF EXISTS "Auth users can read tours" ON public.tours;

CREATE POLICY "Auth users can read tours" ON public.tours FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tours" ON public.tours FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tours" ON public.tours FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tours" ON public.tours FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- LEADS
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Auth users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Auth users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Sellers can update own leads" ON public.leads;

CREATE POLICY "Auth users can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Sellers can update own leads" ON public.leads FOR UPDATE TO authenticated USING ((assigned_to = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- QUOTES
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Auth users can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Auth users can read quotes" ON public.quotes;
DROP POLICY IF EXISTS "Owners or admins can update quotes" ON public.quotes;

CREATE POLICY "Auth users can read quotes" ON public.quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners or admins can update quotes" ON public.quotes FOR UPDATE TO authenticated USING ((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete quotes" ON public.quotes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- QUOTE_ITEMS
DROP POLICY IF EXISTS "Auth users can delete quote_items" ON public.quote_items;
DROP POLICY IF EXISTS "Auth users can insert quote_items" ON public.quote_items;
DROP POLICY IF EXISTS "Auth users can read quote_items" ON public.quote_items;
DROP POLICY IF EXISTS "Auth users can update quote_items" ON public.quote_items;

CREATE POLICY "Auth users can read quote_items" ON public.quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert quote_items" ON public.quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update quote_items" ON public.quote_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete quote_items" ON public.quote_items FOR DELETE TO authenticated USING (true);

-- SALES
DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can update sales" ON public.sales;
DROP POLICY IF EXISTS "Auth users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Auth users can read sales" ON public.sales;

CREATE POLICY "Auth users can read sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update sales" ON public.sales FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sales" ON public.sales FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- SALE_ITEMS
DROP POLICY IF EXISTS "Admins can delete sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Admins can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Auth users can insert sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Auth users can read sale_items" ON public.sale_items;

CREATE POLICY "Auth users can read sale_items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update sale_items" ON public.sale_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sale_items" ON public.sale_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- COMMISSIONS
DROP POLICY IF EXISTS "Admins can delete commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can insert commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can update commissions" ON public.commissions;
DROP POLICY IF EXISTS "Auth users can read own commissions" ON public.commissions;

CREATE POLICY "Auth users can read own commissions" ON public.commissions FOR SELECT TO authenticated USING ((seller_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert commissions" ON public.commissions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update commissions" ON public.commissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete commissions" ON public.commissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- DAILY_CLOSINGS
DROP POLICY IF EXISTS "Admins can delete daily_closings" ON public.daily_closings;
DROP POLICY IF EXISTS "Admins can insert daily_closings" ON public.daily_closings;
DROP POLICY IF EXISTS "Admins can update daily_closings" ON public.daily_closings;
DROP POLICY IF EXISTS "Auth users can read daily_closings" ON public.daily_closings;

CREATE POLICY "Auth users can read daily_closings" ON public.daily_closings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert daily_closings" ON public.daily_closings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update daily_closings" ON public.daily_closings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete daily_closings" ON public.daily_closings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- PROFILES
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Auth users can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- USER_ROLES
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Auth users can read roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RESERVATIONS
DROP POLICY IF EXISTS "Admins can delete reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Auth users can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Auth users can read reservations" ON public.reservations;

CREATE POLICY "Auth users can read reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- CLIENTS
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Auth users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Auth users can read clients" ON public.clients;

CREATE POLICY "Auth users can read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- Phase 1b: Create message_templates table
-- =========================================================

CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  body text NOT NULL DEFAULT '',
  trigger_event text NOT NULL DEFAULT 'manual',
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read message_templates" ON public.message_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert message_templates" ON public.message_templates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update message_templates" ON public.message_templates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete message_templates" ON public.message_templates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER trg_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
