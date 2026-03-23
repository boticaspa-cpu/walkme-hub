ALTER TABLE public.reservations 
  ADD COLUMN deposit_mxn numeric NOT NULL DEFAULT 0,
  ADD COLUMN balance_mxn numeric NOT NULL DEFAULT 0,
  ADD COLUMN balance_currency text NOT NULL DEFAULT 'MXN';