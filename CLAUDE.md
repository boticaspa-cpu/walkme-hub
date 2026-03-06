# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, port 8080)
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
npm run preview    # Preview production build
```

No test suite configured — `npm run test` is a placeholder.

## Architecture

**Stack:** React 18 + TypeScript + Vite, Supabase (Postgres + Auth + RLS), TanStack React Query, shadcn/ui (Radix UI), Tailwind CSS.

**Entry:** `src/main.tsx` → `src/App.tsx`

### Routing (`src/App.tsx`)
All authenticated routes are wrapped in `<AppLayout>` (sidebar + topbar). Public routes: `/login`, `/cotizaciones/:id/pdf`.

Protected pages: `/dashboard`, `/leads`, `/clientes`, `/tours`, `/operadores`, `/categorias`, `/destinos`, `/cotizaciones`, `/reservas`, `/calendario`, `/pos`, `/cierre-diario`, `/reportes`, `/gastos`, `/comisiones`, `/configuracion`.

### Auth (`src/contexts/AuthContext.tsx`)
- Two roles: `admin` and `seller` (from `user_roles` table)
- New users require admin approval (`profiles.approval_status = 'approved'`)
- `useAuth()` hook exposes `{ user, role, isAuthenticated, loading, login, signup, logout }`

### Database
Supabase project. Client at `src/integrations/supabase/client.ts`. Generated types at `src/integrations/supabase/types.ts`.

Key tables: `tours`, `tour_price_variants`, `reservations`, `clients`, `leads`, `sales`, `quote_items`, `profiles`, `user_roles`, `cash_sessions`, `expenses`.

Migrations: `supabase/migrations/` (run via Supabase dashboard or CLI).

### Pricing Logic (`src/lib/tour-pricing.ts`)
`computeTourPrice(tourId, zone, nationality, variants, tours, packageName?)` — resolves adult/child price with fallback chain:
1. Exact match in `tour_price_variants` by tour+zone+nationality+pax_type+package_name
2. General variant (no package_name)
3. Tour base `price_mxn` / `suggested_price_mxn`
4. USD prices × `exchange_rate_tour`

`computeTotal(adultPrice, childPrice, paxAdults, paxChildren)` — simple multiplication sum.

### UI Patterns
- **shadcn/ui** components in `src/components/ui/`
- **Responsive pattern**: forms use `grid-cols-1 sm:grid-cols-2`, dialogs use `max-h-[90dvh] overflow-y-auto`, tables hide low-priority columns with `hidden sm:table-cell`, action buttons collapse to DropdownMenu on mobile
- **Sidebar**: `collapsible="offcanvas"` — slides as drawer on mobile
- **Role-gated UI**: check `role === "admin"` (from `useAuth()`) to show/hide admin-only actions
- **Toast notifications**: `sonner` (`import { toast } from "sonner"`)
- **Data fetching**: TanStack React Query with Supabase queries; invalidate with `queryClient.invalidateQueries({ queryKey: [...] })`

### Key Components
- `src/components/layout/AppSidebar.tsx` — nav items differ by role (`adminNav` vs `sellerNav`)
- `src/components/reservations/VoucherPrintView.tsx` — bilingual (ES/EN) print voucher; cancellation policy is 48 hours
- `src/components/reservations/ReservationCheckout.tsx` — POS payment flow
- `src/components/cotizaciones/AcceptQuoteDialog.tsx` — converts quote to reservation
- `src/pages/CotizacionPDF.tsx` — public PDF view of a quote (no auth required)
- `src/hooks/useCashSession.ts` — checks for open cash session (required to use POS)
