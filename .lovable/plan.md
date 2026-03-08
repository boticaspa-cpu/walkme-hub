

# Fix: Link de invitación apunta a Lovable en vez de la app

## Problema
`window.location.origin` en el entorno de preview devuelve la URL de Lovable, no la URL publicada (`https://walkme-hub.lovable.app`).

## Solución
En `src/pages/Configuracion.tsx` línea 49, cambiar la generación del link para usar la URL publicada de la app como base:

```typescript
const inviteUrl = "https://walkme-hub.lovable.app/login?tab=signup";
```

Esto garantiza que el link siempre apunte a la app publicada, sin importar desde dónde se genere.

## Archivo modificado
- `src/pages/Configuracion.tsx` — línea 49, hardcodear la URL publicada

