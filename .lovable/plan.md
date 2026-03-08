

# Plan: Corregir bloqueo de voucher y clarificar flujo

## Problema identificado

El bloqueo de voucher por **prepago pendiente al operador** es demasiado estricto. La reserva WM-001 está **confirmada y pagada** por el cliente, pero el sistema bloquea la generación de voucher porque el pago al proveedor (operator_payable) sigue en estado "pending". Esto confunde el flujo.

## Flujo correcto

```text
Cotizar → Reservar → Cobrar al cliente (POS/Reservas) → Reserva confirmada+pagada
  → Generar Voucher / Imprimir / Enviar WhatsApp ✓
  → El pago al operador es un tema FINANCIERO separado, no debe bloquear la operación
```

## Cambios propuestos

### `src/pages/Reservas.tsx`

1. **Cambiar `isPrepagoBlocked` de bloqueo duro a advertencia suave**: En lugar de `return` (bloquear), mostrar un `toast.warning` informativo pero **continuar** con la generación del voucher. El usuario ve la alerta de que falta pagar al operador, pero puede operar normalmente.

2. Modificar `handleVoucherWithCheck`, `handlePrint` y `handleSendConfirmation` para que el prepago pendiente sea solo un aviso, no un bloqueo.

**Antes:**
```typescript
if (isPrepagoBlocked(r)) {
  toast.warning("Proveedor PREPAGO pendiente...");
  return; // ← BLOQUEA
}
```

**Despues:**
```typescript
if (isPrepagoBlocked(r)) {
  toast.warning("Recuerda: el pago al proveedor (prepago) está pendiente.");
  // NO return → continúa generando el voucher
}
```

Solo se modifica 1 archivo: `src/pages/Reservas.tsx` (3 funciones: `handleVoucherWithCheck`, `handlePrint`, `handleSendConfirmation`).

