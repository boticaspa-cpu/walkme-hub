
## Diagnóstico rápido
El error viene de un mapeo demasiado rígido en `src/pages/Tours.tsx` (importación de Sheet):
- Hoy se busca `nombre` exacto para paquetes.
- Tu hoja usa encabezados como **“Nombre del paquete”**, **“Precio Público Adulto (USD)”**, etc.
- Aunque la hoja está bien, el importador no reconoce esos encabezados y termina en: *“No se encontraron paquetes…”*.

## Plan de implementación

1. **Fortalecer el parser de Sheet (CSV)**
   - Mantener parser con comillas, pero agregar:
     - detección de delimitador (`,`, `;`, tab, `|`)
     - limpieza de BOM/espacios invisibles
   - Resultado: menos fallos por formato regional.

2. **Mapeo dinámico de columnas por alias (no exact match)**
   - En `Tours.tsx`, reemplazar `getCol` rígido por un sistema de alias por campo.
   - Ejemplo para `name`:
     - `nombre`, `nombre del paquete`, `paquete`, `package name`, `nombre paquete`
   - Aplicar lo mismo para:
     - tipo de servicio
     - precio público adulto/niño-menor USD
     - costo neto adulto/niño
     - impuestos adulto/niño
     - incluye/no incluye
   - Esto cubrirá tus tabs reales como “Paquetes - Xplor dia”.

3. **Detección de fila de encabezados**
   - Escanear primeras filas para identificar la que más coincide con alias esperados.
   - Evita que falle si hay títulos o filas vacías arriba de la tabla.

4. **Parseo numérico robusto**
   - Crear helper para números con formato internacional:
     - `101.24`, `101,24`, `1,234.56`, `1.234,56`
   - Evita precios en `0` por parseo incorrecto.

5. **Errores útiles para el usuario**
   - Si faltan columnas obligatorias, mostrar:
     - cuáles faltan
     - cuáles sí detectó
   - En lugar de solo “falta columna nombre”.

6. **Cobertura en los 3 modos**
   - Aplicar misma estrategia para:
     - `generales`
     - `paquetes`
     - `matriz`
   - Así no vuelve a romperse en otras pestañas.

## Archivos a tocar
- `src/pages/Tours.tsx` (lógica principal de importación y mapeo)
- Opcional recomendado: crear util reutilizable
  - `src/lib/sheet-import.ts` (normalización, alias, parse numérico, detección de header)

## Resultado esperado
Con tu formato actual de Google Sheet (como en tu captura), el importador debe reconocer correctamente:
- **Nombre del paquete**
- **Tipo de servicio**
- **Precio Público Adulto/Menor (USD)**
- **Costo Neto Adulto/Niño**
- **Impuesto al Abordar Adulto/Niño**

y cargar paquetes sin depender de nombres exactos de columna.
