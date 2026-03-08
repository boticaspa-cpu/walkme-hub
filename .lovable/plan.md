

# Plan: QR que descarga PDF directamente

## Problema actual
El QR apunta a `/cotizaciones/:id/pdf`, una pagina web dentro de la app de Lovable. Al escanear, el cliente ve una pagina web en lugar de recibir un PDF descargable.

## Solucion

Crear una **backend function** que genera un PDF real del voucher y lo retorna como archivo descargable. El QR apuntara a esta funcion, asi al escanear se descarga el PDF directamente.

## Cambios

### 1. Nueva edge function `generate-voucher-pdf`
- Recibe el `id` de la reservacion como query param
- Consulta los datos de la reservacion, cliente y tour desde la base de datos
- Genera un PDF usando **jsPDF** (compatible con Deno) con el mismo diseno del voucher: logo, datos del cliente, tour, pago, politicas
- Retorna el PDF con headers `Content-Type: application/pdf` y `Content-Disposition: inline` para que el navegador lo muestre/descargue

### 2. Actualizar `SendConfirmationDialog.tsx`
- Cambiar `voucherUrl` de la ruta web a la URL de la edge function:
  ```
  ${SUPABASE_URL}/functions/v1/generate-voucher-pdf?id=${r.id}
  ```

### 3. Actualizar `QRCodeDisplay.tsx`
- Sin cambios estructurales, solo recibe la nueva URL

## Detalle tecnico de la edge function

- Usa `jsPDF` importado desde esm.sh (compatible con Deno)
- Consulta `reservations` con join a `clients` y `tours`
- Construye el PDF programaticamente: header con texto "WALKME TOURS", datos en tabla, total destacado, politicas al pie
- El logo se embebe como base64 o se omite para simplificar (texto "WALKME TOURS" prominente como alternativa)
- No requiere autenticacion (es publico, igual que la ruta `/cotizaciones/:id/pdf` actual)

## Archivos

- **Nuevo**: `supabase/functions/generate-voucher-pdf/index.ts`
- **Modificado**: `src/components/reservations/SendConfirmationDialog.tsx` (cambiar URL del QR)

