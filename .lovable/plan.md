

# Mostrar impuestos (tax) en la ficha/card del tour

## Problema
Las tarjetas de tour en el grid solo muestran el precio MXN, pero no indican si hay impuestos USD adicionales que el cliente debe pagar en destino. Esto genera confusión al cotizar.

## Cambio

**Archivo:** `src/pages/Tours.tsx` — en la sección de la card (líneas ~1178-1179)

Debajo del precio MXN, agregar una línea sutil y visual que muestre los impuestos USD cuando existan (`tax_adult_usd > 0` o `tax_child_usd > 0`):

- Un small badge/pill con icono de `DollarSign` y texto como: `+ Tax: $15 USD adulto · $10 USD menor`
- Estilo: texto `text-[10px]` en color `text-amber-600` con fondo `bg-amber-50` para que destaque visualmente sin ser invasivo
- Solo se muestra cuando alguno de los valores de tax es mayor a 0

Resultado visual aproximado en la card:
```text
┌─────────────────────────────┐
│  [imagen]                   │
│  Título del Tour   [badges] │
│  Descripción breve...       │
│  📍 Operador  🕐 5 días/sem │
│  $2,500 MXN                 │
│  💲 + Tax: $15 adulto · $10 │
│     menor (pago en destino) │
│            [categoría] [sw] │
└─────────────────────────────┘
```

Solo se toca un archivo, ~5 líneas nuevas insertadas después de la línea del precio.

