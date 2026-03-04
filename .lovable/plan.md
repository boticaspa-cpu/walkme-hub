

# Plan: Unificar Cobro desde Reservas + Transformar POS

## Resumen
Mover el cobro al flujo de Reservas ("Confirmar y Cobrar"), vincular cada venta a una reserva, y convertir POS en un buscador de reservas pendientes. Crear tabla `operator_payables` para cuentas por pagar a proveedores.

---

## 1. Migración DB

### A) Agregar columnas a `reservations`
```sql
ALTER TABLE public.reservations
  ADD COLUMN confirmation_status text NOT NULL DEFAULT 'scheduled',
  ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN confirmed_at timestamptz,
  ADD COLUMN sale_id uuid REFERENCES public.sales(id);
```

### B) Agregar `receipt_number` a `sales`
```sql
ALTER TABLE public.sales ADD COLUMN receipt_number text;
```

### C) Crear `operator_payables`
```sql
CREATE TABLE public.operator_payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id),
  operator_id uuid NOT NULL REFERENCES public.operators(id),
  service_date date NOT NULL,
  payment_rule_snapshot text NOT NULL DEFAULT 'prepago',
  due_date date NOT NULL,
  payable_month text,
  amount_mxn numeric NOT NULL DEFAULT 0,
  amount_fx numeric,
  currency_fx text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_payables ENABLE ROW LEVEL SECURITY;
-- Admin full, sellers read
CREATE POLICY "Admin full payables" ON public.operator_payables FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Auth read payables" ON public.operator_payables FOR SELECT TO authenticated USING (true);
```

---

## 2. Nuevo componente: `ReservationCheckout`

**File**: `src/components/reservations/ReservationCheckout.tsx`

Dialog/Drawer reutilizable (usado por Reservas y POS):
- **Ticket summary**: Tour, Pax (adultos/niños), Total MXN, Zona, Nacionalidad
- **Payment method**: cash / card / transfer (radio buttons)
- **Si cash + divisa**: currency selector + exchange rate + amount in FX
- **Validación**: Si método incluye efectivo → requiere `cash_session` abierta (via `useCashSession`)
- **On confirm**:
  1. Upsert `sale` con `reservation_id`, `cash_session_id`, `payment_method`, totales, `sold_by`
  2. Crear `cash_movement(s)` en la sesión activa
  3. Actualizar `reservation`: `confirmation_status='confirmed'`, `payment_status='paid'`, `confirmed_at=now()`, `sale_id`
  4. Crear `operator_payable`: usa `reservation.tour_id → tour.operator_id`, `service_date = reservation.reservation_date`, `due_date` según `operator.payment_rule`
  5. Invalidar queries

Props: `reservation`, `onSuccess`, `open`, `onOpenChange`

---

## 3. Actualizar `Reservas.tsx`

- Expandir query: incluir `tours(title, includes, meeting_point, short_description, operator_id)` y `operators` via tour
- Agregar columnas a la tabla: **Pago** (badge unpaid/paid/deposit)
- Agregar botón **"Confirmar y Cobrar"** por fila (solo si `confirmation_status='scheduled'`)
- Si ya confirmada: mostrar "Ver Ticket" en vez de cobrar
- Bloquear voucher/WhatsApp si operador es prepago y `operator_payable.status='pending'` (warning toast)
- Estado `checkoutReservation` para abrir `ReservationCheckout`

---

## 4. Transformar `POS.tsx`

- **Eliminar catálogo de tours** (grid de botones "Agregar Tours")
- **Reemplazar por**: Buscador de reservas pendientes (`confirmation_status='scheduled'` OR `payment_status != 'paid'`)
- Mostrar tabla: Folio, Tour, Cliente, Fecha, Total, Acciones → "Cobrar"
- Al click "Cobrar" → abrir `ReservationCheckout` con esa reserva
- Mantener el gate de caja abierta existente
- Admin toggle "Venta rápida" (opcional, se puede implementar después)

---

## 5. Archivos modificados

| Archivo | Acción |
|---|---|
| Migración SQL | Nuevas columnas + tabla `operator_payables` |
| `src/components/reservations/ReservationCheckout.tsx` | **Nuevo** — checkout reutilizable |
| `src/pages/Reservas.tsx` | Agregar botón cobrar + columna pago + bloqueo voucher prepago |
| `src/pages/POS.tsx` | Reescribir: buscador de reservas pendientes en vez de catálogo tours |

---

## Notas técnicas
- Se mantiene compatibilidad con `sales`, `cash_sessions`, `cash_movements` existentes
- `operator_payables` usa `reservation.reservation_date` como `service_date`; `due_date` se calcula: prepago = `service_date - 1 day`, mensual = último día del mes
- No se borran tablas ni columnas existentes
- El componente `ReservationCheckout` se comparte entre Reservas y POS para evitar duplicación

