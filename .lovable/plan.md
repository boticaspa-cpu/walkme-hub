

# Actualizar política de cancelación a 72 horas en todos los cupones

## Problema
Las políticas de cancelación dicen "48 horas" en los mensajes de WhatsApp y en el PDF del edge function. Deben ser **72 horas** en todos lados, consistente con lo que ya tiene el VoucherPrintView.

## Archivos a modificar

### 1. `src/components/reservations/whatsapp-message.ts`
- **Línea 78** (inglés): Cambiar "48 hours" → "72 hours"
- **Línea 137** (español): Cambiar "48 hrs" → "72 hrs"

### 2. `supabase/functions/generate-voucher-pdf/index.ts`
- **Línea 53** (defaultPolicyEs): Cambiar "48 horas" → "72 horas"
- **Línea 54** (defaultPolicyEn): Cambiar "48 hours" → "72 hours"

### 3. `src/components/reservations/VoucherPrintView.tsx`
Ya dice 72 horas — sin cambios necesarios.

### 4. `src/pages/CotizacionPDF.tsx`
La cotización tiene sus propios términos pero no menciona horas específicas de cancelación — sin cambios.

## Resumen
Solo se cambia "48" → "72" en 4 strings (2 archivos). El VoucherPrintView ya está correcto.

