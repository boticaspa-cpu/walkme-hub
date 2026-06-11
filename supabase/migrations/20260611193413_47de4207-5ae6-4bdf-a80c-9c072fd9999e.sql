
-- 1. leads: restrict INSERT
DROP POLICY IF EXISTS "Auth users can insert leads" ON public.leads;
CREATE POLICY "Auth users can insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (assigned_to = auth.uid() OR assigned_to IS NULL OR has_role(auth.uid(), 'admin'::app_role));

-- 2. quotes: restrict INSERT
DROP POLICY IF EXISTS "Auth users can insert quotes" ON public.quotes;
CREATE POLICY "Auth users can insert quotes" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 3. reservations: restrict INSERT
DROP POLICY IF EXISTS "Auth users can insert reservations" ON public.reservations;
CREATE POLICY "Auth users can insert reservations" ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 4. sales: restrict INSERT
DROP POLICY IF EXISTS "Auth users can insert sales" ON public.sales;
CREATE POLICY "Auth users can insert sales" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (sold_by = auth.uid());

-- 5. sale_items: restrict INSERT to owned sales
DROP POLICY IF EXISTS "Auth users can insert sale_items" ON public.sale_items;
CREATE POLICY "Auth users can insert sale_items" ON public.sale_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
        AND (s.sold_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- 6. cash_movements: restrict INSERT to own session
DROP POLICY IF EXISTS "Seller insert movements" ON public.cash_movements;
CREATE POLICY "Seller insert movements" ON public.cash_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cash_sessions cs
      WHERE cs.id = cash_movements.session_id
        AND cs.opened_by = auth.uid()
    )
  );

-- 7. operators: authenticated-only
DROP POLICY IF EXISTS "Auth users can read operators" ON public.operators;
DROP POLICY IF EXISTS "Admins can insert operators" ON public.operators;
DROP POLICY IF EXISTS "Admins can update operators" ON public.operators;
DROP POLICY IF EXISTS "Admins can delete operators" ON public.operators;
CREATE POLICY "Auth users can read operators" ON public.operators
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert operators" ON public.operators
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update operators" ON public.operators
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete operators" ON public.operators
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.operators FROM anon;

-- 8. categories: authenticated-only
DROP POLICY IF EXISTS "Auth users can read categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Auth users can read categories" ON public.categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.categories FROM anon;

-- 9. profiles: block sellers from escalating privileges
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      RAISE EXCEPTION 'Not authorized to change approval_status';
    END IF;
    IF NEW.commission_rate IS DISTINCT FROM OLD.commission_rate THEN
      RAISE EXCEPTION 'Not authorized to change commission_rate';
    END IF;
    IF NEW.commission_percentage IS DISTINCT FROM OLD.commission_percentage THEN
      RAISE EXCEPTION 'Not authorized to change commission_percentage';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 10. storage: remove public listing on media bucket (direct URLs still work since bucket is public)
DROP POLICY IF EXISTS "Anyone can read media" ON storage.objects;

-- 11. set search_path on commission/payable trigger function
CREATE OR REPLACE FUNCTION public.create_commission_and_payable_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO commissions (
      reservation_id, seller_id, gross_profit, net_profit, commission_rate,
      commission_amount, agency_commission, status
    )
    SELECT
      NEW.id, NEW.created_by, NEW.total_mxn * 0.30, NEW.total_mxn * 0.30, 50.00,
      NEW.total_mxn * 0.30 * 0.50, NEW.total_mxn * 0.30 * 0.50, 'pending'
    WHERE NOT EXISTS (SELECT 1 FROM commissions WHERE reservation_id = NEW.id);

    INSERT INTO operator_payables (
      operator_id, sale_date, amount_currency, amount_value, equivalent_mxn, status, notes
    )
    SELECT DISTINCT
      t.operator_id, NEW.reservation_date, 'USD',
      (NEW.total_mxn * 0.70) / 17.5, NEW.total_mxn * 0.70, 'pending',
      CONCAT('Reserva ', LEFT(NEW.id::text, 8))
    FROM reservation_items ri
    JOIN tours t ON t.id = ri.tour_id
    WHERE ri.reservation_id = NEW.id
      AND t.operator_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM operator_payables WHERE notes LIKE CONCAT('%', LEFT(NEW.id::text, 8), '%'));
  END IF;
  RETURN NEW;
END;
$function$;
