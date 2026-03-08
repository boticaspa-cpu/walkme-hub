

# FASE 1 — Fixes Críticos

## Validación de Schema: `reservations`

La columna de ownership es **`created_by`** (uuid, nullable). No existe `seller_id` ni `user_id`. Es la correcta.

**¿Por qué USING + WITH CHECK?**
- `USING` controla qué filas puede ver/seleccionar el seller para editar (solo las suyas)
- `WITH CHECK` asegura que después del UPDATE la fila siga cumpliendo la condición — evita que un seller cambie `created_by` a otro ID y "regale" la reserva

La policy existente de admin (`USING: has_role(auth.uid(), 'admin')`) se mantiene intacta. Ambas policies son RESTRICTIVE, pero Postgres evalúa UPDATE como: debe pasar AL MENOS una policy. Seller pasa por la suya, admin por la suya.

---

## Cambios

### 1. Admin Route Guard
Crear `src/components/layout/AdminRoute.tsx` — verifica `role === "admin"`, redirige a `/dashboard` si no.
En `App.tsx`: envolver rutas `/reportes`, `/gastos`, `/configuracion` con `<AdminRoute>`.

### 2. Fix null crash en Tours L383
```ts
// Antes:
return parseFloat((data as any).value) || 17.5;
// Después:
return parseFloat(data?.value ?? "") || 17.5;
```

### 3. Seller UPDATE RLS en reservations
```sql
CREATE POLICY "Sellers can update own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

### 4. Fix fire-and-forget en ReservationCheckout L81
Await el update, log error si falla.

### 5. CashSessionGuard no-blocking
Eliminar Case B (modal obligatorio de apertura). Solo mantener Case A (cierre pendiente de día anterior) que sí es bloqueante. Sin caja abierta el usuario puede navegar libremente; POS ya tiene su propio gate.

| Archivo | Cambio |
|---|---|
| `src/components/layout/AdminRoute.tsx` | **Nuevo** — guard de rol |
| `src/App.tsx` | Envolver 3 rutas admin |
| `src/pages/Tours.tsx` | Null-safe L383 |
| `src/components/reservations/ReservationCheckout.tsx` | Await update L81 |
| `src/components/cash/CashSessionGuard.tsx` | Eliminar Case B |
| SQL Migration | RLS policy seller update |

