ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS pax_infants integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS child_ages integer[] NOT NULL DEFAULT '{}'::integer[],
  ADD COLUMN IF NOT EXISTS infant_ages integer[] NOT NULL DEFAULT '{}'::integer[],
  ADD COLUMN IF NOT EXISTS unit_price_infant_mxn numeric NOT NULL DEFAULT 0;

ALTER TABLE public.reservation_items
  ADD COLUMN IF NOT EXISTS qty_infants integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS child_ages integer[] NOT NULL DEFAULT '{}'::integer[],
  ADD COLUMN IF NOT EXISTS infant_ages integer[] NOT NULL DEFAULT '{}'::integer[],
  ADD COLUMN IF NOT EXISTS unit_price_infant_mxn numeric NOT NULL DEFAULT 0;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_pax_infants_nonnegative CHECK (pax_infants >= 0),
  ADD CONSTRAINT reservations_infant_price_nonnegative CHECK (unit_price_infant_mxn >= 0);

ALTER TABLE public.reservation_items
  ADD CONSTRAINT reservation_items_qty_infants_nonnegative CHECK (qty_infants >= 0),
  ADD CONSTRAINT reservation_items_infant_price_nonnegative CHECK (unit_price_infant_mxn >= 0);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservation_items TO authenticated;
GRANT ALL ON public.reservation_items TO service_role;