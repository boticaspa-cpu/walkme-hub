

# Plan: Descuentos manuales en Cotizaciones y Reservas

## Resumen
Agregar un campo de descuento directo (en MXN) en los formularios de Cotizaciones y Reservas, visible tanto para admin como para vendedor. El descuento se resta del subtotal calculado para obtener el total final.

## Cambios en base de datos

**Migración SQL** — agregar columna `discount_mxn` a ambas tablas:

```sql
ALTER TABLE public.quotes ADD COLUMN discount_mxn numeric NOT NULL DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN discount_mxn numeric NOT NULL DEFAULT 0;
```

## Cambios en código

### 1. `src/pages/Cotizaciones.tsx`
- Agregar estado `discount` al form (inicializado en 0, cargado al editar)
- Mostrar un campo "Descuento MXN" debajo del subtotal de items
- Mostrar **Subtotal** y **Total (subtotal - descuento)** 
- Guardar `discount_mxn` en el insert/update de `quotes`
- Mostrar descuento en la tabla de listado si > 0

### 2. `src/pages/Reservas.tsx`
- **Modo edición**: agregar campo descuento junto al Total MXN existente, recalcular total = subtotal - descuento
- **Modo creación**: agregar campo descuento por item o global en los datos compartidos
- Guardar `discount_mxn` en insert/update de `reservations`

### 3. `src/components/reservations/ReservationCheckout.tsx`
- Leer `reservation.discount_mxn` y mostrarlo en el resumen del ticket
- Usar `totalMxn` ya neto (total_mxn ya incluye el descuento desde la reserva)

### 4. `src/components/cotizaciones/AcceptQuoteDialog.tsx`
- Propagar `discount_mxn` de la cotización a la reserva al convertir

### 5. `src/pages/CotizacionPDF.tsx`
- Mostrar línea de descuento en el PDF si > 0

## UI del descuento

En ambos formularios, debajo de la lista de items/total:

```
Subtotal:     $5,000.00
Descuento:    [____input____] MXN
─────────────────────────
Total:        $4,500.00
```

| Archivo | Cambio |
|---|---|
| SQL Migration | `discount_mxn` en quotes y reservations |
| `src/pages/Cotizaciones.tsx` | Campo descuento + cálculo subtotal/total |
| `src/pages/Reservas.tsx` | Campo descuento en edit y create mode |
| `src/components/reservations/ReservationCheckout.tsx` | Mostrar descuento en resumen |
| `src/components/cotizaciones/AcceptQuoteDialog.tsx` | Propagar descuento a reserva |
| `src/pages/CotizacionPDF.tsx` | Mostrar descuento en PDF |

