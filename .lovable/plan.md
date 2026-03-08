

# Plan: Folio de Operador + Rediseno del Voucher

## Flujo entendido

```text
Cotizacion (COT-001) → Reserva (WM-001) → Operador recibe folio WM-001
  → Operador responde con su folio (ej: "XC-78432")
  → Se captura el folio del operador → Reserva CONFIRMADA
  → Voucher muestra ambos folios: WM-001 + XC-78432
  
Si se cancela:
  → Operador da folio de cancelacion (ej: "XC-CANC-123")
  → Se captura → Reserva marcada como CANCELADA
```

## Cambios en base de datos

Agregar 2 columnas a `reservations`:
- `operator_folio` (text, nullable) — folio que da el operador al confirmar
- `cancellation_folio` (text, nullable) — folio que da el operador al cancelar

## Cambios en `src/pages/Reservas.tsx`

1. **Nuevo campo en la tabla/lista**: mostrar columna "Folio Op." cuando existe
2. **En el formulario de edicion**: agregar campo "Folio del operador" — al llenarlo y guardar, cambiar `confirmation_status` a `"confirmed"` automaticamente
3. **Agregar campo "Folio de cancelacion"**: visible solo cuando status es `cancelled`
4. **Accion rapida**: boton/icono para capturar folio del operador sin abrir el editor completo (mini-dialog)

## Rediseno de `src/components/reservations/VoucherPrintView.tsx`

Reescritura completa del componente con diseno profesional:

1. **Header**: Logo grande (h-16), titulo "VOUCHER DE RESERVA" con fondo verde degradado, folio WM + folio operador en badges
2. **Secciones con tarjetas**: bordes redondeados, headers con iconos y fondo verde claro
3. **Datos del cliente**: tabla con filas alternas
4. **Detalles del tour**: tabla con zona y modalidad en badges
5. **Incluye**: grid 2 columnas con checkmarks verdes
6. **Resumen de pago**: total destacado con fondo verde
7. **Folio del operador**: prominente en el header junto al folio WM
8. **Print styles**: colores preservados en impresion

## Archivos modificados

- **Migration SQL**: agregar `operator_folio` y `cancellation_folio` a `reservations`
- **`src/pages/Reservas.tsx`**: campo folio operador en edicion + mini-dialog para captura rapida + campo cancelacion
- **`src/components/reservations/VoucherPrintView.tsx`**: rediseno completo con folio operador visible

