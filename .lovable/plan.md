

# Fix Horizontal Scroll on Mobile Tables

## Current State
Most pages already use `hidden sm:table-cell` on secondary columns. The main gaps:
- **Cotizaciones**: All 5 columns visible on mobile (Folio, Cliente, Total, Estado, Acciones) — Folio should hide
- **Sticky actions column**: Not implemented anywhere
- **Text truncation**: Missing on long tour/client names

## Changes

### 1. Cotizaciones.tsx — Hide Folio on mobile
- Add `hidden sm:table-cell` to the Folio `<TableHead>` and `<TableCell>`
- Mobile shows: Cliente, Total, Estado, Acciones (4 columns)

### 2. All 5 pages — Sticky action column
Add `sticky right-0 bg-background` to the Actions `<TableHead>` and `<TableCell>` so action buttons are always reachable without scrolling:
- Cotizaciones, Reservas, Clientes, Leads, POS

### 3. Text truncation on long columns
Add `truncate max-w-[150px]` to tour title and client name cells across Cotizaciones, Reservas, POS to prevent wide cells.

### 4. POS.tsx — Consolidate action column header
The "Acción" column already works well. Just add sticky styling.

## Files modified
- `src/pages/Cotizaciones.tsx`
- `src/pages/Reservas.tsx`
- `src/pages/Clientes.tsx`
- `src/pages/Leads.tsx`
- `src/pages/POS.tsx`

