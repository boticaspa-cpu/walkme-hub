

# Add "Nueva Comisión" button and dialog to Comisiones.tsx

## Changes — `src/pages/Comisiones.tsx` only

### 1. New state and imports
- Add `Plus` to lucide imports
- Add `Textarea` import
- Add `createOpen` boolean state
- Add form state: `newSeller`, `newReservation`, `newGrossProfit`, `newRate` (default 50), `newNotes`

### 2. Create commission dialog (`CreateCommissionDialog`)
Inline component with:
- **Vendedor**: Select from existing `sellers` list
- **Reserva**: Optional select, query `reservations` (id, folio, client name) — or reuse a simple list
- **Ganancia Bruta**: number input
- **Comisión Vendedor %**: number input (default 50), auto-calculates MXN amount
- **Comisión Vendedor MXN**: read-only calculated field
- **Comisión Agencia MXN**: read-only calculated field
- **Notas**: optional textarea

Insert mutation:
```ts
await (supabase as any).from('commissions').insert({
  seller_id, reservation_id: reservation || null,
  gross_profit, net_profit: gross_profit,
  commission_rate: rate,
  commission_amount: gross_profit * (rate / 100),
  agency_commission: gross_profit * (1 - rate / 100),
  status: 'pending'
});
```

### 3. Button placement
Add button next to filters (line ~228), visible only for admin:
```tsx
{isAdmin && (
  <Button onClick={() => setCreateOpen(true)}>
    <Plus className="h-4 w-4 mr-2" /> Nueva Comisión
  </Button>
)}
```

### 4. Reservations query
Add a small query for reservations list (id, folio, client name) to populate the optional select, enabled only when dialog is open.

