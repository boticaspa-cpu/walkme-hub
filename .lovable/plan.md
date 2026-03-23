

# Loading States & Empty States — All Main Pages

## 1. New reusable component: `src/components/ui/empty-state.tsx`

A centered, visually appealing empty state component:

```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}
```

Styled with a large muted icon (48px), bold title, subtle description, and optional primary action button. Uses the app's primary/tropical color palette.

## 2. New helper component: `src/components/ui/table-skeleton.tsx`

A reusable table skeleton that accepts `columns` (number) and `rows` (default 5) and renders animated Skeleton bars matching typical column widths.

## 3. Dashboard (`src/pages/Dashboard.tsx`)

- Wrap KPI cards grid in a loading check; show 4 Skeleton cards (same height as KpiCard) while any KPI query is loading.
- Show Skeleton blocks for the "Próximas Reservas" and "Ventas Recientes" cards while loading.

## 4. Page-by-page updates

Each page replaces the plain `<p>Cargando…</p>` and `<p>No se encontraron…</p>` with the new components:

| Page | Loading → | Empty State (icon, title, description, action) |
|---|---|---|
| **Cotizaciones** | TableSkeleton (5 cols) | FileText, "No hay cotizaciones aún", "Crea tu primera cotización", → open create dialog |
| **Reservas** | TableSkeleton (6 cols) | Calendar, "No hay reservas aún", "Crea tu primera reserva", → open create dialog |
| **Clientes** | TableSkeleton (5 cols) | Users, "No hay clientes aún", "Agrega tu primer cliente", → openCreate |
| **Tours** | Grid of 6 card Skeletons | MapPin, "No hay tours aún", "Agrega tu primer tour", → open create |
| **POS/Ventas** | TableSkeleton (5 cols) | Receipt, "No hay ventas pendientes", descriptive text |
| **Leads** | TableSkeleton (8 cols) | Users, "No hay leads aún", "Captura tu primer lead" |

## Files modified
- `src/components/ui/empty-state.tsx` (new)
- `src/components/ui/table-skeleton.tsx` (new)
- `src/pages/Dashboard.tsx`
- `src/pages/Cotizaciones.tsx`
- `src/pages/Reservas.tsx`
- `src/pages/Clientes.tsx`
- `src/pages/Tours.tsx`
- `src/pages/POS.tsx`
- `src/pages/Leads.tsx`

