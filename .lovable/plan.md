

# Exportar TODOS los tours: General + Paquetes + Matriz

## Problema actual
El exportador solo muestra tours que tienen filas en `tour_price_variants` (la matriz). Los tours que solo tienen paquetes (`tour_packages`) o solo precios base no aparecen, o aparecen sin costos.

## Solución
Modificar `fetchData` en `PriceListExportDialog.tsx` para consolidar las 3 fuentes de precios:

### 1. Matriz de precios (`tour_price_variants`)
- Ya funciona. Muestra zona, nacionalidad, paquete, precio venta, costo neto, tax.

### 2. Paquetes del tour (`tour_packages`)
- **Nuevo**: Consultar `tour_packages` para todos los tours del operador.
- Para tours que tienen paquetes pero NO tienen variantes en la matriz, generar filas con:
  - `package_name` = nombre del paquete
  - `sale_price_adult/child` = `price_adult_mxn` / `price_child_mxn`
  - `net_cost_adult/child` = `cost_adult_usd` / `cost_child_usd`
  - `tax_adult/child` = `tax_adult_usd` / `tax_child_usd`
  - `zone` / `nationality` = "General"

### 3. Tours sin variantes ni paquetes (precio base)
- Ya existe el fallback pero mejorar para incluir costos USD del tour (`price_adult_usd`, `price_child_usd`).

### Cambios en archivo
**`src/components/operators/PriceListExportDialog.tsx`**:
- En `fetchData`: agregar query a `tour_packages` filtrado por `tour_id in tourIds` y `active = true`
- Después de procesar variantes de matriz, iterar tours que no tienen variantes pero SÍ tienen paquetes → generar filas desde `tour_packages`
- Para tours sin variantes NI paquetes → usar fallback base (ya existe, agregar campos de costo USD)
- Agregar columna "Fuente" o agrupar visualmente por sección (Matriz / Paquete / Base)

### Resultado esperado
El PDF/Excel mostrará TODOS los tours activos del operador, sin importar cómo tengan configurados sus precios.

