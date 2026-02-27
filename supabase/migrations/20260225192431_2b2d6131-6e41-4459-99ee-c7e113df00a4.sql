ALTER TABLE public.tours
  ADD COLUMN public_price_adult_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN public_price_child_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN tax_adult_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN tax_child_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN calculation_mode text NOT NULL DEFAULT 'net_cost',
  ADD COLUMN commission_percentage numeric NOT NULL DEFAULT 0;