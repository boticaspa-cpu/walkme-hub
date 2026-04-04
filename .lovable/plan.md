

# Editar, eliminar cuentas por pagar + fix de creacion automatica

## Problemas detectados

1. **No se pueden editar ni eliminar** registros de cuentas por pagar - la UI solo tiene "Pagar" y "Nuevo"
2. **No se crean payables desde checkout** porque el codigo inserta columnas que NO existen en la tabla (`reservation_id`, `service_date`, `due_date`, `payable_month`, `amount_mxn`, `amount_fx`, `currency_fx`, `payment_rule_snapshot`). Esto falla silenciosamente
3. El trigger `create_commission_and_payable_on_confirm` si existe pero usa formulas genéricas (70% del total / 17.5) en vez de costos reales

## Plan

### 1. Agregar edicion y eliminacion en CuentasPorPagar.tsx
- Agregar boton "Editar" (icono lapiz) en cada fila, tanto pendientes como pagados
- Agregar boton "Eliminar" (icono basura) con confirmacion AlertDialog
- Dialog de edicion reutiliza el formulario de "Nuevo Pago" pero pre-cargado con los datos del registro
- Campos editables: operador, monto, moneda, fecha servicio, concepto/notas, estado
- Mutacion `updatePayableMutation` con `.update().eq("id", ...)`
- Mutacion `deletePayableMutation` con `.delete().eq("id", ...)`

### 2. Corregir insert de payables en ReservationCheckout.tsx
El insert actual usa columnas inexistentes. Corregir para usar las columnas reales de la tabla:

```text
Columnas reales:          Lo que el codigo intenta:
operator_id         ✓     operator_id
sale_id                   reservation_id (NO EXISTE)
sale_date           ✓     service_date (NO EXISTE)
amount_currency           currency_fx (NO EXISTE)
amount_value              amount_fx (NO EXISTE)
equivalent_mxn            amount_mxn (NO EXISTE)
status              ✓     status
notes                     (no usa)
```

Mapeo correcto:
- `sale_id` = sale.id (la venta recién creada)
- `sale_date` = reservation.reservation_date
- `amount_currency` = operator.base_currency
- `amount_value` = net cost en moneda del operador
- `equivalent_mxn` = net cost en MXN
- `notes` = "Reserva {folio} - {tour title}"
- `status` = "pending"

### 3. Archivos a modificar
- `src/pages/CuentasPorPagar.tsx` — agregar edit/delete UI + mutations
- `src/components/reservations/ReservationCheckout.tsx` — corregir columnas del insert de payables (lineas ~318-329)

No se necesita migracion de base de datos.

