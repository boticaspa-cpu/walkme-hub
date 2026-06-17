DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='quote_items' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.quote_items', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Sellers view own quote items, admins view all"
ON public.quote_items
FOR SELECT
TO authenticated
USING (public.owns_quote(quote_id) OR public.has_role(auth.uid(), 'admin'::app_role));