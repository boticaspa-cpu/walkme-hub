

# Plan: Reporte mensual de comisiones por vendedor

## Cambio

Agregar una nueva card en `src/pages/Reportes.tsx` con:

1. **Selector de mes** — `<Select>` con los últimos 6 meses (formato "2026-03", "2026-02", etc.). Default: mes actual.

2. **Query** — Consultar `commissions` con join a `profiles` via `seller_id`, filtrado por `created_at` dentro del mes seleccionado. Agrupar por vendedor y sumar `amount_mxn`.

3. **Gráfica de barras comparativa** — BarChart horizontal con cada vendedor en el eje Y y el total de comisiones en X. Cada barra con color distinto del array COLORS existente.

4. **Resumen numérico** — Debajo de la gráfica, mostrar total general del mes y número de comisiones.

## Archivo a modificar
- `src/pages/Reportes.tsx` — Agregar state para mes, query con filtro, y nueva Card con BarChart + selector.

## Ubicación
Nueva card de ancho completo (`lg:col-span-2`) después del Funnel de Leads.

