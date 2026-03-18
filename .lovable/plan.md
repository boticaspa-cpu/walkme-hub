

# Arreglar responsividad móvil — Auditoría amplia

## Problemas encontrados

### 1. Chat IA: input invisible en móvil
La captura muestra que el campo de texto del chat no aparece. El chat usa `bottom-16` y `h-[calc(100dvh-4rem)]`, pero el BottomNav mide `h-16` (4rem). El chat se posiciona desde `bottom-16` hacia arriba con altura `100dvh - 4rem`, lo que llena exactamente la pantalla sin dejar espacio para el input en la parte inferior. El problema real es que el chat necesita ser un overlay de pantalla completa en móvil, cubriendo el BottomNav completamente en vez de intentar convivir con él.

### 2. Dashboard: grid de accesos rápidos
`grid-cols-2` sin padding mínimo hace que las cards se vean apretadas en pantallas <380px. Las cards de KPI financiero usan `sm:grid-cols-3` que en móvil colapsa a 1 columna correctamente, pero el grid de accesos rápidos mantiene 2 columnas siempre.

### 3. Leads: filtro con ancho fijo
`SelectTrigger` con `w-40` (160px) no se adapta en móvil — debería ser `w-full sm:w-40`.

### 4. Reportes/Configuracion: `flex-row items-center justify-between` en CardHeaders
Estos headers con botones pueden desbordar en pantallas pequeñas cuando el título + botón no caben en una línea.

### 5. Tablas generales
Las tablas ya tienen `hidden sm:table-cell` y `overflow-x-auto` en la mayoría de casos — esto está bien.

## Cambios propuestos

### `FloatingChatWidget.tsx`
- En móvil, usar `inset-0` (pantalla completa) con `z-[70]` para cubrir todo incluyendo BottomNav
- Quitar `bottom-16` y el cálculo de altura complejo
- En desktop mantener el comportamiento actual (esquina inferior derecha, 380px ancho, 520px alto)

### `Leads.tsx`
- Cambiar `w-40` → `w-full sm:w-40` en el SelectTrigger del filtro de estado

### `Dashboard.tsx`
- El grid de accesos rápidos `grid-cols-2 gap-4 lg:grid-cols-3` funciona OK en general, solo agregar `min-w-0` para evitar overflow por texto largo en cards

### `Configuracion.tsx`
- CardHeaders con `flex-row` → `flex-col sm:flex-row` para que título y botón se apilen en móvil
- Ya tiene `w-full sm:w-[110px]` en el select de rol (arreglado antes)

### `Reportes.tsx`
- CardHeaders con `flex-row` → `flex-col sm:flex-row gap-2`

### `CierreDiario.tsx`
- Ya usa `grid-cols-2 sm:grid-cols-4` — OK

### `AppLayout.tsx` / CSS
- No requiere cambios adicionales — `overflow-x: hidden` ya está en `html, body`

## Archivos a modificar
1. `src/components/chat/FloatingChatWidget.tsx` — overlay completo en móvil
2. `src/pages/Leads.tsx` — filtro responsivo
3. `src/pages/Configuracion.tsx` — CardHeaders responsivos
4. `src/pages/Reportes.tsx` — CardHeaders responsivos
5. `src/pages/Dashboard.tsx` — min-w-0 en grid de accesos

## Resumen
5 archivos, cambios menores de CSS/clases Tailwind. El más importante es el chat: en móvil debe cubrir toda la pantalla como un overlay, no competir con el BottomNav.

