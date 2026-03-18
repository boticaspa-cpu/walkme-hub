

# Fix: Filtrar tours por operador Xcaret Blue Dreams y McSERI Tours

## Datos encontrados

Los tours Xcaret están distribuidos en **2 operadores**:
- **Xcaret Blue Dreams** (8 tours): Xcaret, Xcaret Plus, Xcaret de Noche, Xel-Há All Inclusive, Xel-Há Light, ATV Xperience (x2)
- **Xcaret McSERI Tours** (11 tours): Xplor Día, Xplor Fuego, Xenses, Xoximilco, Xenotes, Xichén Clásico/Deluxe, Xailing (x2), Ferry Cozumel, Fury Catamarán

El código actual busca una categoría "xcaret" que no existe. La solución es filtrar por estos dos operadores y excluir Fury Catamarán y los ATVs.

## Cambio

### `src/pages/PaquetesXcaret.tsx`

Reemplazar la lógica de filtrado por categoría con filtrado por operador:

1. **Eliminar** la query de `xcaret-categories` y la variable `xcaretCatIds`
2. **Buscar operadores** cuyo nombre contenga "blue dream" o "mcseri": query a `operators` con `.or('name.ilike.%blue dream%,name.ilike.%mcseri%')`
3. **Filtrar tours** por esos `operator_id`s con `.in("operator_id", operatorIds)`
4. **Excluir** tours con título que contenga "fury" o "ATV" usando `.not('title', 'ilike', '%fury%')` y `.not('title', 'ilike', '%atv%')`

### Archivo a modificar
- `src/pages/PaquetesXcaret.tsx` — cambiar queries de categoría → operador, excluir Fury y ATVs

