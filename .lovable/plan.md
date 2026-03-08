

# Plan: Corregir cálculo de comisión — excluir impuestos y considerar descuentos

## Problema actual
La fórmula actual es:
```
ganancia = totalMxn - totalNetCost
comisión = ganancia × rate
```
Esto tiene 2 errores:
1. **No excluye impuestos (tax_fee)** — los impuestos no son ganancia, son pass-through.
2. **No descuenta el discount_mxn** — si se aplica descuento, la ganancia real baja para ambos (agencia y comisionista).

## Fórmula correcta
```
totalVenta = totalMxn (ya incluye descuento aplicado)
totalCosto = (net_cost_adulto × pax_adults) + (net_cost_niño × pax_children)
totalImpuestos = (tax_fee_adulto × pax_adults) + (tax_fee_niño × pax_children)
ganancia = totalVenta - totalCosto - totalImpuestos
comisión = ganancia × rate
```
El `totalMxn` ya refleja el descuento (subtotal - discount_mxn), así que la ganancia se reduce automáticamente cuando hay descuento.

## Cambio

**Archivo**: `src/components/reservations/ReservationCheckout.tsx`, sección de comisión (líneas ~196-236)

1. Cambiar los queries de variantes para traer `net_cost, tax_fee` en vez de solo `net_cost`.
2. Calcular `totalTaxFee = (tax_adult × pax_adults) + (tax_child × pax_children)`.
3. Nueva fórmula: `profit = Math.max(0, totalMxn - totalNetCost - totalTaxFee)`.
4. El resto queda igual (`commissionAmount = profit * rate`).

Solo se modifica ~10 líneas en un archivo.

