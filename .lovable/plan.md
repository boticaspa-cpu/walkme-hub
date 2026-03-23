

# Add KPI Cards to POS Page

## Summary
Add 4 KPI cards above the pending reservations table in POS, using the same `KpiCard` component from the Dashboard.

## Data Queries (3 new queries)

### 1. Today's Sales (for current session)
Query `sales` table filtered by `cash_session_id = activeSession.id`. Derive count and total MXN.

### 2. Commission estimate
Use the same sales data, multiply total by the seller's `commission_percentage` from `profiles` (fetched via `useAuth` user id). Fall back to 30% default.

### 3. Cash in register
Query `sales` where `cash_session_id = activeSession.id` AND `payment_method = 'cash'`, group by `currency`. Add the session's `opening_float_mxn`. Also sum cash movements for the session.

### Pending reservations
Already available from `pendingReservations` — just derive count and sum.

## UI Changes — `src/pages/POS.tsx`

1. Import `KpiCard`, `Skeleton`, `useAuth`, and icons (`Receipt`, `Clock`, `Coins`, `Wallet`).

2. Add 3 queries (session sales, profile commission rate, cash breakdown) — all enabled only when `activeSession` exists.

3. Insert a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) between the header and the table card with:
   - **Ventas del Día**: count + total MXN from session sales
   - **Reservas Pendientes**: `pendingReservations.length` + sum of `total_mxn`
   - **Mi Comisión**: session sales total × commission % from profile
   - **Efectivo en Caja**: opening float + cash sales MXN (show USD subtotal if any)

4. Show skeleton cards while loading (same pattern as Dashboard).

## Files Modified
- `src/pages/POS.tsx`

