
-- 1. Función: ¿el usuario es dueño del quote?
CREATE OR REPLACE FUNCTION public.owns_quote(_quote_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quotes
    WHERE id = _quote_id AND created_by = auth.uid()
  )
$$;

-- 2. Función: ¿el usuario es dueño de la reserva?
CREATE OR REPLACE FUNCTION public.owns_reservation(_reservation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reservations
    WHERE id = _reservation_id AND created_by = auth.uid()
  )
$$;

-- 3. quote_items: reemplazar UPDATE y DELETE permisivos
DROP POLICY "Auth users can update quote_items" ON public.quote_items;
DROP POLICY "Auth users can delete quote_items" ON public.quote_items;

CREATE POLICY "Owner or admin can update quote_items"
  ON public.quote_items FOR UPDATE TO authenticated
  USING (owns_quote(quote_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete quote_items"
  ON public.quote_items FOR DELETE TO authenticated
  USING (owns_quote(quote_id) OR has_role(auth.uid(), 'admin'));

-- 4. reservation_items: reemplazar ALL permisivo
DROP POLICY "Allow all for authenticated users" ON public.reservation_items;

CREATE POLICY "Auth read reservation_items"
  ON public.reservation_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Auth insert reservation_items"
  ON public.reservation_items FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Owner or admin can update reservation_items"
  ON public.reservation_items FOR UPDATE TO authenticated
  USING (owns_reservation(reservation_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete reservation_items"
  ON public.reservation_items FOR DELETE TO authenticated
  USING (owns_reservation(reservation_id) OR has_role(auth.uid(), 'admin'));
