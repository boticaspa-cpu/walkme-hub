

# Plan: Activar Cotizaciones — PDF + Enviar + Conversión a Reserva

## Resumen

Activar los botones de PDF y Enviar en la tabla de cotizaciones, agregar conversión a reserva al aceptar, y conectar con leads/clientes.

## Cambios DB

### Migración: agregar `reservation_id` a `quotes`
```sql
ALTER TABLE public.quotes 
  ADD COLUMN reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL;
```

## Archivos Nuevos

### 1. `src/pages/CotizacionPDF.tsx` — Vista imprimible

Ruta standalone `/cotizaciones/:id/pdf` (fuera de AppLayout para impresión limpia).

- Fetch quote + quote_items + client + tours por id
- Layout similar a VoucherPrintView: logo WalkMe, folio, datos cliente, tabla de items (tour, pax adultos/niños, zona, nacionalidad, precio unitario, subtotal), total, notas
- Botones print:hidden: "Imprimir" (`window.print()`) y "Cerrar"
- CSS `@media print` para layout A4

### 2. `src/components/cotizaciones/SendQuoteDialog.tsx` — Modal Enviar

Dialog con:
- Si quote no tiene client_id → mostrar form inline (nombre + tel/email) → crear cliente + linkear a quote
- Si tiene client_id → fetch datos contacto (tel, email)
- Botón "WhatsApp": abre wa.me con mensaje prellenado (folio, items, total, link a PDF)
- Botón "Email": abre mailto con subject/body y link a PDF
- Al enviar → update `quotes.status = 'sent'`

### 3. `src/components/cotizaciones/AcceptQuoteDialog.tsx` — Aceptar y Crear Reserva

Dialog que se abre al cambiar status a "accepted" o botón dedicado:
- Si la cotización tiene solo 1 tour → pedir fecha de viaje (si falta) y crear reserva directamente
- Si tiene múltiples tours → crear 1 reserva por el primer tour (MVP) con nota sobre los demás
- Crear reserva: copiar client_id, tour_id, pax_adults, pax_children, zone, nationality, total_mxn, status='scheduled'
- Guardar `quotes.reservation_id`
- Redirigir a `/reservas?highlight={reservation_id}`

## Cambios en Archivos Existentes

### `src/App.tsx`
- Agregar ruta `/cotizaciones/:id/pdf` → CotizacionPDF (fuera de AppLayout)

### `src/pages/Cotizaciones.tsx`
- Botón PDF: `window.open(\`/cotizaciones/${q.id}/pdf\`, '_blank')`
- Botón Enviar: abrir SendQuoteDialog con la quote seleccionada
- Agregar botón "Aceptar" (CheckCircle) visible cuando status es draft/sent → abre AcceptQuoteDialog
- Mostrar link a reserva si `reservation_id` existe

## Flujo completo

```text
Cotización (draft) 
  → Enviar (WhatsApp/Email) → status=sent
  → Aceptar → crea Reserva → status=accepted, reservation_id guardado
  → Reserva visible en /reservas → Confirmar y Cobrar (flujo existente)
```

## Archivos

| Archivo | Acción |
|---|---|
| Migración SQL | `ADD COLUMN reservation_id` a quotes |
| `src/pages/CotizacionPDF.tsx` | Crear vista imprimible |
| `src/components/cotizaciones/SendQuoteDialog.tsx` | Crear modal enviar |
| `src/components/cotizaciones/AcceptQuoteDialog.tsx` | Crear modal aceptar → reserva |
| `src/App.tsx` | Agregar ruta PDF |
| `src/pages/Cotizaciones.tsx` | Conectar botones PDF, Enviar, Aceptar |

