

# Plan: Mostrar siempre Zona, Nacionalidad y agregar Fecha en VariantSelectDialog

## Problema
El diálogo de variantes oculta los selectores de Zona y Nacionalidad cuando solo hay una opción disponible (se auto-selecciona silenciosamente). El usuario no puede ver ni confirmar qué zona/nacionalidad se está usando. Además falta un campo de fecha para el tour.

## Cambios

### `src/components/pos/VariantSelectDialog.tsx`
1. **Mostrar siempre el selector de Zona** — quitar la condición `zones.length > 1`. Si solo hay una zona, se muestra el select con esa única opción pre-seleccionada.
2. **Mostrar siempre el selector de Nacionalidad** — quitar la condición `zone && nationalities.length > 1`. Mostrar siempre que haya zona seleccionada (incluso con una sola nacionalidad).
3. **Agregar campo de Fecha** — agregar un input `type="date"` arriba de los selectores para que el vendedor indique la fecha del tour. Pasar la fecha en el callback `onAdd`.
4. **Actualizar la interfaz `Props.onAdd`** para incluir `date: string` como parámetro adicional.

### `src/pages/POS.tsx`
5. **Actualizar `addVariantToCart`** para recibir y almacenar la fecha del tour en el `CartItem`.
6. **Agregar `tourDate`** al interface `CartItem`.
7. **Persistir `tour_date`** en `sale_items` al registrar la venta (si la columna existe, o agregar migración).

### Migración DB
8. Agregar columna `tour_date date` a `sale_items` para persistir la fecha seleccionada.

### Archivos modificados
- `src/components/pos/VariantSelectDialog.tsx` — mostrar zona/nacionalidad siempre + campo fecha
- `src/pages/POS.tsx` — recibir y persistir fecha
- Migración SQL — agregar `tour_date` a `sale_items`

