CREATE POLICY "Sellers can update own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());