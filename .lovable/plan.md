

# Plan: Voucher PDF, Impresión y WhatsApp para Reservas

## Contexto
Los 3 botones de acción en la tabla de Reservas (Voucher, Imprimir, WhatsApp) no tienen funcionalidad. Se necesitan dos documentos inspirados en los ejemplos de Blue Dreams: un **voucher/ticket** (para entregar al cliente e imprimir) y un **mensaje de confirmación por WhatsApp**. Ambos con branding WalkMe y soporte bilingue (ES/EN).

## Cambios

### 1. Crear `src/components/reservations/VoucherPrintView.tsx`
Componente que renderiza un voucher HTML imprimible, inspirado en el ticket de Blue Dreams:
- **Encabezado**: Logo WalkMe + "WALKME TOURS"
- **Datos del ticket**: Folio, Fecha de compra, Nombre del cliente
- **Tabla resumen**: Nombre/Name | Adultos/Adults | Menores/Minors
- **Tabla tour**: Tour | Lugar y hora de salida / Departure time | Fecha del tour / Tour date
- **Incluye/Includes**: Lista de `tour.includes` del tour (fetched from DB)
- **Total a pagar / Amount to pay**: Total MXN
- **Notas / Notes**: Notas de la reserva
- **Politicas de cancelacion** (bilingue ES/EN): Texto configurable desde `settings` (key: `cancellation_policy_es`, `cancellation_policy_en`) con fallback a texto default similar al de Blue Dreams adaptado a WalkMe
- Toggle ES/EN en la parte superior del voucher

### 2. Crear `src/components/reservations/ConfirmationMessage.tsx`
Componente helper que genera el texto de confirmación para WhatsApp:
- Formato bilingue con toggle
- Datos: Folio, Tour, Fecha, Hora, Pickup, Adultos, Menores, Total, Incluye, Politicas resumidas
- Función `buildWhatsAppMessage(reservation, lang)` que retorna el string formateado

### 3. Actualizar `src/pages/Reservas.tsx`
- Ampliar query de reservations: `clients(name, phone, email)` y `tours(title, includes, meeting_point, short_description)`
- **Botón Voucher (FileText)**: Abre Dialog con `VoucherPrintView` + botón "Imprimir/Descargar"
- **Botón Imprimir (Printer)**: Abre ventana nueva con el voucher y ejecuta `window.print()` directamente
- **Botón WhatsApp (Send)**: Construye mensaje con `buildWhatsAppMessage`, abre `https://wa.me/{phone}?text={encoded}`. Si no hay teléfono, abre sin número para que el usuario elija contacto
- Estado para voucher dialog: `voucherReservation`, `voucherLang`

### 4. Migración DB — Politicas de cancelacion default
Insertar dos registros en `settings`:
```sql
INSERT INTO settings (key, value) VALUES
  ('cancellation_policy_es', 'Cualquier cambio o cancelación...texto adaptado WalkMe...'),
  ('cancellation_policy_en', 'Any change or cancellation...texto adaptado WalkMe...')
ON CONFLICT (key) DO NOTHING;
```

### Archivos
- `src/components/reservations/VoucherPrintView.tsx` — nuevo
- `src/components/reservations/whatsapp-message.ts` — nuevo (función pura)
- `src/pages/Reservas.tsx` — conectar botones + dialog
- Migración SQL — políticas default en settings

