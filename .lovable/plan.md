

# Plan: Flujo de Apertura/Cierre de Caja

## Resumen
Implementar un sistema completo de caja (open/close) que bloquee ventas en POS sin caja abierta, registre movimientos, y permita arqueo al cierre. Se reutiliza la ruta `/cierre-diario` renombrándola internamente a "Caja".

## 1. Migración DB

Crear tablas nuevas + agregar columna a `sales`:

```sql
-- Enum for session status
CREATE TYPE public.cash_session_status AS ENUM ('open', 'closed');

-- Enum for movement types
CREATE TYPE public.cash_movement_type AS ENUM (
  'sale_cash','sale_card','sale_transfer','in_cash','out_cash','refund','withdrawal','adjustment'
);

-- cash_registers
CREATE TABLE public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Caja Principal',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
-- RLS: authenticated read, admin manage
CREATE POLICY "Auth read registers" ON public.cash_registers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage registers" ON public.cash_registers FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Seed default register
INSERT INTO public.cash_registers (name) VALUES ('Caja Principal');

-- cash_sessions
CREATE TABLE public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id uuid NOT NULL REFERENCES public.cash_registers(id),
  opened_by uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  business_date date NOT NULL DEFAULT CURRENT_DATE,
  opening_float_mxn numeric NOT NULL DEFAULT 0,
  opening_fx jsonb,
  status cash_session_status NOT NULL DEFAULT 'open',
  closed_by uuid,
  closed_at timestamptz,
  expected_cash_mxn numeric,
  counted_cash_mxn numeric,
  variance_mxn numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
-- Unique constraint: only 1 open session per register
CREATE UNIQUE INDEX uq_open_session_per_register ON public.cash_sessions (register_id) WHERE status = 'open';

-- RLS: admin full, seller see own
CREATE POLICY "Admin full sessions" ON public.cash_sessions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Seller read own sessions" ON public.cash_sessions FOR SELECT TO authenticated
  USING (opened_by = auth.uid());
CREATE POLICY "Seller insert sessions" ON public.cash_sessions FOR INSERT TO authenticated
  WITH CHECK (opened_by = auth.uid());
CREATE POLICY "Seller update own open" ON public.cash_sessions FOR UPDATE TO authenticated
  USING (opened_by = auth.uid() AND status = 'open');

-- cash_movements
CREATE TABLE public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cash_sessions(id),
  type cash_movement_type NOT NULL,
  amount_mxn numeric NOT NULL DEFAULT 0,
  amount_fx numeric,
  currency_fx text,
  reference text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full movements" ON public.cash_movements FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Seller read own movements" ON public.cash_movements FOR SELECT TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "Seller insert movements" ON public.cash_movements FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Link sales to sessions
ALTER TABLE public.sales ADD COLUMN cash_session_id uuid REFERENCES public.cash_sessions(id);
```

## 2. Custom hook: `useCashSession`

New file `src/hooks/useCashSession.ts`:
- Query for the current open `cash_session` (status='open') — returns session or null.
- Query for default `cash_register`.
- Mutation `openSession(registerId, floatMxn, fxJson, notes)` — inserts into `cash_sessions`.
- Mutation `closeSession(sessionId, countedMxn, variance, notes)` — updates session to `closed`.
- Export `activeSession`, `isSessionOpen`, `openSession`, `closeSession`.

Used by both `CierreDiario` (Caja) and `POS`.

## 3. Rewrite `CierreDiario.tsx` → Caja page

The page at `/cierre-diario` becomes the cash register management page. Sidebar label stays "Cierre Diario" (or rename to "Caja" — keeping route).

**States:**

**A) No session open today:**
- Card showing "Caja cerrada" with button "Abrir Caja"
- Modal: select register (auto-select if only one), input fondo inicial MXN, optional USD/EUR/CAD, notes. On confirm → `openSession`.

**B) Session open:**
- Status banner: "Caja Abierta" + date + time + float
- Buttons: "Ir a POS", "Entrada de Efectivo", "Salida de Efectivo"
- Movement log table (from `cash_movements` for this session)
- Summary card: totals by method (from `sales` where `cash_session_id = session.id` + movements)
- "Cerrar Caja" button → opens close wizard

**Close wizard (Dialog with 2 steps):**
- Step 1: Auto summary (sales by method, cash in/out movements, expected cash)
- Step 2: Input counted cash MXN, optional counted FX. Shows variance. If variance != 0, require notes. Confirm → `closeSession` + optionally update `daily_closings`.

**C) After close:**
- Show read-only summary of the closed session

## 4. POS gate

In `POS.tsx`:
- Import `useCashSession`
- If `!isSessionOpen`: render a blocking overlay/alert with "Necesitas abrir caja para cobrar" + button linking to `/cierre-diario`
- If session open: show a small banner at top ("Caja abierta desde {time}") with link to Caja
- On `saleMutation`: include `cash_session_id: activeSession.id` in the sales insert + create a `cash_movement` record (type based on payment method)

## 5. Compatibility with `daily_closings`

Keep `daily_closings` table untouched. When closing a session, also upsert a `daily_closings` record with the aggregated data (same as current logic). This preserves backward compatibility.

## Files changed
- **New migration SQL** — tables + RLS + seed
- **New** `src/hooks/useCashSession.ts`
- **Rewrite** `src/pages/CierreDiario.tsx` — full caja UI
- **Edit** `src/pages/POS.tsx` — gate + session linking
- **Edit** `src/components/layout/AppSidebar.tsx` — optionally rename label to "Caja"

