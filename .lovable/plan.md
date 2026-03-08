

# Plan: Mejora de UI Responsiva para Móviles

## Resumen
Optimizar la experiencia en dispositivos móviles (iPhone, Samsung, Android) para que nada se desborde horizontalmente, los diálogos se adapten correctamente y toda la app se vea profesional en pantallas pequeñas.

## Cambios Globales

### 1. `index.html` — Meta viewport mejorado
Agregar `maximum-scale=1, user-scalable=no` para evitar zoom accidental en inputs en iOS y scroll horizontal no deseado.

### 2. `src/index.css` — Reglas base para móvil
- `html, body { overflow-x: hidden; }` para eliminar scroll horizontal
- Mejorar inputs en iOS: `font-size: 16px` mínimo para evitar zoom automático
- Safe area insets para notch/barra de navegación (`env(safe-area-inset-*)`)

### 3. `src/components/ui/dialog.tsx` — Diálogos responsive
- En móvil: dialog ocupa todo el ancho con padding reducido (`p-4` en lugar de `p-6`)
- Máximo height con `max-h-[100dvh]` en móvil, `max-h-[90dvh]` en desktop
- Bordes redondeados solo en desktop (`rounded-none` en móvil, `sm:rounded-lg`)
- Posicionamiento: full-screen en móvil, centrado en desktop

### 4. `src/components/ui/sheet.tsx` — Sheets responsive
- Asegurar que el width en móvil no desborde (`max-w-full`)

### 5. `src/components/ui/popover.tsx` — Popovers responsive
- Agregar `max-w-[calc(100vw-2rem)]` para que no se salga de pantalla

### 6. `src/components/ui/select.tsx` — Select menus
- `SelectContent` con `max-h-[40vh]` y `max-w-[calc(100vw-2rem)]`

### 7. `src/components/layout/AppLayout.tsx` — Layout principal
- Agregar `overflow-x-hidden` al contenedor principal
- Main content con `min-w-0` para evitar desbordamiento de tablas

### 8. `src/pages/Cotizaciones.tsx` — Formulario de cotización
- Dialog: usar clases responsive para padding y ancho
- Discount input area: `w-full` en móvil en lugar de `w-64`
- Items: mejorar grid de precios en móvil a `grid-cols-2` consistente

### 9. `src/pages/Reservas.tsx` — Formulario de reservas
- Dialog edit mode: `grid-cols-2 sm:grid-cols-4` ya existente, verificar que funciona
- Tabla: agregar `overflow-x-auto` implícito con wrapper

### 10. `src/components/reservations/ReservationCheckout.tsx` — Checkout
- Payment method grid: `grid-cols-1` en móvil, `grid-cols-3` en sm+
- Texto de botones en labels de pago más compacto

### 11. `src/components/shared/DiscountInput.tsx` — Descuento
- Asegurar que el toggle group y el input no se compriman

### 12. Tablas globales — Overflow
- Envolver todas las `<Table>` en un wrapper con `overflow-x-auto` para scroll horizontal controlado en tablas que lo necesiten
- Esto se aplica en Cotizaciones, Reservas, POS, CierreDiario, Leads, etc.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `index.html` | viewport meta mejorado |
| `src/index.css` | overflow-x hidden, safe areas, input zoom fix |
| `src/components/ui/dialog.tsx` | Full-screen en móvil, padding reducido |
| `src/components/ui/popover.tsx` | max-width limitado al viewport |
| `src/components/ui/select.tsx` | max-width limitado |
| `src/components/layout/AppLayout.tsx` | overflow-x-hidden, min-w-0 |
| `src/pages/Cotizaciones.tsx` | Discount area responsive, dialog width |
| `src/pages/Reservas.tsx` | Table overflow, dialog responsive |
| `src/components/reservations/ReservationCheckout.tsx` | Payment grid responsive |
| `src/components/shared/DiscountInput.tsx` | Layout flex responsive |

