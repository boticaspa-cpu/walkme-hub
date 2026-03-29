

# Renombrar "Costo Neto" → "Reporte" en toda la UI

## Resumen
Cambiar todas las etiquetas visibles de "Costo Neto" por "Reporte" en la interfaz. Los nombres de variables/campos en código y base de datos no cambian — solo el texto que ve el usuario.

## Archivos a modificar

### 1. `src/pages/Tours.tsx`
- Línea 1367: `"Modo Costo Neto"` → `"Modo Reporte"`
- Línea 1390: `"Costo Neto Adulto {currency}"` → `"Reporte Adulto {currency}"`
- Línea 1401: `"Costo Neto Niño {currency}"` → `"Reporte Niño {currency}"`
- Línea 1412: `"Costo Neto Adulto {currency}"` → `"Reporte Adulto {currency}"`
- Línea 1425: `"Costo Neto Niño {currency}"` → `"Reporte Niño {currency}"`

### 2. `src/components/tours/PriceVariantEditor.tsx`
- Línea 126: `"Costo Neto"` → `"Reporte"`

### 3. `src/components/tours/PackageEditor.tsx`
- Línea 211: `"Costo Neto Adulto USD"` → `"Reporte Adulto USD"`
- Línea 215: `"Costo Neto Menor USD"` → `"Reporte Menor USD"`

### 4. `src/components/operators/PriceListExportDialog.tsx`
- Línea 149: `"Costo Neto Adulto"` → `"Reporte Adulto"`, `"Costo Neto Menor"` → `"Reporte Menor"`

### 5. `src/components/operators/PriceListImportDialog.tsx`
- Línea 319: `"Regla de Costo Neto"` → `"Regla de Reporte"`

### 6. `src/lib/sheet-import.ts` (aliases de importación)
- Agregar `"reporte"` como alias adicional en las listas de `cost_adult`, `cost_child` y `net_cost` para que el importador reconozca columnas con el nuevo término.

## Lo que NO cambia
- Nombres de columnas en base de datos (`net_cost`)
- Variables en código (`net_cost`, `price_adult_usd`, etc.)
- Lógica de cálculo

