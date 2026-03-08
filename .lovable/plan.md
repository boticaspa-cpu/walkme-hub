

# Plan: Link de invitación para vendedores

Reemplazar el diálogo informativo actual por uno que genere y muestre un link directo a la página de registro, con botón para copiar al portapapeles.

## Cambios en `src/pages/Configuracion.tsx`

1. **Importar** `Copy, CheckCheck` de lucide-react
2. **Estado**: `linkCopied` (boolean) para feedback visual
3. **Generar link**: Usar `window.location.origin + "/login?tab=signup"` como URL de invitación
4. **Nuevo contenido del diálogo**:
   - Mostrar el link en un campo de texto readonly
   - Botón "Copiar enlace" que copia al portapapeles y muestra ✓
   - Mantener la nota de que el vendedor quedará pendiente hasta aprobación

5. **Actualizar Login.tsx**: Leer el query param `tab` para abrir directamente en la pestaña "signup" si viene del link de invitación

## Archivos modificados
- `src/pages/Configuracion.tsx` — nuevo contenido del diálogo de invitación
- `src/pages/Login.tsx` — leer `?tab=signup` para pre-seleccionar pestaña de registro

