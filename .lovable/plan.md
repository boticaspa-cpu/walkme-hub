

# Clean up `tour-pricing.ts` — remove unreachable code

## Change

Single file: `src/lib/tour-pricing.ts`

Replace the `if (tour)` block (lines 87–128) to remove the unreachable duplicate return. All paths return `{ adultPrice, childPrice, taxAdultUsd, taxChildUsd, source }`.

**Before:** 3 returns inside `if (tour)` — the third is unreachable after the USD check.

**After:** 3 returns inside `if (tour)` but the third is explicit zeros-with-taxes (tour exists, no prices configured), making intent clear. Final fallback outside returns full zeros.

No other files change. Business rules unchanged: MXN prices stay in MXN, park taxes stay separate in USD.

