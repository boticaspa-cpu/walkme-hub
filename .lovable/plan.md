

# Plan: Reemplazar aviso amarillo con Switch en formulario de Tour

## Problema
El formulario de tours muestra campos de impuestos con un aviso amarillo pasivo. El usuario quiere un **Switch interactivo** que muestre claramente si los impuestos se cobran en la agencia o al abordar.

## Cambios

### `src/pages/Tours.tsx`
- Reemplazar el bloque amarillo de aviso por un **Switch** con label "¿Impuestos se pagan al abordar?"
- Cuando el switch está **OFF** (agencia cobra): los campos de tax_adult_usd y tax_child_usd se ocultan (no aplican, se cobran como parte del precio)
- Cuando el switch está **ON** (pago al abordar): se muestran los campos de tax_adult_usd y tax_child_usd para capturar los montos
- Al abrir el diálogo de edición, pre-seleccionar el switch basado en si el tour ya tiene taxes > 0
- Texto descriptivo debajo del switch: "Activado = el cliente paga impuestos en efectivo al abordar"

### UI resultante
```text
┌──────────────────────────────────────────┐
│  ¿Impuestos al abordar?         [OFF]   │
│  El cliente paga impuestos en            │
│  efectivo al abordar                     │
│                                          │
│  (si ON, aparecen:)                      │
│  Impuesto Adulto USD  [___]              │
│  Impuesto Niño USD    [___]              │
└──────────────────────────────────────────┘
```

No requiere migración DB. Solo cambio de UI en Tours.tsx.

| Archivo | Cambio |
|---|---|
| `src/pages/Tours.tsx` | Switch + mostrar/ocultar campos de impuestos |

