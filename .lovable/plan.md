

# Fix CuentasPorPagar.tsx — Query and Display

## Problem
The current query references columns (`service_date`, `due_date`, `amount_mxn`, `amount_fx`, `currency_fx`, `reservation_id`) and joins (`reservations`, `operators`) that don't match the actual `operator_payables` table schema. The real columns are: `sale_date`, `amount_value`, `amount_currency`, `equivalent_mxn`, `operator_id`, `sale_id`, `notes`, `status`.

## Changes — `src/pages/CuentasPorPagar.tsx` only

### 1. Fix the Payable type
Replace with fields matching actual schema: `id`, `operator_id`, `sale_id`, `sale_date`, `amount_value`, `amount_currency`, `equivalent_mxn`, `exchange_rate_used`, `status`, `paid_at`, `payment_method`, `notes`, `created_at`, plus `operator: { id, name }`.

### 2. Fix the main query
Use the user-provided query:
```ts
supabase.from('operator_payables')
  .select('*, operator:operators(id, name)')
  .order('created_at', { ascending: false })
```
Cast as `(supabase as any)` to avoid TS2589.

### 3. Update table columns
- **Operador**: `p.operator?.name`
- **Concepto/Tour**: `p.notes ?? "Sin concepto"`
- **Folio**: `p.id.slice(0, 8)`
- **Fecha Servicio**: `fmtDate(p.sale_date)`
- **Vence**: calculate `sale_date + 15 days`
- **Monto**: `${p.amount_value} ${p.amount_currency}`
- **Estado**: pending=yellow, paid=green badges
- **Acción**: "Pagar" button if pending

### 4. Fix pay dialog
Update summary info to show `operator?.name`, notes, folio (id slice), and `amount_value + amount_currency`. Update mutation to write correct columns.

### 5. Fix totalPending calculation
Use `equivalent_mxn` instead of `amount_mxn`.

### 6. Fix filter logic
Remove `getEffectiveStatus` overdue logic (no `due_date` column). Filter simply on `status` field.

### 7. Add "+ Nuevo Pago" button and dialog
Add a button in the header area that opens a dialog to manually create a new `operator_payables` record with fields: operator (select), amount, currency, sale_date, notes. Insert via `(supabase as any).from('operator_payables').insert(...)`.

