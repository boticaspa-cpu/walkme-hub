
# Cobro Parcial: Depósito + Balance al Operador ✅

Implementado el flujo de cobro parcial para operadores con `fee_collection_mode = "on_site"`.

## Cambios realizados

### Migración SQL
- Agregados campos `deposit_mxn`, `balance_mxn`, `balance_currency` a la tabla `reservations`

### ReservationCheckout.tsx
- Detecta operadores con `fee_collection_mode = "on_site"`
- Calcula automáticamente depósito (margen) y balance (costo neto)
- Campos editables para ajustar montos
- Solo cobra el depósito como venta
- Marca reserva como `payment_status = "partial"`
- Comisión calculada sobre el depósito (no el total)
- No genera `operator_payable` para on_site (el cliente paga directo)

### VoucherPrintView.tsx
- Muestra desglose "Depósito pagado" / "Pendiente al abordar" cuando hay balance > 0
- Soporta moneda del operador (MXN/USD) en el balance
- Bilingüe (ES/EN)
