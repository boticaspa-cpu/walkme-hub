

# Plan: Módulo de Gastos (Admin Only)

## 1. Migración DB

### Enums + Tablas
```sql
CREATE TYPE public.expense_type AS ENUM ('fixed', 'variable');
CREATE TYPE public.expense_frequency AS ENUM ('monthly', 'one_time');
CREATE TYPE public.expense_status AS ENUM ('planned', 'paid');
CREATE TYPE public.expense_payment_method AS ENUM ('cash', 'bank_transfer', 'card', 'other');

-- expense_concepts
CREATE TABLE public.expense_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  expense_type expense_type NOT NULL DEFAULT 'fixed',
  frequency expense_frequency NOT NULL DEFAULT 'monthly',
  default_due_day int,
  default_due_date date,
  estimated_amount_mxn numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- expense_items
CREATE TABLE public.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id uuid NOT NULL REFERENCES public.expense_concepts(id),
  period_month text NOT NULL,
  due_date date NOT NULL,
  estimated_amount_mxn numeric NOT NULL DEFAULT 0,
  status expense_status NOT NULL DEFAULT 'planned',
  paid_amount_mxn numeric,
  paid_at timestamptz,
  payment_method expense_payment_method,
  reference text,
  proof_image_path text,
  proof_image_url text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for monthly concepts
CREATE UNIQUE INDEX uq_monthly_concept_period 
  ON public.expense_items (concept_id, period_month);
```

### RLS — Admin only (both tables)
```sql
ALTER TABLE public.expense_concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full concepts" ON public.expense_concepts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full items" ON public.expense_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Storage bucket
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-proofs', 'expense-proofs', false);
-- RLS: admin only upload/read
CREATE POLICY "Admin upload proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expense-proofs' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin read proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'expense-proofs' AND has_role(auth.uid(), 'admin'));
```

## 2. Pages

### `src/pages/Gastos.tsx`
Single page with 3 tabs (using shadcn Tabs): **Conceptos**, **Mes**, **Reportes**.

**Tab Conceptos** — follows Destinos pattern:
- Card list with name, category, type badge (fijo/variable), frequency, due day, estimated amount, active toggle
- Dialog for create/edit concept

**Tab Mes** — month selector + auto-generation:
- On month select, query `expense_items` for that `period_month`
- For each active monthly concept without an item → insert planned item (client-side upsert)
- Table: Concepto, Categoría, Tipo, Vence, Estimado, Pagado, Status, Acciones
- "Marcar Pagado" button → Dialog with: monto pagado, fecha, método, referencia, upload comprobante
- Image upload uses `supabase.storage.from('expense-proofs').upload()`

**Tab Reportes** — date range selector (last 6/12 months):
- Bar chart: total expenses per month (recharts BarChart)
- Stacked bar: fixed vs variable per month
- Pie/donut: distribution by category for selected month
- Summary cards: Total, Fijos, Variables

## 3. Routing + Navigation

- **App.tsx**: Add `<Route path="/gastos" element={<Gastos />} />`
- **AppSidebar.tsx**: Add `{ title: "Gastos", url: "/gastos", icon: Receipt }` to `adminNav` only (not sellerNav) — positioned after "Reportes"

## 4. Files Changed

| File | Action |
|---|---|
| Migration SQL | New tables + enums + storage bucket + RLS |
| `src/pages/Gastos.tsx` | **New** — 3-tab page (Conceptos, Mes, Reportes) |
| `src/App.tsx` | Add route `/gastos` |
| `src/components/layout/AppSidebar.tsx` | Add "Gastos" to adminNav |

