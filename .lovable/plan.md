

# Implementar "Olvidé mi contraseña"

## Cambios

### 1. `src/contexts/AuthContext.tsx`
- Agregar función `resetPassword(email: string)` que llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Exportar en el contexto

### 2. `src/pages/Login.tsx`
- Agregar enlace "¿Olvidaste tu contraseña?" debajo del botón "Entrar"
- Al hacer click, mostrar campo de email + botón "Enviar enlace de recuperación"
- Mostrar toast de confirmación al enviar

### 3. `src/pages/ResetPassword.tsx` — Nuevo
- Página pública que detecta el token de recovery en el URL
- Formulario para ingresar nueva contraseña (con confirmación)
- Llama a `supabase.auth.updateUser({ password })` para actualizar
- Redirige a `/login` al completar

### 4. `src/App.tsx`
- Agregar ruta pública `/reset-password`

## Flujo
```text
Login → "¿Olvidaste tu contraseña?" → Ingresa email → Recibe correo
  → Click enlace → /reset-password → Nueva contraseña → Login
```

| Archivo | Acción |
|---|---|
| `src/contexts/AuthContext.tsx` | Agregar `resetPassword` |
| `src/pages/Login.tsx` | Agregar link y estado de recuperación |
| `src/pages/ResetPassword.tsx` | Nuevo — formulario nueva contraseña |
| `src/App.tsx` | Agregar ruta `/reset-password` |

