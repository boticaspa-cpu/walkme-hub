

# Responsive + Actualización en celular (PWA)

## Problema
1. **Actualización en celular**: No hay Service Worker ni PWA configurado. El navegador del celular cachea la versión vieja y no muestra los cambios recientes.
2. **Overflow horizontal**: Algunos elementos con anchos fijos (`w-[150px]`, tablas anchas) pueden desbordar en pantallas pequeñas.

## Solución

### 1. Instalar y configurar PWA con `vite-plugin-pwa`
- Instalar `vite-plugin-pwa` como dependencia
- Configurar en `vite.config.ts` con estrategia `autoUpdate` para que los usuarios siempre obtengan la versión más reciente sin cache viejo
- Actualizar `public/manifest.json` con iconos PWA adecuados
- Agregar lógica de detección de actualización para refrescar automáticamente cuando hay una nueva versión

### 2. Corregir overflow horizontal en páginas clave
- **Reservas.tsx**: Los `SelectTrigger` con `w-[150px]` fijo pueden desbordar en móvil → cambiar a `w-full sm:w-[150px]`
- **Reportes.tsx / Configuracion.tsx**: Mismos ajustes en selectores con ancho fijo
- **Tablas**: Ya tienen `overflow-x-auto`, lo cual está correcto

### 3. Meta tags PWA en `index.html`
- Agregar `<meta name="apple-mobile-web-app-capable">` y `<meta name="apple-mobile-web-app-status-bar-style">` para iOS

## Archivos a modificar
- `vite.config.ts` — agregar plugin PWA
- `package.json` — nueva dependencia `vite-plugin-pwa`
- `public/manifest.json` — completar iconos y configuración
- `index.html` — meta tags para iOS PWA
- `src/pages/Reservas.tsx` — anchos responsivos en filtros
- `src/pages/Reportes.tsx` — anchos responsivos en selectores
- `src/pages/Configuracion.tsx` — anchos responsivos en selectores
- `src/main.tsx` — registrar Service Worker con auto-update

