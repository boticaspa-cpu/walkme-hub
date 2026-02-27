
Objetivo: restaurar el acceso de login sin mover roles fuera de `user_roles`.

Pasos de implementación:
1. Confirmar estado actual en backend:
   - `public.profiles` está vacío.
   - `public.user_roles` ya contiene `admin` para `walkmetravel@gmail.com` y `boticaspa@gmail.com`.

2. Aplicar migración de backfill de perfiles (sin tocar roles):
   - Insertar perfiles faltantes para usuarios existentes en autenticación.
   - Mantener `approval_status = 'approved'` para estos dos usuarios.

3. Endurecer el flujo de auth en frontend:
   - En `AuthContext`, cambiar la lectura de perfil de `.single()` a `.maybeSingle()`.
   - Si no existe perfil, mostrar error controlado (no loop silencioso) y cerrar sesión localmente para evitar reintentos infinitos.

4. Validación end-to-end:
   - Iniciar sesión con ambas cuentas.
   - Verificar acceso a `/dashboard`.
   - Abrir creación/edición de tour en `/tours` y confirmar visibilidad del botón `📄 Mapear Documento`.

Sección técnica:
- SQL de backfill recomendado:
```sql
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
```
- No guardar roles en `profiles` ni en `users`; roles permanecen en `public.user_roles`.
