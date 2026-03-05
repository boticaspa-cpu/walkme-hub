-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill Marina Mena
INSERT INTO public.profiles (id, full_name, approval_status)
VALUES ('d1c13d2e-a503-4d8c-a38d-f211f65547da', 'Marina Mena', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('d1c13d2e-a503-4d8c-a38d-f211f65547da', 'seller')
ON CONFLICT (user_id, role) DO NOTHING;