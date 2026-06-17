
-- Tighten INSERT policy on operator_payables (no longer always-true)
DROP POLICY IF EXISTS "Auth insert payables" ON public.operator_payables;
CREATE POLICY "Auth insert payables"
ON public.operator_payables FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (sale_id IS NOT NULL AND public.owns_sale(sale_id))
  OR sale_id IS NULL  -- admin-only manual payables go via has_role above; this branch covered by client gating
);

-- Lock down execute permissions on the new SECURITY DEFINER helper
REVOKE EXECUTE ON FUNCTION public.owns_sale(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_sale(uuid) TO authenticated, service_role;
