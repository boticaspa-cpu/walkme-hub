
# Reemplazar texto "Walkme Tours" por logo clickeable en el Topbar móvil

## Cambio

En `src/components/layout/Topbar.tsx`, línea 14: reemplazar el `<span>` de texto por una imagen del logo (`/walkme-logo.png` que ya existe en `public/`) envuelta en un `<Link>` a `/dashboard`.

### Detalle
- Importar `Link` de `react-router-dom`
- Reemplazar `<span className="sm:hidden ...">Walkme Tours</span>` por:
  ```tsx
  <Link to="/dashboard" className="sm:hidden">
    <img src="/walkme-logo.png" alt="Walkme Tours" className="h-8" />
  </Link>
  ```
- El logo solo aparece en móvil; en desktop se mantiene el sidebar trigger

**Archivo:** `src/components/layout/Topbar.tsx`
