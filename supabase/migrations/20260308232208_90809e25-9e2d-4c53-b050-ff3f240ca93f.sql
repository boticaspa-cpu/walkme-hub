DROP POLICY "Admins can insert commissions" ON public.commissions;

CREATE POLICY "Auth users can insert own commissions"
ON public.commissions FOR INSERT TO authenticated
WITH CHECK (seller_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));