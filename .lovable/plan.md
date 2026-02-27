

# Plan: Assign Admin Roles

The read query tool is read-only, so I need to use a database migration to insert the admin roles.

## Migration

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('c77d5c89-d902-4b37-ac2a-add5eaa75d0e', 'admin'),  -- walkmetravel@gmail.com
  ('e5190348-e055-4c71-832f-e6db6bb24587', 'admin')    -- boticaspa@gmail.com
ON CONFLICT (user_id, role) DO NOTHING;
```

Single migration, no code changes needed. After this, both users will have the admin role and can access all admin features including document mapping.

