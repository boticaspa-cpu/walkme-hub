

# Potenciar al Asesor IA con datos de Reporte, Promociones y Estrategia de Negocio

## Resumen
Ampliar la base de conocimiento de Walkito para que pueda: dar el precio "reporte" (costo neto) cuando se lo pregunten, conocer las promociones activas (incluyendo Xcaret 20%), aconsejar sobre armado de paquetes para familias, y dar consejos estratégicos de venta.

## Cambios en `supabase/functions/sales-advisor/index.ts`

### 1. Agregar `net_cost` a la consulta de variantes
Actualmente solo trae `sale_price`. Agregar `net_cost` para que Walkito pueda informar el "reporte" cuando un vendedor o admin pregunte.

### 2. Agregar consulta de promociones
Fetch de las tablas `promotions` y `promotion_tours` para que Walkito conozca las ofertas activas (ej. "20% en 2+ tours Xcaret").

### 3. Agregar consulta de paquetes promocionales Xcaret
Fetch de `promo_packages` y `promo_package_tours` para incluir los combos Xcaret disponibles.

### 4. Agregar `cost_adult_usd` y `cost_child_usd` a la consulta de `tour_packages`
Para que Walkito pueda dar el reporte de paquetes también.

### 5. Enriquecer el system prompt con contexto estratégico

Agregar secciones nuevas al prompt:

- **Reporte (Costo Neto)**: "Cuando pregunten por el 'reporte' de un tour, consulta la columna net_cost en variantes o cost_adult_usd/cost_child_usd en paquetes. Compártelo sin problema — es información interna para el equipo."

- **Estrategia para Familias (4-6 pax)**: Instrucciones para que Walkito sugiera combos familiares, priorice tours family-friendly, y use argumentos como "los niños entran a menor precio", "transporte incluido = comodidad para la familia".

- **Armado de Paquetes**: Guía para que sugiera combinar 2-3 tours populares con descuento. Ejemplo: "Xcaret + Xel-Há = 20% off, ideal para 5 días en Riviera Maya."

- **Promociones Activas**: Walkito debe mencionar proactivamente las promos cuando sean relevantes: "¡Hay 20% en 2+ tours Xcaret! Perfecto para esta familia."

- **Consejos de Negocio**: Tips como priorizar volumen sobre margen, buscar grupos/familias, ofrecer combos, y usar urgencia real ("la promo vence pronto").

### 6. Aumentar `max_tokens` de 400 a 600
Para permitir respuestas un poco más completas cuando se pidan datos de reporte o sugerencias de paquetes.

## Datos que se agregan al contexto dinámico

```text
### Reporte (Costos internos)
| Tour | Zona | Nacionalidad | Tipo | Reporte | Precio Venta |

### Reporte de Paquetes
| Tour | Paquete | Reporte Adulto USD | Reporte Menor USD |

### Promociones Activas
| Promoción | Descuento | Tours incluidos |

### Paquetes Xcaret
| Combo | Adulto USD | Menor USD | Tours |
```

## Lo que NO cambia
- El widget de chat (FloatingChatWidget.tsx) no necesita modificaciones
- La base de datos no necesita cambios
- El formato de respuesta de Walkito sigue siendo corto y con energía

