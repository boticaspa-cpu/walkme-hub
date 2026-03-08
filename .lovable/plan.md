

# Plan: Eliminar usuario Marina Mena

Eliminar el perfil, rol y cuenta de autenticación de Marina Mena (ID: `d1c13d2e-a503-4d8c-a38d-f211f65547da`).

## Cambios

### 1. Edge Function temporal `delete-user`
Crear una función backend que use la API de administración para eliminar el usuario del sistema de autenticación. Las tablas `profiles` y `user_roles` tienen `ON DELETE CASCADE` desde `auth.users`, así que se limpian automáticamente.

**Archivo nuevo**: `supabase/functions/delete-user/index.ts`
- Recibe `user_id` en el body
- Usa `supabase.auth.admin.deleteUser(user_id)` con el service role key
- Retorna confirmación

### 2. Invocar la función para eliminar a Marina Mena
- `user_id`: `d1c13d2e-a503-4d8c-a38d-f211f65547da`

### 3. Eliminar la edge function después de usarla

| Paso | Acción |
|---|---|
| Crear función | `supabase/functions/delete-user/index.ts` |
| Invocar | DELETE Marina Mena |
| Limpiar | Eliminar la función temporal |

