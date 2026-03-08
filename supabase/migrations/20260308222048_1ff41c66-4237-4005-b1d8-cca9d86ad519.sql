-- 1. UNIQUE constraint on daily_closings to prevent duplicate closures
ALTER TABLE public.daily_closings
  ADD CONSTRAINT daily_closings_date_user_unique
  UNIQUE (closing_date, closed_by);

-- 2. New reservation fields
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS hotel_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pax_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS operator_confirmation_code text NOT NULL DEFAULT '';