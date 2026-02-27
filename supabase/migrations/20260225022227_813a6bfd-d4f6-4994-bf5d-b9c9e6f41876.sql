
-- ============================================================
-- Fix ALL RLS policies: RESTRICTIVE → PERMISSIVE (default)
-- Same logic, just drop & recreate without RESTRICTIVE keyword
-- ============================================================

-- ======================== operators ========================
DROP POLICY IF EXISTS "Auth users can read operators" ON operators;
DROP POLICY IF EXISTS "Admins can insert operators" ON operators;
DROP POLICY IF EXISTS "Admins can update operators" ON operators;
DROP POLICY IF EXISTS "Admins can delete operators" ON operators;

CREATE POLICY "Auth users can read operators" ON operators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert operators" ON operators FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update operators" ON operators FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete operators" ON operators FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== categories ========================
DROP POLICY IF EXISTS "Auth users can read categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Auth users can read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== tours ========================
DROP POLICY IF EXISTS "Auth users can read tours" ON tours;
DROP POLICY IF EXISTS "Admins can insert tours" ON tours;
DROP POLICY IF EXISTS "Admins can update tours" ON tours;
DROP POLICY IF EXISTS "Admins can delete tours" ON tours;

CREATE POLICY "Auth users can read tours" ON tours FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tours" ON tours FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tours" ON tours FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tours" ON tours FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== clients ========================
DROP POLICY IF EXISTS "Auth users can read clients" ON clients;
DROP POLICY IF EXISTS "Auth users can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins can update clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

CREATE POLICY "Auth users can read clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update clients" ON clients FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete clients" ON clients FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== leads ========================
DROP POLICY IF EXISTS "Auth users can read leads" ON leads;
DROP POLICY IF EXISTS "Auth users can insert leads" ON leads;
DROP POLICY IF EXISTS "Sellers can update own leads" ON leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON leads;

CREATE POLICY "Auth users can read leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert leads" ON leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Sellers can update own leads" ON leads FOR UPDATE TO authenticated USING ((assigned_to = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete leads" ON leads FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== reservations ========================
DROP POLICY IF EXISTS "Auth users can read reservations" ON reservations;
DROP POLICY IF EXISTS "Auth users can insert reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can delete reservations" ON reservations;

CREATE POLICY "Auth users can read reservations" ON reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert reservations" ON reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update reservations" ON reservations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete reservations" ON reservations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== quotes ========================
DROP POLICY IF EXISTS "Auth users can read quotes" ON quotes;
DROP POLICY IF EXISTS "Auth users can insert quotes" ON quotes;
DROP POLICY IF EXISTS "Owners or admins can update quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can delete quotes" ON quotes;

CREATE POLICY "Auth users can read quotes" ON quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert quotes" ON quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners or admins can update quotes" ON quotes FOR UPDATE TO authenticated USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete quotes" ON quotes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== quote_items ========================
DROP POLICY IF EXISTS "Auth users can read quote_items" ON quote_items;
DROP POLICY IF EXISTS "Auth users can insert quote_items" ON quote_items;
DROP POLICY IF EXISTS "Auth users can update quote_items" ON quote_items;
DROP POLICY IF EXISTS "Auth users can delete quote_items" ON quote_items;

CREATE POLICY "Auth users can read quote_items" ON quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert quote_items" ON quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update quote_items" ON quote_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete quote_items" ON quote_items FOR DELETE TO authenticated USING (true);

-- ======================== sales ========================
DROP POLICY IF EXISTS "Auth users can read sales" ON sales;
DROP POLICY IF EXISTS "Auth users can insert sales" ON sales;
DROP POLICY IF EXISTS "Admins can update sales" ON sales;
DROP POLICY IF EXISTS "Admins can delete sales" ON sales;

CREATE POLICY "Auth users can read sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update sales" ON sales FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sales" ON sales FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== sale_items ========================
DROP POLICY IF EXISTS "Auth users can read sale_items" ON sale_items;
DROP POLICY IF EXISTS "Auth users can insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Admins can update sale_items" ON sale_items;
DROP POLICY IF EXISTS "Admins can delete sale_items" ON sale_items;

CREATE POLICY "Auth users can read sale_items" ON sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sale_items" ON sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update sale_items" ON sale_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sale_items" ON sale_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== commissions ========================
DROP POLICY IF EXISTS "Auth users can read own commissions" ON commissions;
DROP POLICY IF EXISTS "Admins can insert commissions" ON commissions;
DROP POLICY IF EXISTS "Admins can update commissions" ON commissions;
DROP POLICY IF EXISTS "Admins can delete commissions" ON commissions;

CREATE POLICY "Auth users can read own commissions" ON commissions FOR SELECT TO authenticated USING ((seller_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert commissions" ON commissions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update commissions" ON commissions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete commissions" ON commissions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== daily_closings ========================
DROP POLICY IF EXISTS "Auth users can read daily_closings" ON daily_closings;
DROP POLICY IF EXISTS "Admins can insert daily_closings" ON daily_closings;
DROP POLICY IF EXISTS "Admins can update daily_closings" ON daily_closings;
DROP POLICY IF EXISTS "Admins can delete daily_closings" ON daily_closings;

CREATE POLICY "Auth users can read daily_closings" ON daily_closings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert daily_closings" ON daily_closings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update daily_closings" ON daily_closings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete daily_closings" ON daily_closings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ======================== profiles ========================
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- ======================== user_roles ========================
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

CREATE POLICY "Users can read own roles" ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all roles" ON user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
