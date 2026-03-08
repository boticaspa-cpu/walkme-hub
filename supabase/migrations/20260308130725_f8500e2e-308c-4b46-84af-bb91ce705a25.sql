ALTER TABLE public.quotes ADD COLUMN discount_mxn numeric NOT NULL DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN discount_mxn numeric NOT NULL DEFAULT 0;