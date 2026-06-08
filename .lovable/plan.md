# Plan: Filtro de periodo unificado para toda la app

## Objetivo
Crear un componente único de filtro de periodo (`PeriodFilter`) reutilizable, con presets rápidos, navegación mes anterior/siguiente y rango personalizado, y aplicarlo en todas las pantallas con datos por fecha.

## 1. Nuevo componente `src/components/shared/PeriodFilter.tsx`

Componente controlado que expone un rango `{ from: Date, to: Date }` siempre normalizado (inicio/fin de día).

**UI compacta (una sola fila, mobile-friendly):**

```
[ ‹ ]  [ Junio 2026 ▾ ]  [ › ]   [ Hoy ▾ ]
```

- **Flechas ‹ ›**: navegan mes anterior/siguiente cuando el preset es mensual.
- **Etiqueta central**: muestra el periodo actual con formato dinámico:
  - Mes: `"Junio 2026"`
  - Día: `"8 de junio de 2026"`
  - Rango: `"Del 1 al 8 de junio de 2026"` (o con meses distintos si aplica)
  - Click abre `Popover` con calendario de rango (`react-day-picker` mode="range").
- **Selector de preset** (dropdown a la derecha):
  - Hoy
  - Esta semana (lun–dom, locale es)
  - Este mes ← default
  - Mes anterior
  - Últimos 7 días
  - Últimos 30 días
  - Este año
  - Personalizado (abre el calendario de rango)

**API:**
```ts
type Period = { from: Date; to: Date; preset: PresetKey; label: string };
<PeriodFilter value={period} onChange={setPeriod} />
```

**Hook helper** `usePeriodFilter(defaultPreset = "this_month")` que devuelve `{ period, setPeriod, fromISO, toISO }` para usar directo en queries.

**Reglas:**
- `from` = `startOfDay`, `to` = `endOfDay` (inclusivo).
- Default = mes actual.
- Flechas ‹ › solo visibles cuando `preset === "this_month" | "last_month"` (navegan mes a mes y cambian preset a "custom_month").
- Etiqueta siempre visible — el usuario sabe qué periodo está viendo.

## 2. Pantallas a actualizar

Reemplazar el filtro actual o agregarlo donde no existe:

| Pantalla | Acción |
|---|---|
| `Reportes.tsx` | Sustituir el `Select` de "últimos 6 meses" por `PeriodFilter`. Reescribir queries para usar `from`/`to` en vez de `period_month`. |
| `Reservas.tsx` | Sustituir `DateRangeFilter` por `PeriodFilter`. |
| `Cotizaciones.tsx` | Sustituir `DateRangeFilter` por `PeriodFilter`. |
| `POS.tsx` | Sustituir `DateRangeFilter` por `PeriodFilter`. |
| `Comisiones.tsx` | Agregar `PeriodFilter` filtrando por `created_at`. |
| `CierreDiario.tsx` | Agregar `PeriodFilter` filtrando por `closing_date`. |
| `Gastos.tsx` | Agregar `PeriodFilter` filtrando por `due_date` / `period_month`. |
| `Transfers.tsx` | Agregar `PeriodFilter` filtrando por `service_date`. |
| `CuentasPorPagar.tsx` | Agregar `PeriodFilter` filtrando por `sale_date`. |
| `Dashboard.tsx` | Agregar `PeriodFilter` para KPIs (hoy por defecto). |

`Gastos` seguirá usando `period_month` cuando el preset sea "este mes/mes anterior" para preservar la lógica de items mensuales; en otros casos filtra por `due_date BETWEEN from AND to`.

## 3. Detalles técnicos

- Dependencias ya presentes: `date-fns`, `react-day-picker`, `@/components/ui/popover`, `calendar`, `dropdown-menu`, `button`. No se instala nada nuevo.
- Locale `es` de `date-fns` para todas las etiquetas.
- `DateRangeFilter.tsx` queda como deprecated y se elimina al final cuando ya no haya referencias.
- Mantener la altura `h-9` y look consistente con el resto de filtros (Tailwind tokens semánticos).

## 4. UX mobile (viewport <640px)

- Flechas ‹ › y etiqueta en una fila.
- Selector de preset colapsa a icono (ícono de calendario + chevron).
- El popover de rango abre como bottom-sheet en mobile (consistente con el patrón actual del proyecto).

## 5. Entregables

1. `src/components/shared/PeriodFilter.tsx` (componente + tipos).
2. `src/hooks/usePeriodFilter.ts` (hook).
3. Refactor de las 10 pantallas listadas.
4. Eliminación de `DateRangeFilter.tsx` cuando esté sin uso.

## Fuera de alcance
- No cambia ninguna lógica de negocio, RLS, ni esquema de DB.
- No toca el cálculo de KPIs ni de comisiones — solo el rango que reciben las queries.
