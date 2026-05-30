
# Sección Transfers

## Objetivo
Página dedicada para registrar transfers (traslados) con captura manual de datos. Sin tabulador de precios — el vendedor escribe el monto a mano.

## Datos a capturar por transfer
- Fecha del servicio
- Hora (pickup)
- Número de pax (adultos / niños o total)
- Origen (texto libre, p. ej. "Aeropuerto CUN")
- Destino (texto libre, p. ej. "Hotel Riu Cancún")
- Tipo de vehículo (select: Sedán, SUV, Van, Sprinter, Bus, Otro)
- Hotel + número de habitación
- Teléfono del pax
- Email del pax
- Nombre del pax / cliente
- Precio MXN (input manual)
- Moneda (MXN/USD) + tipo de cambio si USD
- Operador (opcional, select de `operators`)
- Notas / vuelo / referencia
- Estado: programado, confirmado, completado, cancelado
- Pagado: sí/no, método de pago

## Cambios de base de datos
Nueva tabla `public.transfers`:
- `id`, `folio` (auto TRF-001), `created_by`, `created_at`, `updated_at`
- `client_name`, `client_phone`, `client_email`
- `service_date`, `pickup_time`
- `pax_adults`, `pax_children`
- `origin`, `destination`
- `vehicle_type`
- `hotel_name`, `room_number`
- `flight_info` (notas/vuelo)
- `operator_id` (nullable)
- `price_mxn`, `currency`, `exchange_rate`
- `payment_status` ('unpaid'|'paid'), `payment_method`
- `status` ('scheduled'|'confirmed'|'completed'|'cancelled')
- `notes`

GRANTs + RLS:
- Sellers: ven y editan los propios (`created_by = auth.uid()`); insertan libremente
- Admin: acceso total
- Trigger de folio (extender `generate_folio` para prefijo `TRF`) y trigger `update_updated_at_column`

## Cambios de UI
1. **Ruta nueva** `/transfers` en `src/App.tsx` (lazy).
2. **Sidebar** (`AppSidebar.tsx`): item "Transfers" con icono `Car` para admin y seller.
3. **Página `src/pages/Transfers.tsx`**:
   - Header con buscador, filtro por fecha y estado, botón "Nuevo transfer"
   - Tabla responsive: Folio, Fecha/Hora, Pax, Origen → Destino, Vehículo, Cliente, Precio, Estado, Pagado, Acciones
   - Mobile: oculta columnas secundarias, acciones en DropdownMenu
4. **Dialog `TransferDialog`** (crear/editar):
   - Form con `react-hook-form` + `zod`
   - Layout `grid-cols-1 sm:grid-cols-2`
   - Validaciones: campos obligatorios (fecha, origen, destino, pax, precio, cliente, teléfono), email opcional con formato, precio > 0
5. **Detalle / voucher simple**: vista de impresión opcional reutilizando el estilo de `VoucherPrintView` (fase 2, no incluida en este plan inicial).

## Reglas
- Precio 100% manual (sin cálculo automático).
- Sin integración con cotizaciones, POS, comisiones ni cuentas por pagar en esta primera entrega — solo registro operativo.
- Folio independiente con prefijo `TRF-`.

## Verificación
- Crear transfer como seller → aparece en la lista, no visible para otro seller.
- Admin ve todos.
- Editar precio y estado funciona.
- Mobile: tabla scrollea y dialog cabe.
