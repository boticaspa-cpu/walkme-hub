
-- 1. Change default approval_status to 'pending'
ALTER TABLE public.profiles ALTER COLUMN approval_status SET DEFAULT 'pending';

-- 2. Update handle_new_user to also insert seller role and set pending status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, approval_status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'pending');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seller');
  RETURN NEW;
END;
$$;

-- 3. Add update policy on user_roles for admins
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
