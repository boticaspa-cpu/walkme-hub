

# Plan: Impuestos "Con" o "Sin" al generar voucher

## Problema
Algunos operadores no permiten que WalkMe cobre los impuestos/fees — el turista los paga directamente al abordar en efectivo. Actualmente siempre se incluyen en el total. Se necesita una opción simple al momento de generar el voucher.

## Solución
Cuando el usuario abre el voucher de una reserva cuyo tour tiene `tax_adult_usd > 0` o `tax_child_usd > 0` o `mandatory_fees_usd > 0`, mostrar un toggle **"¿Impuestos incluidos?"** arriba del voucher:
- **Con impuestos** (default): el total no cambia, comportamiento actual
- **Sin impuestos**: se restan los fees del total mostrado y se agrega una nota destacada en el voucher: *"⚠️ IMPORTANTE: Impuesto de $X USD por persona se paga al abordar en efectivo / IMPORTANT: $X USD fee per person payable at boarding in cash"*

No se necesita migración de base de datos. Es solo UI al momento de ver/imprimir el voucher.

## Cambios

### 1. `src/pages/Reservas.tsx`
- Agregar al query de tours: `mandatory_fees_usd`
- En `enrichWithPrices`, calcular y adjuntar `tax_fees_per_adult_usd` y `tax_fees_per_child_usd` al objeto de reserva
- Agregar state `taxIncluded` (boolean, default true)
- Antes de pasar la reserva al `VoucherPrintView`, si `!taxIncluded`, recalcular `total_mxn` excluyendo taxes/fees y pasar prop `onSiteFees`
- Mostrar un Switch "¿Impuestos incluidos?" dentro del voucher dialog, solo visible si el tour tiene fees > 0
- Pasar `taxIncluded` al `handlePrint` y `handleWhatsApp` para consistencia

### 2. `src/components/reservations/VoucherPrintView.tsx`
- Agregar prop opcional `onSiteFees?: { amountPerAdult: number; amountPerChild: number; currency: string }`
- Si `onSiteFees` está presente, mostrar sección destacada bilingüe:
  - ES: "⚠️ IMPORTANTE: Impuesto de $X USD por adulto / $Y USD por menor se paga al abordar en efectivo"
  - EN: "⚠️ IMPORTANT: Fee of $X USD per adult / $Y USD per child payable at boarding in cash"

### 3. `src/components/reservations/whatsapp-message.ts`
- Agregar param opcional `onSiteFees` al `buildWhatsAppMessage`
- Si presente, agregar línea: "💵 Impuesto de $X USD por persona — se paga al abordar en efectivo"

### UI en el dialog de voucher
```text
┌─────────────────────────────────────────┐
│ Voucher — WM-042                        │
│                                         │
│  ┌──────────────────────────────┐       │
│  │ ¿Impuestos incluidos?  [ON] │       │
│  │ Si desactivas, el cliente    │       │
│  │ los paga al abordar en       │       │
│  │ efectivo.                    │       │
│  └──────────────────────────────┘       │
│                                         │
│  [ Voucher content... ]                 │
│                                         │
│        [Cerrar]  [Imprimir]             │
└─────────────────────────────────────────┘
```

