

# FASE 2 — Reglas de Negocio y Operación

## 1. Card payments solo MXN

**Archivo:** `src/components/reservations/ReservationCheckout.tsx`

- Cuando `paymentMethod === "card"` o `"transfer"`, forzar `currency = "MXN"` via `useEffect`
- Ocultar el bloque de selector de divisa (solo visible para `cash`)
- En `mutationFn`, validar que si `paymentMethod !== "cash"` entonces `currency === "MXN"` — throw si no

Actualmente el selector de divisa ya está condicionado a `paymentMethod === "cash"` (línea 340), pero no hay un `useEffect` que resetee `currency` al cambiar método. Se agrega eso.

## 2. Fee de tarjeta configurable

**Archivos:** `src/pages/Configuracion.tsx`, `src/components/reservations/ReservationCheckout.tsx`

- Agregar setting `card_fee_percent` en la tabla `settings` (vía insert tool, no migration)
- En Configuración: agregar campo editable para "% Comisión tarjeta" junto a los tipos de cambio
- En ReservationCheckout: leer `card_fee_percent` de settings, cuando `paymentMethod === "card"` mostrar desglose:
  - Subtotal: X
  - Fee tarjeta (N%): Y
  - Total a cobrar: X + Y
- El fee se **suma al cliente** (el total de la venta incluye el fee)
- Guardar `total_mxn` en sale con fee incluido

## 3. Evitar cierre duplicado por fecha

**Archivo:** SQL migration + `src/pages/CierreDiario.tsx`

- Agregar `UNIQUE(closing_date, closed_by)` en `daily_closings` via migration
- En `handleClose()` (línea 194), cambiar `.insert()` a `.upsert()` con `onConflict: "closing_date,closed_by"` para que si ya existe, actualice en vez de fallar
- Esto evita duplicados sin romper cierres existentes

## 4. Campos faltantes en reservas

**Archivos:** SQL migration, `src/pages/Reservas.tsx`

Agregar 4 columnas nullable con default:
```sql
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS hotel_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pax_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS operator_confirmation_code text NOT NULL DEFAULT '';
```

En Reservas.tsx:
- **Edit mode**: agregar 4 campos al formulario (entre zona/nacionalidad y modalidad)
- **Create mode**: agregar hotel_name y pax_email en la sección "Datos del grupo" (compartidos)
- Persistir en `saveMutation` tanto en create como en edit
- `openEdit()`: cargar valores existentes al abrir

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/reservations/ReservationCheckout.tsx` | Card→MXN, fee tarjeta, desglose |
| `src/pages/Configuracion.tsx` | Campo card_fee_percent |
| `src/pages/CierreDiario.tsx` | upsert en daily_closings |
| `src/pages/Reservas.tsx` | 4 campos nuevos en formulario |
| SQL Migration 1 | UNIQUE constraint en daily_closings |
| SQL Migration 2 | 4 columnas en reservations |
| Data insert | Setting card_fee_percent inicial |

## SQL/Migraciones

```sql
-- Migration 1: unique constraint
ALTER TABLE public.daily_closings
  ADD CONSTRAINT daily_closings_date_user_unique
  UNIQUE (closing_date, closed_by);

-- Migration 2: reservation fields
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS hotel_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pax_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS operator_confirmation_code text NOT NULL DEFAULT '';
```

```sql
-- Data insert: card fee setting
INSERT INTO public.settings (key, value)
VALUES ('card_fee_percent', '3.5')
ON CONFLICT DO NOTHING;
```

