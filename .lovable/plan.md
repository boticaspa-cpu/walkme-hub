

# Plan: Flujo POS con Paquetes → Zona/Nacionalidad/Pasajeros

## Problema
Cuando un tour tiene **paquetes**, el POS muestra `PackageSelectDialog` que solo permite elegir el paquete y lo agrega directo al carrito — sin preguntar zona, nacionalidad, ni cantidad de adultos/niños. Los tours **sin paquetes** que tienen variantes sí muestran esas opciones via `VariantSelectDialog`. Se necesita que ambos flujos ofrezcan la misma experiencia.

## Solución
Cambiar el flujo del POS para tours con paquetes: primero seleccionar paquete, luego abrir `VariantSelectDialog` filtrado por ese paquete. Esto requiere:

1. **Agregar columna `package_name`** a la tabla `tour_price_variants` para vincular cada variante a un paquete específico.
2. **Guardar `package_name`** al persistir variantes en `Tours.tsx` (actualmente no se guarda).
3. **Cargar `package_name`** al editar un tour existente (actualmente se hardcodea `""`).
4. **Modificar flujo POS**: cuando el usuario selecciona un paquete, filtrar variantes por `package_name` y abrir `VariantSelectDialog` con esas variantes filtradas.

## Cambios

### 1. Migración DB
```sql
ALTER TABLE public.tour_price_variants ADD COLUMN package_name text DEFAULT '';
```

### 2. `Tours.tsx` — Persistir y cargar `package_name`
- En `saveVariants`: agregar `package_name: v.package_name` al objeto que se inserta.
- En el load de variantes (línea 541-543): leer `package_name` del registro en vez de hardcodear `""`.

### 3. `POS.tsx` — Flujo paquete → variantes
Modificar `handleTourClick`:
- Si el tour tiene paquetes **y** variantes: mostrar `PackageSelectDialog` primero.
- Cuando el usuario selecciona un paquete: filtrar `allVariants` por `package_name === pkg.name`, luego abrir `VariantSelectDialog` con esas variantes filtradas.
- Si no hay variantes para ese paquete, usar el flujo actual (agregar directo).

Modificar `addPackageToCart` → ya no agrega directo, sino que guarda el paquete seleccionado y abre el dialog de variantes.

Agregar estado `pendingSelectedPackage` para recordar qué paquete se eligió entre los dos dialogs.

### 4. `VariantSelectDialog` — Mostrar nombre del paquete
Agregar prop opcional `packageName` para mostrar en el título del dialog (ej. "Coco Bongo Regular — LADIES NIGHT").

### Archivos modificados
- Migración SQL — agregar `package_name` a `tour_price_variants`
- `src/pages/Tours.tsx` — guardar/cargar `package_name`
- `src/pages/POS.tsx` — flujo paquete → variantes
- `src/components/pos/VariantSelectDialog.tsx` — mostrar nombre de paquete (menor)

