

# Plan: Database Foundation Migrations for Walkme ERP v2

## Overview
Apply 5 sequential migrations to restructure the database schema for the new pricing matrix system.

## Migration 1: Add columns to `operators`
```sql
ALTER TABLE public.operators
  ADD COLUMN exchange_rate numeric NOT NULL DEFAULT 1,
  ADD COLUMN base_currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN payment_rules text NOT NULL DEFAULT 'prepago';
```

## Migration 2: Add `image_urls` array to `tours`, migrate existing data, drop old column
```sql
ALTER TABLE public.tours ADD COLUMN image_urls text[] NOT NULL DEFAULT '{}';
UPDATE public.tours SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_url != '';
ALTER TABLE public.tours DROP COLUMN image_url;
```

## Migration 3: Drop and recreate `tour_price_variants` with new schema
- Drop existing table (it has no production data worth preserving in v2 rebuild)
- Recreate with: `tour_id`, `operator_id` (FK to operators), `zone`, `pax_type`, `nationality`, `sale_price`, `net_cost`, `tax_fee`, `active`, `created_at`
- Unique index on `(tour_id, operator_id, zone, pax_type, nationality)`
- RLS: SELECT for all authenticated, INSERT/UPDATE/DELETE for admins only

## Migration 4: Create `tour_price_variants_seller` VIEW
- Excludes `net_cost` column — sellers query this view, admins query the base table
- Uses `security_invoker = on`

## Migration 5: Update `sale_items` FK constraint
- Drop old FK if exists, add new FK pointing to rebuilt `tour_price_variants`

## Files to modify after migrations
- `src/pages/Tours.tsx` — update to use `image_urls` array
- `src/pages/Operadores.tsx` — add exchange_rate, base_currency, payment_rules fields
- `src/components/tours/PriceVariantEditor.tsx` — rebuild for new schema columns
- Update `.lovable/plan.md` with completed status

## Technical Notes
- All 5 migrations will be combined into a single migration file for atomicity
- The `sale_items.tour_price_variant_id` column already exists, only the FK constraint needs updating
- Existing `tour_packages` table is left untouched (can be deprecated later)

