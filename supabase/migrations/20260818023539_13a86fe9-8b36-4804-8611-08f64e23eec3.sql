CREATE OR REPLACE FUNCTION public.generate_folio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix text;
  _seq bigint;
BEGIN
  IF TG_TABLE_NAME = 'reservations' THEN
    _prefix := 'WM';
  ELSIF TG_TABLE_NAME = 'quotes' THEN
    _prefix := 'COT';
  ELSE
    _prefix := 'FOL';
  END IF;

  SELECT GREATEST(COALESCE(MAX(
    NULLIF(regexp_replace(folio, '^[A-Z]+-', ''), '')::bigint
  ), 0) + 1, 555)
  INTO _seq
  FROM (
    SELECT folio FROM public.reservations WHERE TG_TABLE_NAME = 'reservations'
    UNION ALL
    SELECT folio FROM public.quotes WHERE TG_TABLE_NAME = 'quotes'
  ) sub;

  NEW.folio := _prefix || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_folio() FROM PUBLIC, anon, authenticated;