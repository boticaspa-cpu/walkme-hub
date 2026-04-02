
# Fix real: la cotización guarda bien, pero reserva/voucher/cobro vuelven a calcular mal

## Lo que confirmé
Ya no es el problema de `package_name` en la tabla `reservations`: esa columna ya existe y sí se guarda.

El desfase actual viene de esto:
- La cotización guarda los precios correctos en `quote_items`
- Al pasar a reserva, esos precios sí se copian a `reservation_items`
- Pero después, varias pantallas **ignoran `reservation_items`** y vuelven a calcular desde `tour_price_variants` o precio base
- Además, en checkout se crea `sale_items` con un precio inventado (`total / adultos`) y se pierde el detalle real

Eso explica exactamente tu captura:
- cotización: adulto = `3607.50`
- voucher/reserva: adulto = `3126.50`
- total final sigue igual porque conserva el descuento, pero el desglose ya quedó mal

## Plan de implementación

### 1. Hacer `reservation_items` la fuente de verdad después de aceptar una cotización
**Archivo:** `src/components/cotizaciones/AcceptQuoteDialog.tsx`

- Dejar de tratar el insert de `reservation_items` como “best-effort”
- Si falla el insert de items, hacer rollback de la reserva y mostrar error
- Así garantizamos que toda reserva creada desde cotización tenga sus precios exactos persistidos

### 2. Corregir voucher y confirmaciones para que usen precios guardados, no recalculados
**Archivo:** `src/pages/Reservas.tsx`

- Cambiar `enrichWithPrices()` para que:
  - primero busque `reservation_items`
  - si existen, use `unit_price_mxn`, `unit_price_child_mxn`, `subtotal_mxn` y `package_name` guardados
  - solo use fallback de matriz/base para reservas viejas sin items

- Corregir además el fallback actual, porque hoy ignora el paquete:
  - usar `computeTourPrice(..., r.package_name, allTourPackages)`
  - eliminar la búsqueda genérica que usa `!v.package_name` cuando sí hay paquete

**Archivo:** `src/components/reservations/VoucherPrintView.tsx`

- Mostrar el desglose usando los valores reales persistidos
- Mantener fallback para reservas antiguas
- Resultado esperado: el voucher debe enseñar el mismo precio por adulto/menor que se vio en la cotización

### 3. Corregir checkout para cobrar y registrar con el detalle correcto
**Archivo:** `src/components/reservations/ReservationCheckout.tsx`

- Cargar `reservation_items` al abrir el modal
- Mantener `reservation.total_mxn` como total a cobrar
- Pero usar `reservation_items` para:
  - el resumen interno del cobro
  - el subtotal real antes de descuento
  - preservar el descuento en la venta
  - crear `sale_items` correctos

Cambios concretos:
- Si la reserva tiene descuento, no guardar la venta con `discount_mxn: 0`
- Para pago completo:
  - `subtotal_mxn` = suma real de `reservation_items.subtotal_mxn`
  - `discount_mxn` = `reservation.discount_mxn`
  - `total_mxn` = lo efectivamente cobrado
- Dejar de crear `sale_items` con:
  - `unit_price_mxn = saleTotal / adultos`
  - `unit_price_child_mxn = 0`
- En su lugar, mapear los `reservation_items` reales a `sale_items`

### 4. Blindar también el flujo de edición de reservas
**Archivo:** `src/pages/Reservas.tsx`

- En el `useEffect` de auto-pricing en modo edición, pasar también:
  - `form.package_name`
  - `allTourPackages`
- Así editar una reserva con paquete no volverá a cambiarla a precio general/base por accidente

## Resultado esperado
Después del fix:
- Cotización, reserva, voucher y cobro mostrarán el mismo monto
- Tours con transporte/paquete ya no caerán al precio de “solo entrada”
- El descuento seguirá correcto
- La venta quedará registrada con líneas reales, no con precios promediados falsos

## Archivos a tocar
- `src/components/cotizaciones/AcceptQuoteDialog.tsx`
- `src/pages/Reservas.tsx`
- `src/components/reservations/VoucherPrintView.tsx`
- `src/components/reservations/ReservationCheckout.tsx`

## Nota técnica
No hace falta migración nueva:
- `reservations.package_name` ya existe
- `reservation_items` ya existe
- las políticas actuales permiten leer e insertar esos items

El arreglo es principalmente de consistencia en frontend y persistencia de detalle.

## Validación que haré al implementarlo
1. Crear una cotización con paquete/transporte y descuento
2. Pasarla a reserva
3. Verificar que el voucher muestre el mismo precio unitario que la cotización
4. Abrir checkout y confirmar que el total/subtotal/descuento coinciden
5. Cobrar y revisar que la venta guarde los items correctos
6. Probar una reserva vieja sin `reservation_items` para asegurar que el fallback siga funcionando
