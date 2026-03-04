
-- quote_items: agregar campos de desglose
ALTER TABLE public.quote_items ADD COLUMN qty_adults integer NOT NULL DEFAULT 1;
ALTER TABLE public.quote_items ADD COLUMN qty_children integer NOT NULL DEFAULT 0;
ALTER TABLE public.quote_items ADD COLUMN unit_price_child_mxn numeric NOT NULL DEFAULT 0;
ALTER TABLE public.quote_items ADD COLUMN zone text NOT NULL DEFAULT '';
ALTER TABLE public.quote_items ADD COLUMN nationality text NOT NULL DEFAULT '';

-- reservations: agregar campos de desglose
ALTER TABLE public.reservations ADD COLUMN pax_adults integer NOT NULL DEFAULT 1;
ALTER TABLE public.reservations ADD COLUMN pax_children integer NOT NULL DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN zone text NOT NULL DEFAULT '';
ALTER TABLE public.reservations ADD COLUMN nationality text NOT NULL DEFAULT '';
