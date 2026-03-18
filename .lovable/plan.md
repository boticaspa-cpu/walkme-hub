

# Forzar actualización en celular — Service Worker + reload automático

## Problema
El plugin `vite-plugin-pwa` está configurado pero **nunca se registra el Service Worker** en `main.tsx`. Sin esa línea, el SW no se instala y el navegador del celular sigue sirviendo la versión cacheada por su propio cache HTTP. Además, falta lógica para detectar una nueva versión y recargar la página automáticamente.

## Cambios

### 1. `src/main.tsx` — Registrar SW con auto-reload
Agregar el import de `registerSW` de `vite-plugin-pwa/virtual` y llamarlo para que:
- Registre el Service Worker
- Cuando detecte una nueva versión, recargue la página automáticamente

```typescript
import { registerSW } from "virtual:pwa-register";

// Auto-reload when new version detected
registerSW({ onNeedRefresh() { window.location.reload(); } });
```

### 2. `vite.config.ts` — Agregar `skipWaiting` al workbox config
Agregar `skipWaiting: true` y `clientsClaim: true` en la configuración de workbox para que el nuevo SW tome control inmediatamente sin esperar a que el usuario cierre todas las pestañas.

### 3. `index.html` — Agregar cache-busting meta tag
Agregar `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">` para evitar que el navegador cachee el HTML principal.

## Instrucciones para el usuario
Después de publicar estos cambios, en el celular:
1. Abrir la app en el navegador
2. Hacer "pull to refresh" o recargar manualmente **una vez**
3. A partir de ahí, las futuras actualizaciones se aplicarán automáticamente

Si la app está instalada como PWA en la pantalla de inicio, puede ser necesario eliminarla y volver a agregarla una vez.

## Archivos
- `src/main.tsx` (~3 líneas nuevas)
- `vite.config.ts` (~2 líneas nuevas en workbox config)  
- `index.html` (~1 línea nueva)

