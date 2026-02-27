

# Plan: Insertar roles de admin en user_roles

La tabla `user_roles` está vacía. Los perfiles ya existen. Solo necesito insertar dos filas.

## Acción

Usar la herramienta de inserción de datos para ejecutar:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('c77d5c89-d902-4b37-ac2a-add5eaa75d0e', 'admin'),
  ('e5190348-e055-4c71-832f-e6db6bb24587', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Sin cambios de código ni migraciones de esquema.

