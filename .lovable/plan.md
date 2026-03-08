

# Plan: Paso intermedio de mapeo de columnas con sugerencias

## Problema
Cuando el Sheet tiene encabezados que no coinciden con los alias conocidos, el importador simplemente los ignora. El usuario quiere que el sistema le muestre las columnas no reconocidas y le sugiera campos similares para confirmar manualmente.

## Solución

Agregar un paso intermedio entre la carga del CSV y el procesamiento de datos: un **diálogo de mapeo de columnas** donde el usuario puede revisar y corregir las asignaciones.

### Flujo nuevo
1. Usuario pega URL y pestaña → se descarga el CSV
2. Se auto-mapean las columnas que coinciden con alias
3. Las columnas **no mapeadas** se muestran con sugerencias de campos similares (fuzzy match por similitud de texto)
4. El usuario confirma/ajusta el mapeo en un diálogo intermedio
5. Se procesan los datos con el mapeo final

### Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| `src/components/tours/ColumnMappingDialog.tsx` | **Nuevo** — Diálogo que muestra columnas del Sheet vs campos del sistema, con sugerencias fuzzy y selects para reasignar |
| `src/lib/sheet-import.ts` | Agregar función `autoMapColumns` que retorna `{ mapped, unmapped }` y función `fuzzyMatch` para sugerir campos parecidos |
| `src/pages/Tours.tsx` | Dividir `handleSheetImport` en 2 pasos: (1) cargar CSV + mostrar mapeo, (2) procesar con mapeo confirmado |

### Detalle del `ColumnMappingDialog`
- Tabla con 3 columnas: **Columna del Sheet** | **Campo asignado** (Select con opciones del sistema) | **Estado** (auto/manual/ignorar)
- Las columnas auto-mapeadas aparecen con badge verde "Auto"
- Las no mapeadas muestran un Select con la sugerencia más cercana pre-seleccionada
- Botón "Importar con este mapeo" para confirmar

### Detalle de `fuzzyMatch`
- Comparar `normKey(header)` contra todos los alias normalizados
- Usar distancia de subcadena: si el header contiene o es contenido por un alias, sugerirlo
- Ordenar sugerencias por relevancia (coincidencia parcial más larga primero)

### Ejemplo visual

```text
┌─────────────────────────────────────────────────┐
│  Mapeo de Columnas                              │
├───────────────────┬──────────────────┬──────────┤
│ Columna Sheet     │ Campo asignado   │ Estado   │
├───────────────────┼──────────────────┼──────────┤
│ Nombre del tour   │ [Nombre      ▾]  │ ● Auto   │
│ Precio Pub. Ad.   │ [Precio Ad.  ▾]  │ ● Auto   │
│ Comision agencia  │ [— Ignorar — ▾]  │ ○ Manual │
│ Costo NET adulto  │ [Costo Ad.?  ▾]  │ ◐ Suger. │
└───────────────────┴──────────────────┴──────────┘
         [Cancelar]              [Importar con este mapeo]
```

