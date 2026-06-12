-- Fase 1: Eliminar trigger duplicador y ampliar CHECK de payment_method

-- 1. Drop trigger and function that auto-creates commissions+payables on reservation confirmation
DROP TRIGGER IF EXISTS trg_create_commission_and_payable_on_confirm ON public.reservations;
DROP TRIGGER IF EXISTS create_commission_and_payable_on_confirm ON public.reservations;
DROP FUNCTION IF EXISTS public.create_commission_and_payable_on_confirm() CASCADE;

-- 2. Ampliar CHECK de operator_payables.payment_method
ALTER TABLE public.operator_payables
  DROP CONSTRAINT IF EXISTS operator_payables_payment_method_check;

ALTER TABLE public.operator_payables
  ADD CONSTRAINT operator_payables_payment_method_check
  CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY['transfer','cash','cash_mxn','cash_usd','card','credit']));