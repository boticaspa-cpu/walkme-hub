

# Plan: Matriz de Precios v2 — "Sin Paquete (General)"

## Problema
The `PriceVariantEditor` package dropdown only shows existing packages. If a tour has no packages, you can't create price variants. The `package_name` field uses text (not a FK), so `NULL`/empty string already works at the DB level.

## Changes

### 1. `src/components/tours/PriceVariantEditor.tsx` — UI changes

**Dropdown**: Add a fixed first option "Sin paquete (General)" with a sentinel value (e.g. `"__GENERAL__"`). When saving, convert this back to empty string `""`.

**Generate Combinations**: If no packages exist, generate combos with `package_name = "__GENERAL__"` (16 rows: 4 zones x 2 nationalities x 2 pax types). Currently blocked by `if (packages.length === 0) return`.

**Empty variant default**: Set `package_name: "__GENERAL__"` in `emptyVariant`.

### 2. `src/pages/Tours.tsx` — Save logic

In `saveVariants`, convert `package_name === "__GENERAL__"` to `""` before insert. Also when loading variants, convert `""` back to `"__GENERAL__"` for the UI.

### 3. `src/lib/tour-pricing.ts` — Pricing fallback with package_name

Add `package_name` to `VariantRow` interface. Update `computeTourPrice` to accept optional `packageName` parameter:

1. First try exact match: `tour_id + zone + nationality + pax_type + package_name`
2. If no match and `packageName` is set, try with `package_name === ""` (General)
3. Fallback to tour base prices (existing logic)

### 4. Callers of `computeTourPrice`

Update calls in `Reservas.tsx` and `ReservationCheckout.tsx` to pass the package name if available (from reservation data or selected package). Since most reservations don't track package, this defaults to undefined which triggers the General fallback — fixing the $0 bug.

## Files

| File | Change |
|---|---|
| `src/components/tours/PriceVariantEditor.tsx` | Add "Sin paquete (General)" option, allow generate without packages |
| `src/pages/Tours.tsx` | Convert sentinel value on save/load |
| `src/lib/tour-pricing.ts` | Add package_name to lookup + General fallback |
| `src/pages/Reservas.tsx` | Pass package info to computeTourPrice |
| `src/components/reservations/ReservationCheckout.tsx` | Pass package info to computeTourPrice |

No DB migration needed — `package_name` is already nullable text.

