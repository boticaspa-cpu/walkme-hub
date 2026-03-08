

# Prioridad 1 + 2: Comisiones filtradas + Campos nuevos en Voucher/WhatsApp/PDF

## PRIORIDAD 1 — Comisiones por seller

### Problema
La query en `Comisiones.tsx` no filtra por `seller_id`. RLS ya lo maneja (policy `Auth users can read own commissions` filtra por `seller_id = auth.uid() OR admin`), pero la UI no diferencia admin vs seller en título ni muestra nombre del vendedor para admin.

### Cambios en `src/pages/Comisiones.tsx`
- Título dinámico: admin ve "Todas las Comisiones", seller ve "Mis Comisiones"
- Admin: agregar columna "Vendedor" con join a profiles (`seller_id` → `profiles.full_name`)
- Query: agregar join `profiles!seller_id(full_name)` para admin
- RLS ya filtra correctamente en DB — no se necesita `.eq()` adicional

## PRIORIDAD 2 — Campos nuevos en Voucher/WhatsApp/PDF

### Campos: `hotel_name`, `pickup_notes`, `pax_email`, `operator_confirmation_code`

### A. `src/components/reservations/VoucherPrintView.tsx`
- Agregar labels en `t.es` y `t.en`: hotel, pickupNotes, confirmationCode
- En sección Client: mostrar `pax_email` si existe
- En sección Tour Details: agregar hotel_name y pickup_notes bajo la grid existente
- En sección Folios: mostrar `operator_confirmation_code` junto a operator_folio
- Actualizar interface `VoucherProps` para incluir los 4 campos

### B. `src/components/reservations/whatsapp-message.ts`
- Agregar hotel_name, pickup_notes, operator_confirmation_code a `ReservationData` interface
- En mensaje EN y ES: insertar líneas para hotel, pickup notes y código de confirmación (solo si tienen valor)

### C. `supabase/functions/generate-voucher-pdf/index.ts`
- Los datos ya vienen del select `*` de reservations
- Agregar renders de hotel_name, pickup_notes, pax_email, operator_confirmation_code en el PDF
- Agregar labels correspondientes en ES/EN

## Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/pages/Comisiones.tsx` | Filtro visual admin/seller, columna vendedor |
| `src/components/reservations/VoucherPrintView.tsx` | 4 campos nuevos en voucher HTML |
| `src/components/reservations/whatsapp-message.ts` | 3 campos en mensaje WhatsApp |
| `supabase/functions/generate-voucher-pdf/index.ts` | 4 campos en PDF |

Zero SQL. Zero RLS changes (ya están correctas).

