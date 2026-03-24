

# Revisión completa de la app — Fallas encontradas y mejoras recomendadas

## Fallas detectadas (bugs activos)

### 1. KpiCard no soporta refs — Warning en consola
`KpiCard` es un function component sin `forwardRef`. El Dashboard le pasa refs (probablemente desde un tooltip o wrapper). Esto genera warnings repetidos en consola.
- **Fix**: Envolver `KpiCard` con `React.forwardRef`.

### 2. Dashboard: Queries admin con columnas que NO existen
Las queries de KPIs financieros del admin en `Dashboard.tsx` usan columnas inexistentes:
- Línea 94: `operator_payables` → usa `amount_mxn` y `due_date` — **no existen**. Las columnas correctas son `equivalent_mxn` y `sale_date`.
- Línea 108: `commissions` → usa `amount_mxn` — **no existe**. La columna correcta es `commission_amount`.
- Estos queries fallan silenciosamente, mostrando $0 siempre para "Pagos Prov. Pendientes" y "Comisiones del Mes".
- **Fix**: Corregir nombres de columnas para que coincidan con el schema real.

### 3. Reservas.tsx — Archivo de 1,492 líneas
Un solo archivo con casi 1,500 líneas. No es un bug pero dificulta mantenimiento y puede causar renders lentos.

## Mejoras recomendadas

### A. Seguridad
- Las queries en POS usan `(supabase as any)` — esto bypasea validación de tipos. Debería usar los tipos generados correctamente.

### B. Performance
- Dashboard hace 7+ queries paralelas al cargar. Considerar agrupar en una sola edge function o usar `Promise.all` con mejor manejo de errores.
- Reservas.tsx (1,492 líneas) debería dividirse en componentes más pequeños.

### C. UX
- No hay manejo de errores visible al usuario cuando fallan las queries de KPIs (fallan silenciosamente y muestran $0).
- Los quick-action cards del Dashboard no tienen feedback de hover en mobile.

## Plan de implementación (priorizado)

### Archivo: `src/components/dashboard/KpiCard.tsx`
- Agregar `React.forwardRef` al componente para eliminar warning de consola.

### Archivo: `src/pages/Dashboard.tsx`
- Línea 94: Cambiar `amount_mxn` → `equivalent_mxn` y `due_date` → `sale_date`
- Línea 108: Cambiar `amount_mxn` → `commission_amount`

### Sin otros cambios
Las correcciones son quirúrgicas — 2 archivos, sin riesgo de regresión.

