
-- clients INSERT: enforce created_by = auth.uid()
DROP POLICY IF EXISTS "Auth users can insert clients" ON public.clients;
CREATE POLICY "Auth users can insert clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

-- quote_items INSERT: must own parent quote
DROP POLICY IF EXISTS "Auth users can insert quote_items" ON public.quote_items;
CREATE POLICY "Auth users can insert quote_items" ON public.quote_items
  FOR INSERT TO authenticated
  WITH CHECK (public.owns_quote(quote_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Revoke EXECUTE on SECURITY DEFINER functions from anon and authenticated
-- Trigger-only functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_folio() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_transfer_folio() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_commission_and_payable_on_confirm() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Helper functions used by RLS policies: keep callable by authenticated (RLS evaluates as the calling role), revoke from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_quote(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_reservation(uuid) FROM PUBLIC, anon;
