

# Cobro Parcial: Depósito + Balance al Operador

## Problema
Algunos operadores cobran directamente al cliente cuando aborda el tour. La agencia solo cobra su margen (depósito) y el resto (costo neto / "reporte") queda como balance pendiente que el cliente paga al operador.

## Solución

### 1. Nuevo campo en operadores: `collection_mode`
Ya existe `fee_collection_mode` con valores `agency` / `on_site`. Reutilizaremos este campo para determinar si el checkout debe mostrar el flujo de cobro parcial.

Cuando `fee_collection_mode = "on_site"`, el checkout automáticamente:
- Calcula el **costo neto** (net_cost de la variante de precio)
- Sugiere **Depósito** = Total - Costo Neto (margen de la agencia)
- Muestra **Balance** = Costo Neto (lo que paga al operador al abordar)
- Ambos campos son editables (el vendedor puede ajustar)

### 2. Cambios en `ReservationCheckout.tsx`

- Al abrir, detectar si el operador del tour tiene `fee_collection_mode = "on_site"`
- Si es así, mostrar una sección nueva con:
  - **Depósito (cobro agencia)**: campo editable, prellenado con `total - costo_neto`
  - **Balance (pago al operador)**: campo editable, prellenado con `costo_neto`
  - Indicador de moneda del balance (MXN o USD según `base_currency` del operador)
  - Nota: "El cliente pagará $X al abordar el tour"
- El botón de cobrar solo cobra el **depósito** (no el total completo)
- La venta (`sales`) registra `total_mxn = depósito` (lo que realmente cobra la agencia)
- El `cash_movement` solo refleja el depósito
- La reserva se marca como `payment_status = "partial"` en vez de `"paid"`

### 3. Nuevo campo en reservas: `deposit_mxn` y `balance_mxn`
Migración SQL para agregar:
```sql
ALTER TABLE reservations 
  ADD COLUMN deposit_mxn numeric NOT NULL DEFAULT 0,
  ADD COLUMN balance_mxn numeric NOT NULL DEFAULT 0,
  ADD COLUMN balance_currency text NOT NULL DEFAULT 'MXN';
```

Estos campos se guardan al confirmar el cobro parcial para que el voucher y reportes sepan cuánto se pagó y cuánto falta.

### 4. Cambios en el voucher/ticket
Mostrar el desglose cuando hay balance > 0:
- "Pagado (depósito): $500 MXN"
- "Pendiente al abordar: $1,000 MXN" (o USD según operador)

### 5. Ajuste de comisiones
La comisión del vendedor se calcula sobre el **depósito** (lo que cobra la agencia), no sobre el total completo — ya que el costo neto va directo al operador.

## Archivos a modificar
- **Migración SQL**: agregar `deposit_mxn`, `balance_mxn`, `balance_currency` a `reservations`
- **`src/components/reservations/ReservationCheckout.tsx`**: flujo de cobro parcial
- **`src/components/reservations/VoucherPrintView.tsx`**: mostrar desglose depósito/balance
- **`src/pages/Operadores.tsx`**: ya tiene `fee_collection_mode`, sin cambios necesarios

## Flujo del vendedor
1. Abre checkout de una reserva
2. Si el operador es "on_site", ve los campos de Depósito y Balance prellenados
3. Puede ajustar los montos si necesita cobrar un poco más o menos
4. Cobra solo el depósito
5. El voucher muestra cuánto debe pagar el cliente al operador

