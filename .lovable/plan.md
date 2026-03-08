

# 3 Fixes Quirúrgicos — Comisiones RLS + Menor + Multi-tour

## Fix 1 — CRÍTICO: RLS para sellers en commissions

**SQL Migration:**
```sql
CREATE POLICY "Sellers can insert own commissions"
ON public.commissions FOR INSERT TO authenticated
WITH CHECK (seller_id = auth.uid());
```

La policy admin existente (`Admins can insert commissions`) queda intacta. Ambas son RESTRICTIVE pero al ser para INSERT, basta con que una de las dos pase.

**NOTA**: Las policies actuales son todas `Permissive: No` (RESTRICTIVE). Con RESTRICTIVE, **todas** deben pasar. Esto significa que la nueva policy tampoco funcionará sola — necesitamos cambiarla a PERMISSIVE, o cambiar la admin existente también. 

Revisando: las policies existentes son restrictive. Para que funcione correctamente, la nueva policy debe ser **PERMISSIVE** (grant-based), no restrictive:

```sql
CREATE POLICY "Sellers can insert own commissions"
ON public.commissions FOR INSERT TO authenticated
USING (true)
WITH CHECK (seller_id = auth.uid());
```

Espera — revisando el patrón del proyecto: todas las policies usan `Permissive: No`. Esto funciona porque para cada operación solo hay UNA policy restrictive que aplica (admin check). Al agregar una segunda restrictive para INSERT, AMBAS deben pasar, lo cual rompe el admin.

**Solución correcta**: Eliminar la policy admin INSERT existente y reemplazar con una que cubra ambos casos:

```sql
DROP POLICY "Admins can insert commissions" ON public.commissions;

CREATE POLICY "Auth users can insert own commissions"
ON public.commissions FOR INSERT TO authenticated
WITH CHECK (seller_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
```

Esto permite: admin inserta cualquier comisión, seller inserta solo las suyas.

## Fix 2 — Mismatch "Niño" → "Menor"

**Archivo**: `src/components/reservations/ReservationCheckout.tsx` línea 246

```typescript
// ANTES:
.eq("pax_type", "Niño")

// DESPUÉS:
.eq("pax_type", "Menor")
```

## Fix 3 — Multi-tour create: campos faltantes

**Archivo**: `src/pages/Reservas.tsx`

Línea 120-122 — agregar campos a `emptyShared`:
```typescript
hotel_name: "",
pax_email: "",
pickup_notes: "",
operator_confirmation_code: "",
```

Líneas 425-427 — agregar al payload de insert:
```typescript
hotel_name: shared.hotel_name,
pax_email: shared.pax_email,
pickup_notes: shared.pickup_notes || "",
operator_confirmation_code: shared.operator_confirmation_code || "",
```

## Archivos modificados

| Archivo | Cambio |
|---|---|
| SQL Migration | Drop + recreate policy INSERT en commissions |
| `src/components/reservations/ReservationCheckout.tsx` | `"Niño"` → `"Menor"` en línea 246 |
| `src/pages/Reservas.tsx` | Agregar `pickup_notes` y `operator_confirmation_code` a emptyShared + insert payload |

## Validación

| Check | Estado |
|---|---|
| Seller cobra → comisión se inserta | OK (nueva policy permite `seller_id = auth.uid()`) |
| Admin cobra → comisión se inserta | OK (policy incluye `has_role(admin)`) |
| Child cost calcula con "Menor" | OK (match correcto con tour_price_variants) |
| Multi-tour guarda pickup_notes | OK (incluido en insert payload) |
| Multi-tour guarda operator_confirmation_code | OK (incluido en insert payload) |
| Policies existentes de SELECT/UPDATE/DELETE | Sin cambio |

