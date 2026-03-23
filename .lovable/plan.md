
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

---

# Moneda del Proveedor: Soporte USD / MXN en Ficha del Tour ✅

## Cambios realizados

### Migración SQL
- Agregado campo `supplier_currency` (text, default 'USD') a la tabla `tours`

### Tours.tsx
- Selector USD/MXN junto a "Precios Operador" en la ficha del tour
- Labels dinámicos según moneda seleccionada
- Cuando es MXN: T.C. se oculta, precios MXN se toman directamente
- Cuando es USD: funciona igual que antes (conversión × T.C.)
- Se guarda `supplier_currency` en el upsert
