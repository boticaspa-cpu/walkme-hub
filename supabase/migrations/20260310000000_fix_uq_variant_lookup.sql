-- Fix uq_variant_lookup: add package_name so variants that differ only by
-- package are treated as distinct rows (prevents duplicate key on insert).
DROP INDEX IF EXISTS public.uq_variant_lookup;

CREATE UNIQUE INDEX uq_variant_lookup
  ON public.tour_price_variants(tour_id, operator_id, zone, pax_type, nationality, package_name);
