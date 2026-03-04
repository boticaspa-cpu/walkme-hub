

# Plan: Botones Crear Reserva/Cotización + Fix Pricing Sin Paquete

## Problemas Identificados

1. **TourShowroom** (Tours.tsx, lineas 296-298): Los botones "Crear Reserva" y "Crear Cotización" no tienen `onClick` — son botones decorativos.
2. **Reservas**: El campo `total_mxn` es manual (Input type=number, linea 528). No hay auto-pricing. Si el usuario no lo llena, queda en 0.
3. **Cotizaciones**: SÍ tiene auto-pricing via `lookupPrice()` usando `tour_price_variants`, pero si no hay variante, retorna 0 sin fallback al precio base del tour.

## Cambios

### 1. Nuevo archivo: `src/lib/tour-pricing.ts`

Función compartida `computeTourPrice`:
- Recibe: `tourId, zone, nationality, variants[], toursData[]`
- Lógica:
  1. Buscar en `tour_price_variants` match exacto por tour+zone+nationality+pax_type
  2. Si NO hay match → fallback a `tour.price_mxn` (adulto) y `tour.suggested_price_mxn` (niño) del catálogo
- Retorna `{ adultPrice: number, childPrice: number, source: 'variant' | 'tour_base' }`

### 2. Tours.tsx — Conectar botones del Showroom

Agregar estado para abrir modals de reserva y cotización directamente desde TourShowroom:
- **"Crear Reserva"**: Navegar a `/reservas` con query params `?tour_id={id}&action=create` (o usar un estado global/callback)
  - Alternativa más simple: El TourShowroom recibe callbacks `onCreateReservation(tourId)` y `onCreateQuote(tourId)`. El componente padre `Tours` abre un mini-modal inline de creación rápida (reutilizando la misma lógica de Reservas/Cotizaciones), o navega con `useNavigate`.
  - **Enfoque elegido**: `useNavigate` a `/reservas?tour_id={tourId}` y `/cotizaciones?tour_id={tourId}`. Las páginas destino detectan el param y abren el dialog de creación con el tour preseleccionado.

### 3. Reservas.tsx — Auto-pricing + detección de query param

- Importar `computeTourPrice` y la query de `tour_price_variants`
- Expandir query de `tours-active` para incluir `price_mxn, suggested_price_mxn`
- Agregar `useEffect` que recalcule `form.total_mxn` cuando cambien `tour_id`, `zone`, `nationality`, `pax_adults`, `pax_children`
- Detectar `?tour_id=` en URL al montar → abrir dialog con tour preseleccionado
- El campo Total MXN sigue siendo editable (override manual) pero se auto-llena

### 4. Cotizaciones.tsx — Fallback pricing + detección de query param

- Expandir query de `tours-active` para incluir `price_mxn, suggested_price_mxn`
- En `lookupPrice`: si no encuentra variante, hacer fallback a `tour.price_mxn` / `tour.suggested_price_mxn`
- Detectar `?tour_id=` → abrir dialog con una línea pre-creada para ese tour

### 5. ReservationCheckout.tsx — Recalcular si total=0

- Al abrir el checkout, si `reservation.total_mxn === 0`, recalcular usando `computeTourPrice` con los datos de la reserva y actualizar el registro antes de mostrar el monto.

## Archivos

| Archivo | Acción |
|---|---|
| `src/lib/tour-pricing.ts` | **Nuevo** — función `computeTourPrice` |
| `src/pages/Tours.tsx` | Conectar onClick de botones Showroom con `useNavigate` |
| `src/pages/Reservas.tsx` | Auto-pricing + detectar `?tour_id` para abrir dialog |
| `src/pages/Cotizaciones.tsx` | Fallback pricing + detectar `?tour_id` |
| `src/components/reservations/ReservationCheckout.tsx` | Recalcular si total=0 |

No hay cambios de DB — los campos ya existen.

