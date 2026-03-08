

# Plan: Filtro por estado en Reservas

Agregar dos selects compactos junto a los filtros existentes (búsqueda + fechas) para filtrar por estado de confirmación y estado de pago.

## Cambios en `src/pages/Reservas.tsx`

1. **Nuevos estados**: `filterStatus` y `filterPayment` (strings, default `"all"`)

2. **UI**: Dos `<Select>` compactos en el `CardHeader`, junto al `DateRangeFilter`:
   - Estado: Todas / Programada / Confirmada / Completada / Cancelada / No Show
   - Pago: Todos / Pendiente / Depósito / Pagado

3. **Filtro**: En el bloque `filtered` (línea ~533), agregar condiciones:
   ```typescript
   if (filterStatus !== "all" && r.confirmation_status !== filterStatus) return false;
   if (filterPayment !== "all" && r.payment_status !== filterPayment) return false;
   ```

## Archivos modificados
- `src/pages/Reservas.tsx`

