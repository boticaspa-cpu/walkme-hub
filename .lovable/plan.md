

# Plan: Filtro por fecha en POS, Reservas y Cotizaciones

Agregar un componente reutilizable de filtro por rango de fechas (fecha inicio / fecha fin) usando Popover + Calendar (DatePicker pattern de shadcn). Se aplicara en las 3 paginas como filtro client-side sobre los datos ya cargados.

## Componente compartido

**Nuevo archivo**: `src/components/shared/DateRangeFilter.tsx`
- Dos botones tipo DatePicker (Desde / Hasta) con Popover + Calendar
- Boton "Limpiar" para resetear
- Props: `dateFrom`, `dateTo`, `onDateFromChange`, `onDateToChange`
- Layout horizontal compacto, responsive (se apila en mobile)

## Cambios por pagina

### POS (`src/pages/POS.tsx`)
- Agregar estados `dateFrom` y `dateTo`
- Colocar `<DateRangeFilter>` junto al campo de busqueda existente
- En el filtro `filtered`, comparar `r.reservation_date` contra el rango

### Reservas (`src/pages/Reservas.tsx`)
- Agregar estados `dateFrom` y `dateTo`
- Colocar `<DateRangeFilter>` junto al Input de busqueda en el CardHeader
- En el `filtered` (linea 530), agregar condicion de rango sobre `r.reservation_date`

### Cotizaciones (`src/pages/Cotizaciones.tsx`)
- Agregar estados `dateFrom` y `dateTo`
- Colocar `<DateRangeFilter>` junto al Input de busqueda
- En el `filtered` (linea 337), agregar condicion de rango sobre `q.created_at` (las cotizaciones no tienen `reservation_date`, se filtra por fecha de creacion)

## Logica del filtro (misma en las 3 paginas)

```typescript
// dentro del .filter()
if (dateFrom) {
  const d = new Date(row.reservation_date); // o created_at
  if (d < dateFrom) return false;
}
if (dateTo) {
  const d = new Date(row.reservation_date);
  if (d > dateTo) return false;
}
```

## Archivos
- **Nuevo**: `src/components/shared/DateRangeFilter.tsx`
- **Modificado**: `src/pages/POS.tsx`, `src/pages/Reservas.tsx`, `src/pages/Cotizaciones.tsx`

