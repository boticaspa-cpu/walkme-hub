

# KPIs Financieros en Reportes

## Qué se agregará
Una fila de 5 KPI cards en la parte superior de Reportes, filtradas por el mes seleccionado:

1. **Ventas del Mes** — suma de `sales.total_mxn` del mes
2. **Pagos a Operadores** — suma de `operator_payables.equivalent_mxn` pagados vs pendientes
3. **Comisiones Pagadas** — suma de `commissions.commission_amount` pagadas en el mes
4. **Gastos del Mes** — suma de `expense_items.paid_amount_mxn` del mes
5. **Utilidad Estimada** — Ventas − Pagos Operadores − Comisiones − Gastos

## Cambios técnicos

### `src/pages/Reportes.tsx`
- Mover el selector de mes arriba, junto al título, para que filtre tanto los KPIs como las gráficas
- Agregar 5 queries filtradas por `selectedMonth`:
  - `sales` filtrado por `sold_at` en rango del mes
  - `operator_payables` filtrado por `sale_date` en rango del mes
  - `commissions` filtrado por `created_at` en rango del mes (ya existe, reusar)
  - `expense_items` filtrado por `period_month`
- Renderizar 5 `KpiCard` con iconos: `DollarSign`, `Wallet`, `Percent`, `Receipt`, `TrendingUp`
- Cada KPI muestra el valor formateado en MXN y un subtítulo con contexto (ej: "12 ventas", "3 pendientes")

### Layout
```text
┌─────────────────────────────────────────────┐
│  Reportes          [Selector Mes ▼]         │
├──────┬──────┬──────┬──────┬─────────────────┤
│Ventas│Pagos │Comis.│Gasto │  Utilidad  📈   │
│ Op.  │      │      │      │                 │
├──────┴──────┴──────┴──────┴─────────────────┤
│  Gráficas existentes (sin cambio)           │
└─────────────────────────────────────────────┘
```

### Sin nuevas dependencias
Reutiliza `KpiCard` existente y las tablas ya disponibles.

