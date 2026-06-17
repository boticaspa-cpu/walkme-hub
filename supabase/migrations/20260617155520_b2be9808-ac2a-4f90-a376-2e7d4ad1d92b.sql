
-- ============================================================
-- Audit fix migration: money flow + open screens for sellers
-- ============================================================

-- 1) Persist card fee on sales for accurate margins
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS card_fee_mxn numeric NOT NULL DEFAULT 0;

-- 2) Backfill USD operator_payables that have no exchange rate (assume 17.5)
UPDATE public.operator_payables
SET exchange_rate_used = 17.5,
    equivalent_mxn = amount_value * 17.5
WHERE amount_currency = 'USD'
  AND (exchange_rate_used IS NULL OR equivalent_mxn IS NULL);

-- 3) Security-definer ownership helper for sales (used by RLS on operator_payables)
CREATE OR REPLACE FUNCTION public.owns_sale(_sale_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sales
    WHERE id = _sale_id AND sold_by = auth.uid()
  )
$$;

-- 4) operator_payables: allow seller to see/update payables for their own sales
DROP POLICY IF EXISTS "Sellers view own payables" ON public.operator_payables;
CREATE POLICY "Sellers view own payables"
ON public.operator_payables FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (sale_id IS NOT NULL AND public.owns_sale(sale_id))
);

DROP POLICY IF EXISTS "Sellers update own payables" ON public.operator_payables;
CREATE POLICY "Sellers update own payables"
ON public.operator_payables FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (sale_id IS NOT NULL AND public.owns_sale(sale_id))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (sale_id IS NOT NULL AND public.owns_sale(sale_id))
);

DROP POLICY IF EXISTS "Auth insert payables" ON public.operator_payables;
CREATE POLICY "Auth insert payables"
ON public.operator_payables FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5) expense_items: allow seller to see/insert/update their own expenses
DROP POLICY IF EXISTS "Sellers view own expenses" ON public.expense_items;
CREATE POLICY "Sellers view own expenses"
ON public.expense_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "Sellers insert own expenses" ON public.expense_items;
CREATE POLICY "Sellers insert own expenses"
ON public.expense_items FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "Sellers update own expenses" ON public.expense_items;
CREATE POLICY "Sellers update own expenses"
ON public.expense_items FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid()
);

-- 6) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_operator_payables_sale_id ON public.operator_payables(sale_id);
CREATE INDEX IF NOT EXISTS idx_commissions_sale_id ON public.commissions(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_by ON public.sales(sold_by);
CREATE INDEX IF NOT EXISTS idx_expense_items_created_by ON public.expense_items(created_by);
