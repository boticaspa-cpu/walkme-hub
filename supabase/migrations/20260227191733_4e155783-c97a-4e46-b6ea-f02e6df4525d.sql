INSERT INTO public.profiles (id, full_name, approval_status)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'approved'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.id IN (
    'c77d5c89-d902-4b37-ac2a-add5eaa75d0e',
    'e5190348-e055-4c71-832f-e6db6bb24587'
  );