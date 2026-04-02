

# Simplificar cobro: opción explícita Completo vs Parcial

## Problema
Cuando el operador es `on_site`, el panel de cobro parcial aparece automáticamente sin opción de hacer pago completo. Esto confunde porque a veces se quiere cobrar el total (ej: impuestos son aparte, no forman parte del split). El vendedor no tiene control.

## Solución
Agregar un toggle "Pago completo / Pago parcial" que aparece solo cuando el operador es `on_site`. Por defecto selecciona **Pago completo**. Si el vendedor elige "Parcial", entonces aparece el panel actual con depósito y balance.

## Cambios en `src/components/reservations/ReservationCheckout.tsx`

1. Agregar estado `splitMode` (`"full"` | `"partial"`) con default `"full"`
2. Cuando `isOnSite`, mostrar un selector simple (dos botones/radio) antes del panel de split:
   - **Pago completo** — cobra el total, marca como `paid`
   - **Pago parcial** — muestra los campos de depósito/balance como ahora
3. La variable `chargeAmount` usa `baseTotalMxn` cuando `splitMode === "full"`, o `parsedDeposit` cuando `splitMode === "partial"`
4. El `payment_status` en la reserva será `"paid"` si completo, `"partial"` si parcial
5. El panel azul de depósito/balance solo se muestra cuando `splitMode === "partial"`

### Resultado visual
- Por defecto: checkout limpio, sin panel de split, botón dice "Cobrar $6,085.57"
- Si elige parcial: aparece el panel con depósito/balance como ahora

