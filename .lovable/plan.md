

# Corrección FASE 2 — Fee de tarjeta como costo interno

## Problema actual
El fee de tarjeta se suma al `totalMxn` cobrado al cliente. Incorrecto: el precio ya incluye el margen de tarjeta absorbido por la agencia.

## Regla correcta
- Cliente paga siempre `baseTotalMxn` (sin recargo)
- El fee de tarjeta es un costo operativo interno
- Solo impacta el cálculo de utilidad → comisión del vendedor
- `profit = sale - netCost - taxFee - cardFee`

## Cambios en `src/components/reservations/ReservationCheckout.tsx`

### Lógica (líneas 109-112)
```
// ANTES:
cardFeeAmount = paymentMethod === "card" ? Math.round(baseTotalMxn * cardFeePercent) / 100 : 0;
totalMxn = baseTotalMxn + cardFeeAmount;

// DESPUÉS:
cardFeeAmount = paymentMethod === "card" ? Math.round(baseTotalMxn * cardFeePercent) / 100 : 0;
totalMxn = baseTotalMxn;  // cliente NO paga recargo
```

### Sale insert (línea 136)
`total_mxn: baseTotalMxn` (ya no `totalMxn` con fee)

### Cash movement (línea 160)
`amount_mxn: baseTotalMxn` (el movimiento refleja lo cobrado al cliente)

### Comisión (línea 257)
```
// ANTES:
profit = max(0, baseTotalMxn - totalNetCost - totalTaxFee)

// DESPUÉS:
profit = max(0, baseTotalMxn - totalNetCost - totalTaxFee - cardFeeAmount)
```

### UI (líneas 337-358)
Eliminar el bloque de desglose de fee. Solo mostrar el total simple siempre. Opcionalmente, si `paymentMethod === "card"`, mostrar una nota discreta: "Incluye absorción de comisión tarjeta ({cardFeePercent}%)".

## Cómo queda el cálculo

| Método | Total cobrado | Fee interno | Utilidad comisionable |
|---|---|---|---|
| Cash | baseTotalMxn | 0 | sale - netCost - taxFee |
| Card | baseTotalMxn | baseTotalMxn × N% | sale - netCost - taxFee - cardFee |
| Transfer | baseTotalMxn | 0 | sale - netCost - taxFee |

## Archivos
Solo `src/components/reservations/ReservationCheckout.tsx`. Cero SQL. Cero otros archivos.

