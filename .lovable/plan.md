

# Agregar columna "Fuente" al Excel y PDF

## Cambio
Añadir un campo `source` al `VariantRow` que indique de dónde viene el precio: **Matriz**, **Paquete** o **Base**. Mostrarlo como columna extra en ambos formatos.

## Cambios en `src/components/operators/PriceListExportDialog.tsx`

### 1. Interfaz `VariantRow`
- Agregar `source: "Matriz" | "Paquete" | "Base"`

### 2. `fetchData`
- Sección 1 (matrix variants): asignar `source: "Matriz"`
- Sección 2 (tour_packages): asignar `source: "Paquete"`
- Sección 3 (fallback base): asignar `source: "Base"`

### 3. `generateExcel`
- Agregar "Fuente" como última columna en el header
- Incluir `r.source` en cada fila de datos
- Agregar ancho de columna extra `{ wch: 10 }`

### 4. `generatePDF`
- Agregar "Fuente" al array `head`
- Incluir `r.source` en cada fila del `body`
- Ajustar `columnStyles` para la nueva columna 10

