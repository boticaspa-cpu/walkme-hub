

# Plan: Registrar usuario seller de prueba

## Problema previo
La base de datos **no tiene triggers** (confirmado en el contexto). El trigger `on_auth_user_created` que llama a `handle_new_user()` nunca fue creado, lo que significa que nuevos signups no obtienen perfil ni rol automáticamente.

## Pasos

### 1. Migración SQL — Crear el trigger faltante
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. Tú registras al seller desde la app
- Abre `/login?tab=signup` en el preview
- Crea una cuenta con nombre "Seller Test" y un email/contraseña de prueba
- El trigger creará automáticamente el perfil con `approval_status = 'pending'` y rol `seller`

### 3. Aprobar al seller desde Configuración
- Inicia sesión como admin
- Ve a `/configuracion`
- Aprueba al usuario "Seller Test"

### 4. Listo para testear
El seller puede iniciar sesión y hacer el flujo completo: abrir caja → cobrar reserva con tarjeta → verificar comisión en `/comisiones`

| Cambio | Detalle |
|---|---|
| SQL Migration | Crear trigger `on_auth_user_created` en `auth.users` |
| Código | Sin cambios |

