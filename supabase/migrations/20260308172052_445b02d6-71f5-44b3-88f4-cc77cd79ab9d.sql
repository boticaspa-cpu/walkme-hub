ALTER TABLE public.reservations ADD COLUMN operator_folio text DEFAULT NULL;
ALTER TABLE public.reservations ADD COLUMN cancellation_folio text DEFAULT NULL;