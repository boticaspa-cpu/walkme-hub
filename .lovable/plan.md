

# FASE 1.5 — Cerrar RLS en quote_items y reservation_items

## Problema
`quote_items` y `reservation_items` tienen policies `USING (true)` para UPDATE y DELETE. Cualquier seller autenticado puede modificar o borrar items de cotizaciones/reservas ajenas via API directo.

## Estrategia
No puedo hacer `created_by = auth.uid()` porque estas tablas no tienen `created_by`. La ownership se hereda del parent (`quotes.created_by` via `quote_id`, `reservations.created_by` via `reservation_id`).

Creo **2 funciones SECURITY DEFINER** que verifican ownership del parent, y luego reemplazo las policies permisivas.

## SQL exacto

```sql
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
```

## Explicación por policy

| Policy | Tabla | Qué hace |
|---|---|---|
| `owns_quote()` | función | Verifica que `quotes.created_by = auth.uid()` sin exponer la tabla quotes a recursión RLS |
| `owns_reservation()` | función | Verifica que `reservations.created_by = auth.uid()` |
| Owner or admin can update quote_items | quote_items | Solo el dueño del quote o admin puede editar items |
| Owner or admin can delete quote_items | quote_items | Solo el dueño del quote o admin puede borrar items |
| Auth read reservation_items | reservation_items | Todos los autenticados pueden leer (reemplaza el ALL) |
| Auth insert reservation_items | reservation_items | Todos pueden insertar (al crear reserva) |
| Owner or admin can update reservation_items | reservation_items | Solo dueño de la reserva o admin |
| Owner or admin can delete reservation_items | reservation_items | Solo dueño de la reserva o admin |

## Validación
- Seller A crea quote → puede editar/borrar sus quote_items ✓
- Seller B intenta UPDATE/DELETE en items de Seller A → `owns_quote()` retorna false, `has_role('admin')` retorna false → DENIED ✓
- Admin → `has_role('admin')` retorna true → permitido siempre ✓
- INSERT/SELECT no se tocan → operación normal no se rompe ✓

## Archivos
Solo SQL migration. Cero cambios de frontend.

| Cambio | Detalle |
|---|---|
| SQL Migration | 2 funciones + drop 3 policies permisivas + crear 6 policies nuevas |

