

# Plan: Fix Mapeo de Lista de Precios + Pricing sin Paquete

## Problema Actual

1. **Edge Function `parse-operator-pricelist`**: Extrae `tour_name` y `price_variants` (zone/nationality/pax_type/sale_price/net_cost/tax_fee), pero el **cliente** (`PriceListImportDialog`) solo usa `tour_name` para crear el tour — no llena campos generales como `public_price_adult_usd`, `public_price_child_usd`, `tax_adult_usd`, `tax_child_usd`, `child_age_min/max`, `exchange_rate_tour`, etc.

2. **Checkout $0**: `computeTourPrice` hace fallback a `tour.price_mxn` / `tour.suggested_price_mxn`, pero estos campos están en 0 si nadie los llenó manualmente. Los campos USD (`public_price_adult_usd`) sí pueden estar llenos pero no se usan en el fallback.

## Cambios

### 1. Edge Function — Extraer campos generales del tour

Actualizar el schema de la tool call para que la IA también extraiga por tour:
- `public_price_adult_usd` — precio público adulto (el más representativo de la tabla)
- `public_price_child_usd`
- `tax_adult_usd` (fee muelle/parque adulto)
- `tax_child_usd` (fee muelle/parque niño)
- `child_age_range` (texto como "4-11" para parsear)
- `exchange_rate` (si el documento lo menciona)

Estos se derivan de los datos que YA extrae (variants), tomando el primer adulto/niño Extranjero como "precio público representativo" y las tax_fee.

**Archivo**: `supabase/functions/parse-operator-pricelist/index.ts`

### 2. PriceListImportDialog — Llenar campos generales al importar

En `handleImport`, al hacer insert/update del tour, incluir los campos generales extraídos:
- `public_price_adult_usd`, `public_price_child_usd` 
- `tax_adult_usd`, `tax_child_usd`
- `child_age_min`, `child_age_max` (parseados de `child_age_range`)
- `exchange_rate_tour` (del operador si no viene en documento)
- `price_mxn` = `public_price_adult_usd × exchange_rate` (para fallback MXN)
- `suggested_price_mxn` = `public_price_child_usd × exchange_rate`
- `calculation_mode` y `commission_percentage` si el operador usa comisión
- `price_adult_usd` / `price_child_usd` = net_cost si viene

Además, al crear/actualizar tour, incluir estos campos en el upsert payload.

**Archivo**: `src/components/operators/PriceListImportDialog.tsx`

### 3. Fix `computeTourPrice` — Usar precios USD con TC

Actualizar la interfaz `TourBase` y la función para incluir los precios USD y TC:
- Si `price_mxn` > 0 → usar como está (ya funciona)
- Si `price_mxn` = 0 pero `public_price_adult_usd > 0` → calcular `public_price_adult_usd × exchange_rate_tour`
- Mismo para child

**Archivo**: `src/lib/tour-pricing.ts`

### 4. Actualizar queries que alimentan `computeTourPrice`

En `Reservas.tsx` y `ReservationCheckout.tsx`, expandir la query de tours para incluir `public_price_adult_usd, public_price_child_usd, exchange_rate_tour, tax_adult_usd, tax_child_usd`.

**Archivos**: `src/pages/Reservas.tsx`, `src/components/reservations/ReservationCheckout.tsx`

## Archivos

| Archivo | Acción |
|---|---|
| `supabase/functions/parse-operator-pricelist/index.ts` | Agregar campos generales al schema de extracción |
| `src/components/operators/PriceListImportDialog.tsx` | Llenar campos generales del tour al importar |
| `src/lib/tour-pricing.ts` | Fallback USD→MXN con TC |
| `src/pages/Reservas.tsx` | Expandir query de tours |
| `src/components/reservations/ReservationCheckout.tsx` | Expandir query de tours |

No hay cambios de DB — todos los campos ya existen en la tabla `tours`.

