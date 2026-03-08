

# Plan: Fix missing trigger + create Marina Mena's profile

## Root Cause
The `handle_new_user()` function exists but there is **no trigger** on `auth.users` that calls it. New signups never get a profile or role created.

## Changes

### 1. DB Migration — Create the trigger + backfill Marina Mena

```sql
-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill the existing user who was missed
INSERT INTO public.profiles (id, full_name, approval_status)
VALUES ('d1c13d2e-a503-4d8c-a38d-f211f65547da', 'Marina Mena', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('d1c13d2e-a503-4d8c-a38d-f211f65547da', 'seller')
ON CONFLICT (user_id, role) DO NOTHING;
```

### 2. No code changes needed
The `AuthContext` and `Configuracion` page already handle the approval flow. Once Marina's profile exists with `pending` status, she'll appear in the user list on Configuracion and you can approve her from there.

## Result
- Marina Mena will appear in Configuracion with status "Pendiente"
- You approve her and she can log in
- Future signups will automatically get profile + seller role via the trigger

| File | Change |
|---|---|
| SQL Migration | Attach trigger to auth.users + backfill Marina Mena |

