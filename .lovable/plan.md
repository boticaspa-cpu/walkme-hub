

# Plan: QR + WhatsApp + Email para Cotizaciones y Reservas

## Resumen
Agregar un tercer canal de envío (QR code) junto a WhatsApp y Email, tanto en el diálogo de envío de cotizaciones como en las acciones de confirmación de reservas. El QR contendrá la URL del PDF/voucher para que el cliente lo escanee directamente.

## Cambios

### 1. Instalar librería QR
Usar `qrcode.react` para generar QR codes en el navegador (no requiere backend).

### 2. `src/components/cotizaciones/SendQuoteDialog.tsx`
- Agregar un tercer botón "Mostrar QR" en el grid (cambiar a `grid-cols-3`)
- Al hacer click, mostrar el QR code generado con la URL del PDF (`/cotizaciones/:id/pdf`)
- El QR se muestra inline debajo de los botones con opción de descargarlo como imagen
- Marcar como "sent" al mostrar el QR

### 3. `src/components/reservations/SendConfirmationDialog.tsx` (nuevo)
- Crear un diálogo reutilizable similar a `SendQuoteDialog` pero para reservas
- Recibe la reservación, construye el mensaje de confirmación usando `buildWhatsAppMessage`
- 3 opciones: WhatsApp, Email, QR
- El QR apunta a una URL pública del voucher (reutilizar la ruta existente o generar una URL con los datos)
- Para el QR de reservas, generar URL con el folio/datos de la reserva

### 4. `src/pages/Reservas.tsx`
- Reemplazar el `handleWhatsApp` directo por abrir el nuevo `SendConfirmationDialog`
- El botón de Send ahora abre el diálogo con las 3 opciones
- Mantener la lógica de prepago blocking

### 5. Componente compartido `src/components/shared/QRCodeDisplay.tsx`
- Componente reutilizable que muestra un QR con la URL proporcionada
- Botón para descargar el QR como imagen PNG
- Texto descriptivo: "El cliente puede escanear este código"

## UI resultante

```text
┌─────────────────────────────────────┐
│  Enviar Cotización / Confirmación   │
│  Folio: WM-001 — $5,000.00 MXN     │
│                                     │
│  Para: Juan Pérez · +52...          │
│                                     │
│  [Vista previa del mensaje]         │
│                                     │
│  ┌──────────┬──────────┬──────────┐ │
│  │ WhatsApp │  Email   │ Código   │ │
│  │    📱    │   ✉️     │   QR 📷  │ │
│  └──────────┴──────────┴──────────┘ │
│                                     │
│  (si se clickea QR:)                │
│  ┌─────────────┐                    │
│  │  ██ QR ██   │  ← Escanea aquí   │
│  │  ██████████ │                    │
│  └─────────────┘                    │
│  [Descargar QR]                     │
└─────────────────────────────────────┘
```

| Archivo | Cambio |
|---|---|
| `package.json` | Agregar `qrcode.react` |
| `src/components/shared/QRCodeDisplay.tsx` | Nuevo: componente QR reutilizable |
| `src/components/cotizaciones/SendQuoteDialog.tsx` | Agregar botón QR como tercera opción |
| `src/components/reservations/SendConfirmationDialog.tsx` | Nuevo: diálogo de envío para reservas |
| `src/pages/Reservas.tsx` | Usar SendConfirmationDialog en vez de handleWhatsApp directo |

