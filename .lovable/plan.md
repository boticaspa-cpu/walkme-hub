
# Plan: Corrección del flujo de dinero

## Reglas de negocio confirmadas

```
reporte   = costo_operador          (lo que se le paga al operador)
ganancia  = precio_venta − reporte − card_fee (si aplica)
comisión_vendedor = ganancia × 50%   (solo sellers; admins NO generan)
walkme            = ganancia × 50%
operator_payable  = reporte          (siempre, pague antes o después del tour)
```

Admins (Maria, Gina) nunca generan comisión: el 100% de la ganancia queda para Walkme.

---

## Errores actuales que esto resuelve

1. **Error rojo "operator_payables_payment_method_check"** al pagar a operador — la UI manda `cash_usd / cash_mxn / transfer` y el CHECK de la BD solo acepta `transfer / cash / credit`.
2. **Comisiones y cuentas por pagar duplicadas** — el trigger `create_commission_and_payable_on_confirm` crea registros al confirmar la reserva, y el checkout vuelve a crearlos al cobrar.
3. **Cálculo de comisión inconsistente** — el trigger usa 30% del total, el checkout usa `commission_rate` con 10% por defecto, y el KPI del POS lee `commission_percentage` con 30%. Tres fórmulas distintas para lo mismo.
4. **Admins generando comisión** — hoy cualquier usuario que cobre genera comisión, incluyendo admins.
5. **Caja descuadrada** — pagar a operador / comisión / gasto en efectivo no descuenta de `cash_movements`.

---

## Fases

### Fase 1 — Migración (parar duplicación y desbloquear)
- DROP trigger `create_commission_and_payable_on_confirm`. El checkout queda como única fuente.
- Ampliar CHECK de `operator_payables.payment_method` a `('transfer','cash_mxn','cash_usd','card','credit')`.
- No se borran datos; los duplicados viejos se reportan en Fase 4.

### Fase 2 — Lógica correcta en checkout (`ReservationCheckout.tsx`)
- Calcular `reporte` desde `tour_price_variants` (adulto + menor × pax).
- `ganancia = total_venta − reporte − card_fee`.
- Si `role === "admin"` → **no crear** registro en `commissions`.
- Si `role === "seller"` → `commission_amount = ganancia × 0.50`, `agency_commission = ganancia × 0.50`.
- Idempotencia: si ya hay `commissions.sale_id = X` u `operator_payables.sale_id = X`, no duplicar.
- KPI "Mi Comisión" del POS: misma fórmula (no `total × commission_percentage`).

### Fase 3 — Caja cuadrada
Al marcar pagado en efectivo con caja abierta, insertar `cash_movement type='out_cash'`:
- Pago a operador (CuentasPorPagar) en `cash_mxn` / `cash_usd`
- Pago de comisión a vendedor (Comisiones) en efectivo
- Pago de gasto (Gastos) en efectivo

Agregar KPI "Salidas en efectivo" en POS y Cierre Diario.

### Fase 4 — Auditoría de duplicados históricos (después de validar)
Reporte de admin que muestre:
- `sales` con más de una `commission` o más de un `operator_payable`
- `commissions` asignadas a usuarios admin (no deberían existir)

Admin decide caso por caso si cancela los duplicados.

### Fase 5 — Mejoras opcionales
- Card fee 4% se registra automáticamente como `expense_item` (categoría "Comisión bancaria") para visibilidad.
- Capturar TC real del día al pagar un payable en moneda distinta a la original.

---

## Archivos afectados

- `supabase/migrations/<nuevo>.sql` — drop trigger + fix CHECK
- `src/components/reservations/ReservationCheckout.tsx` — fórmula ganancia × 50%, exclusión de admins, idempotencia
- `src/pages/POS.tsx` — KPI "Mi Comisión" con la fórmula correcta
- `src/pages/CuentasPorPagar.tsx` — `cash_movement` al pagar en efectivo
- `src/pages/Comisiones.tsx` — `cash_movement` al pagar en efectivo, ocultar a admins
- `src/pages/Gastos.tsx` — `cash_movement` al pagar en efectivo
- `src/pages/Reportes.tsx` y `src/pages/CierreDiario.tsx` — revalidar KPIs tras limpieza
- `mem://features/commissions-management` — actualizar regla 50/50 y exclusión admin
- Core memory — actualizar terminología: "Reporte = costo operador"

---

## Pregunta única antes de implementar

¿Arrancamos **Fases 1 + 2 + 3 juntas** (migración + checkout + caja cuadrada)?  
Las Fases 4 y 5 quedan para una segunda iteración después de validar el flujo nuevo.
