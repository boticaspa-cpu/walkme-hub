

# Plan: Asesor IA basado en datos reales de la base de datos

## Problema
El asesor inventa información (ej: impuestos de Xcaret). Debe responder SOLO con datos reales del catálogo.

## Solución
Antes de cada llamada al modelo, la edge function consulta la base de datos para obtener tours, precios y paquetes reales, y los inyecta en el system prompt como contexto.

## Cambios

### `supabase/functions/sales-advisor/index.ts`

1. **Importar createClient de Supabase** para consultar la DB desde la edge function
2. **Consultar 3 tablas** antes de llamar al modelo:
   - `tours` (activos): título, precio MXN, precio USD, incluye/excluye, descripción, días
   - `tour_price_variants` (activos): tour_id, zona, nacionalidad, pax_type, sale_price, package_name
   - `tour_packages` (activos): tour_id, nombre, precio adulto/niño MXN
3. **Construir un bloque de contexto** con los datos reales en formato tabla/texto
4. **Actualizar el system prompt** con regla estricta:
   - "SOLO responde con información de los datos proporcionados abajo"
   - "Si no tienes la información, di: 'No tengo esa información en el sistema'"
   - "NUNCA inventes precios, impuestos o características de tours"
5. **Cambiar modelo** a `google/gemini-3-flash-preview` (default recomendado, más rápido)

### Estructura del prompt dinámico

```
## DATOS REALES DEL CATÁLOGO (ÚNICA fuente de verdad)
### Tours disponibles
| Tour | Precio MXN | Precio USD | Días | Incluye |
|---|---|---|---|---|
| Xcaret | 2500 | 140 | L,M,X... | Transporte, entrada... |

### Precios por zona/nacionalidad
| Tour | Zona | Nacionalidad | Adulto | Menor |
|---|---|---|---|---|
| Xcaret | Cancun | Extranjero | 2800 | 1400 |

### Paquetes
| Tour | Paquete | Adulto MXN | Menor MXN |
...
```

| Archivo | Cambio |
|---|---|
| `supabase/functions/sales-advisor/index.ts` | Consultar DB + inyectar datos reales en prompt + regla de no inventar |

