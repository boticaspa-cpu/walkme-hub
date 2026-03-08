

# Add `card_fee_mxn` column to commissions table

## Change
Add a `card_fee_mxn numeric NOT NULL DEFAULT 0` column to `commissions` to record the card fee deducted from profit for each commission.

## SQL Migration
```sql
ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS card_fee_mxn numeric NOT NULL DEFAULT 0;
```

## Code Change
In `src/components/reservations/ReservationCheckout.tsx` line 260-265, add `card_fee_mxn: cardFeeAmount` to the commission insert:
```typescript
await (supabase as any).from("commissions").insert({
  seller_id: user.id,
  sale_id: sale.id,
  rate,
  amount_mxn: commissionAmount,
  card_fee_mxn: cardFeeAmount,
});
```

## Comisiones page
In `src/pages/Comisiones.tsx`, add a column showing the card fee when > 0.

## Files
| File | Change |
|---|---|
| SQL Migration | Add `card_fee_mxn` column |
| `src/components/reservations/ReservationCheckout.tsx` | Persist `cardFeeAmount` in commission insert |
| `src/pages/Comisiones.tsx` | Show card fee column |

Zero impact on existing data (default 0). No RLS changes needed.

