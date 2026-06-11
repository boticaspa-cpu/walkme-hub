# Auditoría — Filtros por periodo

Solo diagnóstico. No se modifica nada hasta tu aprobación.

## 1. Componente actual

- `src/components/shared/PeriodFilter.tsx` — bien construido: presets (Hoy, Semana, Mes, Mes anterior, Últimos 7/30, Año, Personalizado), navegación `‹ ›` entre meses, popover de rango. Default = `this_month`. Reglas `startOfDay` / `endOfDay` correctas.
- `src/hooks/usePeriodFilter.ts` — expone `period`, `setPeriod`, `fromISO`, `toISO`, `fromDate`, `toDate`. Reutilizable.
- `src/components/shared/DateRangeFilter.tsx` — legacy, ya no se usa en ninguna pantalla. Candidato a eliminar.

## 2. Estado por pantalla

| Pantalla | ¿Usa PeriodFilter? | Campo de fecha | Estado |
|---|---|---|---|
| Reservas | Sí | `reservation_date` (cliente) | Filtra en memoria, no en query — OK funcional, pero pierde reservas fuera de página si crecen los datos |
| POS | Sí | `reservation_date` (cliente) | Filtra reservas pendientes en memoria. **Ambigüedad**: no se aclara al usuario si es fecha del tour |
| Cierre Diario | No | `sold_at`, `paid_at`, `created_at`, `closing_date` | Tiene su propio selector Día/Semana/Mes (tabs). **Correcto que sea distinto** (operación del día). Pero mezcla criterios (commissions/expenses fijos a "hoy", sales por periodo) |
| Reportes | Sí | sales `sold_at`, payables `sale_date`, commissions `created_at`, expenses `due_date` | OK, filtro real en query |
| Gastos | **No** (usa su propio `monthOptions` + `period_month`) | `period_month` (texto YYYY-MM) | Inconsistente con el resto. Es la fuente principal del "se ve raro" |
| Cuentas por Pagar | **No** | ninguno — muestra todo | Falta totalmente. Origen de "se ve raro" |
| Comisiones | Sí | `created_at` (filtro en memoria) + cálculos KPI usan `monthStart/monthEnd` hardcoded | KPIs no respetan el `PeriodFilter` seleccionado |
| Dashboard | **No** (hardcoded "hoy" + "mes actual") | varios | Intencional (vista operativa). Solo agregar etiqueta del mes |

## 3. Causas de "datos raros"

1. **Gastos** usa `period_month` (string `YYYY-MM`) y un dropdown propio → no se sincroniza con el resto y "Junio 2026" en Reportes no muestra los mismos números que Gastos.
2. **Cuentas por Pagar** no filtra por periodo → muestra histórico completo, parece "inflado".
3. **Comisiones**: las tarjetas KPI ("pagado este mes", etc.) están calculadas con `monthStart/monthEnd` fijos al mes calendario actual, ignoran el `PeriodFilter` del usuario.
4. **Reservas / POS** filtran en memoria sobre los registros ya traídos (sin paginar). Si crece la BD verán datos truncados.
5. **POS** no indica al usuario si filtra por fecha del tour o de pago → confusión.
6. **Cierre Diario** mezcla rangos: sales por periodo Día/Semana/Mes, pero commissions y expenses siempre "hoy". Inconsistente dentro de la misma pantalla.

## 4. Cambios recomendados (en fases, sin tocar BD)

### Fase A — Unificación crítica (alto impacto, bajo riesgo)
- **Gastos** (`src/pages/Gastos.tsx`): reemplazar `monthOptions`/`period_month` dropdown por `PeriodFilter`. Para presets mensuales seguir filtrando por `period_month` (derivar del `period.from`). Para rangos personalizados filtrar por `due_date BETWEEN from AND to`. Exponer KPIs claros: Estimado, Pagado, Pendiente, Vencido del periodo.
- **Cuentas por Pagar** (`src/pages/CuentasPorPagar.tsx`): agregar `PeriodFilter` filtrando por `due_date` (o `service_date`). KPIs: Pendiente, Pagado, Vencido. Mostrar etiqueta del mes actual.

### Fase B — Coherencia de KPIs
- **Comisiones**: recalcular tarjetas KPI usando `period.from/to` en lugar de `monthStart/monthEnd` hardcoded.
- **POS**: añadir leyenda "Filtrando por fecha del tour" debajo del filtro para quitar ambigüedad.

### Fase C — Robustez (opcional)
- **Reservas / POS**: mover el filtro de memoria a query Supabase (`.gte("reservation_date", fromDate).lte("reservation_date", toDate)`) para escalar.
- **Cierre Diario**: dejar como está (operación diaria), pero hacer que las queries de commissions y expenses de la tarjeta superior usen también el rango Día/Semana/Mes del tab activo en lugar de "hoy" fijo.
- **Dashboard**: agregar etiqueta visible del mes actual (sin filtro interactivo) para alinear lenguaje.
- Eliminar `src/components/shared/DateRangeFilter.tsx` (huérfano).

## 5. Archivos que se tocarían

- `src/pages/Gastos.tsx` (Fase A)
- `src/pages/CuentasPorPagar.tsx` (Fase A)
- `src/pages/Comisiones.tsx` (Fase B)
- `src/pages/POS.tsx` (Fase B — solo etiqueta)
- `src/pages/Reservas.tsx` (Fase C)
- `src/pages/POS.tsx` (Fase C)
- `src/pages/CierreDiario.tsx` (Fase C)
- `src/pages/Dashboard.tsx` (Fase C, opcional)
- `src/components/shared/DateRangeFilter.tsx` (eliminar, Fase C)

## 6. Riesgos / lo que NO se tocaría

- **No se modifica BD**: Gastos seguirá usando la columna `period_month` para presets mensuales. Solo cambia el control visual y la lógica de rangos personalizados.
- **No se borran datos** en ningún caso.
- **Cierre Diario** mantiene su lógica diaria/semanal/mensual propia (no se reemplaza por PeriodFilter completo), porque es operación de día.
- **Dashboard** no recibe filtro interactivo para no romper la "vista de hoy".

## 7. Recomendación

Empezar por **Fase A** (Gastos + Cuentas por Pagar), que es la causa real de que "los datos se vean raros entre pantallas". Validar resultados y luego avanzar a Fase B.

¿Apruebas Fase A para implementar, o quieres ajustar el alcance antes?
