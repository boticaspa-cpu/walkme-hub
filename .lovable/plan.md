

# Plan: Activar flujo de alta de vendedores con aprobación

## Problema actual

1. El botón "Invitar Vendedor" está `disabled` y no hace nada
2. El `approval_status` default es `'approved'` — cualquiera que se registre entra directo
3. No hay forma de que el admin apruebe/rechace usuarios pendientes
4. El `AuthContext` no bloquea usuarios con status `pending`

## Cambios

### 1. Migración DB

- Cambiar default de `profiles.approval_status` de `'approved'` a `'pending'`
- Actualizar `handle_new_user()` para también insertar un `user_roles` row con role `'seller'` (los nuevos usuarios son vendedores por default)

```sql
ALTER TABLE public.profiles ALTER COLUMN approval_status SET DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, approval_status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'pending');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seller');
  RETURN NEW;
END;
$$;
```

### 2. `src/contexts/AuthContext.tsx` — Bloquear usuarios no aprobados

Después de fetch del profile, si `approval_status !== 'approved'`, no setear el user (tratarlo como no autenticado). Mostrar un mensaje apropiado en Login cuando el signup fue exitoso pero la cuenta está pendiente.

### 3. `src/pages/Login.tsx` — Mejorar feedback

- Después del signup, mostrar mensaje claro: "Cuenta creada. Un administrador debe aprobar tu acceso."
- Si un usuario con status `pending` intenta hacer login, mostrar: "Tu cuenta está pendiente de aprobación."

### 4. `src/pages/Configuracion.tsx` — Gestión de usuarios

- Activar botón "Invitar Vendedor" (no para invitar por email, sino como indicación de que el vendedor se registra solo — o un dialog con instrucciones)
- Agregar botones de acción por usuario:
  - **Aprobar** (si status es `pending`) → update `approval_status = 'approved'`
  - **Deshabilitar** (si status es `approved`) → update `approval_status = 'disabled'`
  - Dropdown para cambiar rol (admin/seller)
- Mostrar badges con colores por status: pending=amarillo, approved=verde, rejected/disabled=rojo

## Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | Default `pending`, trigger inserta role `seller` |
| `src/contexts/AuthContext.tsx` | Bloquear usuarios no aprobados |
| `src/pages/Login.tsx` | Feedback para pendiente/rechazado |
| `src/pages/Configuracion.tsx` | Botones aprobar/deshabilitar/cambiar rol |

