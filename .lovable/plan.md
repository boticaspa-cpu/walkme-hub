

# Plan: Agregar "Tipo de Servicio" al Tour

## Cambios

### 1. Migración DB
Agregar columna `service_type` a la tabla `tours`:
```sql
ALTER TABLE public.tours 
  ADD COLUMN service_type text NOT NULL DEFAULT 'with_transport';
```
Valores: `'with_transport'` | `'entry_only'`

### 2. Tours.tsx — Form + UI

- Agregar `service_type: string` al `TourForm` interface (default `'with_transport'`)
- En el grid de "Row 3" (línea ~1029), reemplazar el `<div />` vacío con un Select para "Tipo de Servicio":
  - Opciones: "Con Transporte" (`with_transport`) / "Solo Entrada" (`entry_only`)
- Incluir `service_type` en el payload de insert/update del tour
- Pre-cargar valor al editar (`openEdit`)
- Mostrar badge en la ficha/showroom del tour

| Archivo | Acción |
|---|---|
| Migración SQL | `ALTER TABLE tours ADD COLUMN service_type` |
| `src/pages/Tours.tsx` | Agregar campo al form, guardar, mostrar |

