

# Fix: Importación de Google Sheets — Validación y Preview

## Problemas a resolver

1. Google Sheets devuelve silenciosamente la primera pestaña si el nombre no coincide exactamente
2. No hay preview de datos antes de importar — el usuario no puede verificar qué se leyó
3. Fuzzy matching con LCS puede causar falsos positivos entre columnas similares (ej. "Precio adulto" vs "Precio menor")
4. No hay error claro cuando no se encuentran columnas válidas
5. `getCol()` tiene fallback de `includes()` que puede cruzar columnas

## Cambios

### 1. `src/lib/sheet-import.ts` — Endurecer matching

- **Eliminar fuzzy LCS** del `matchScore()`: solo conservar exact match (1000) y contains match (500+). Remover el branch de LCS con threshold 60% que causa falsos positivos.
- **Eliminar fallback `includes` en `getCol()`**: solo usar exact match por normalized key. El fuzzy en `getCol` es redundante porque ya tenemos `autoMapColumns` + `ColumnMappingDialog` para resolver ambigüedades.
- **Nueva función `validateTabContent()`**: recibe los headers detectados + el aliasMap, retorna `{ valid: boolean, matchedCount: number, totalFields: number }`. Si `matchedCount === 0`, la pestaña probablemente es incorrecta.

### 2. `src/components/tours/SheetPreviewDialog.tsx` — Nuevo componente

Dialog intermedio que se muestra SIEMPRE antes de importar, con:
- Pestaña solicitada vs headers detectados
- Tabla con 2-3 filas de preview de los datos crudos
- Conteo de columnas reconocidas vs total
- Alerta amarilla si 0 columnas reconocidas ("¿Estás seguro que es la pestaña correcta?")
- Alerta roja si headers parecen HTML (sheet no público)
- Botones: "Cancelar" / "Continuar con mapeo"

### 3. `src/pages/Tours.tsx` — Insertar paso de preview

Modificar `handleSheetImport()`:
1. Fetch CSV (igual que ahora)
2. Parse headers + primeras 3 filas
3. Validar con `validateTabContent()`
4. **Mostrar SheetPreviewDialog** con headers + sample rows + validation result
5. Si usuario confirma → continuar con autoMapColumns + ColumnMappingDialog (o processImport si todo auto)
6. Si 0 columnas reconocidas → mostrar warning pero permitir continuar

Nuevos estados: `previewDialogOpen`, `previewData: { headers, sampleRows, matchedCount, totalFields, rawText }`.

### 4. `src/components/tours/ColumnMappingDialog.tsx` — Mejora menor

- Agregar preview de 1 fila de datos al lado de cada header para que el usuario vea qué valor tiene cada columna antes de mapear.

## Flujo resultante

```text
URL + Tab → Fetch CSV → Parse headers + 3 rows
  → SheetPreviewDialog (headers, sample data, validation)
    → Si OK → autoMapColumns (sin fuzzy LCS)
      → Si hay suggested/unmapped → ColumnMappingDialog (con preview de datos)
      → Si todo auto → processImport
    → Si FAIL → error claro "No se reconocen columnas"
```

## Archivos afectados

| Archivo | Acción |
|---|---|
| `src/lib/sheet-import.ts` | Endurecer matchScore, limpiar getCol, agregar validateTabContent |
| `src/components/tours/SheetPreviewDialog.tsx` | Nuevo componente |
| `src/components/tours/ColumnMappingDialog.tsx` | Agregar columna de preview de datos |
| `src/pages/Tours.tsx` | Insertar paso de preview, nuevos estados |

