

# Fix: Checkout picks wrong price variant (missing package_name)

## Problem
When a reservation is created, the price is calculated correctly using the selected package (e.g., "Con Transporte"). But the `package_name` is never saved to the `reservations` table. When checkout opens, the variant queries in `ReservationCheckout.tsx` don't filter by `package_name`, so Supabase returns the first matching variant (often the cheaper "Solo Entrada" one), causing wrong amounts for commissions, net cost, and split payment calculations.

## Root cause
1. The `reservations` table has no `package_name` column
2. The reservation insert in `Reservas.tsx` doesn't save the package name
3. `ReservationCheckout.tsx` queries `tour_price_variants` without a `package_name` filter, so it picks whichever row comes first

## Solution

### 1. Add `package_name` column to `reservations` table
Migration: `ALTER TABLE public.reservations ADD COLUMN package_name text NOT NULL DEFAULT '';`

### 2. Save `package_name` when creating reservations (`src/pages/Reservas.tsx`)
Add `package_name: item.package_name || ""` to the insert object (around line 508).
Also add it to the update payload when editing.

### 3. Filter by `package_name` in checkout (`src/components/reservations/ReservationCheckout.tsx`)
In all 3 places where `tour_price_variants` is queried without `package_name`:
- **Net cost query** (lines 88-107): add `.eq("package_name", reservation.package_name || "")`
- **Commission variant queries** (lines 320-339): same filter
- **Recalc variant fetch** (lines 129-137): include `package_name` in the select so `computeTourPrice` can match correctly; also pass `reservation.package_name` to `computeTourPrice` on line 148

### 4. Include `package_name` in reservation select query
In the reservations fetch query (line 172), the column will be included automatically since it uses `*`.

## Result
The checkout will always use the same package variant that was selected when the reservation was created, so prices will match between reservation creation and payment.

