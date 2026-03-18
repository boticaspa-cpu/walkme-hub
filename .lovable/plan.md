

# Filtrar solo tours "Con Transporte" en Paquetes Xcaret

## Problema
La lista de tours muestra también los de tipo "Solo Entrada" (`entry_only`) y el Fury Catamarán. La promo de paquetes Xcaret solo aplica para tours con transporte (`with_transport`), no entradas sueltas.

## Cambio

### `src/pages/PaquetesXcaret.tsx` (línea 117)
Agregar un filtro `.eq("service_type", "with_transport")` a la query de tours. Esto:
- Excluye automáticamente todas las entradas (`entry_only`)
- Mantiene los filtros existentes que ya excluyen Fury y ATV
- Solo muestra tours con transporte de los operadores Blue Dreams y McSERI

Es un cambio de 1 línea en la query existente.

