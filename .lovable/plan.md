

# Resultados de la revision del flujo + plan de limpieza

## Hallazgos

### 1. Datos de prueba inconsistentes
WM-001, WM-002, WM-003 tienen `confirmation_status: "confirmed"` sin `operator_folio` — esto fue antes del fix que separó el pago de la confirmación. Solo WM-004 tiene folio operador ("65433"). Los datos necesitan limpiarse.

### 2. POS query — comportamiento correcto
El POS filtra con `confirmation_status.eq.scheduled OR payment_status.neq.paid`. Esto muestra reservas que aún no se pagan O que aún están programadas. Después de pagar, si `confirmation_status` se queda en `scheduled`, la reserva sigue visible en POS — lo cual no es ideal ya que ya fue cobrada. **Bug**: una reserva pagada pero sin folio operador sigue apareciendo en el POS.

**Fix**: El POS debería filtrar solo `payment_status.eq.unpaid` (reservas pendientes de cobro), no incluir las que ya están pagadas.

### 3. Edge function `generate-voucher-pdf` — error 404
La función fue deployada pero retorna 404. Puede ser un problema de timing o de cache. Se necesita re-deploy y verificar.

### 4. Checkout flow — funciona correctamente
El checkout crea: sale → sale_item → cash_movement → actualiza reserva (`payment_status: "paid"`) → operator_payable → commission. Todo encadenado correctamente.

### 5. Folio operador dialog — funciona
El botón Tag abre un mini-dialog para capturar el folio, y al guardar marca `confirmation_status: "confirmed"`.

## Plan de cambios

### 1. Limpiar datos de prueba (SQL migration)
Borrar en orden correcto por dependencias:
- `commissions` (por sale_id)
- `cash_movements` (por reference)
- `sale_items` (por sale_id)
- `sales` (por reservation_id)
- `operator_payables` (por reservation_id)
- `reservation_items` (por reservation_id)
- `quote_items` (por quote_id)
- `quotes`
- `reservations`

### 2. Fix POS query
Cambiar el filtro de `POS.tsx` de:
```
.or("confirmation_status.eq.scheduled,payment_status.neq.paid")
```
a:
```
.eq("payment_status", "unpaid")
```
Para que solo muestre reservas que realmente faltan por cobrar.

### 3. Re-deploy edge function
Forzar re-deploy de `generate-voucher-pdf`.

## Archivos modificados
- **Migration SQL**: DELETE de datos de prueba
- **`src/pages/POS.tsx`**: Fix filtro de reservas pendientes (linea 31)

