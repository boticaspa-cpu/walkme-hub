

# Plan: Agregar Adultos, Niños, Zona y Nacionalidad a Cotizaciones y Reservas

## Contexto
Actualmente Cotizaciones tiene un solo campo `qty` y un `unit_price_mxn` por línea, sin diferenciar adultos/niños, zona de pickup ni nacionalidad. Reservas tiene un campo genérico `pax` sin desglose. Se necesita capturar estos datos como en la referencia (similar al sitio de Xcaret).

## Cambios

### 1. Migración DB
```sql
-- quote_items: agregar campos de desglose
ALTER TABLE public.quote_items ADD COLUMN qty_adults integer NOT NULL DEFAULT 1;
ALTER TABLE public.quote_items ADD COLUMN qty_children integer NOT NULL DEFAULT 0;
ALTER TABLE public.quote_items ADD COLUMN unit_price_child_mxn numeric NOT NULL DEFAULT 0;
ALTER TABLE public.quote_items ADD COLUMN zone text NOT NULL DEFAULT '';
ALTER TABLE public.quote_items ADD COLUMN nationality text NOT NULL DEFAULT '';

-- reservations: agregar campos de desglose
ALTER TABLE public.reservations ADD COLUMN pax_adults integer NOT NULL DEFAULT 1;
ALTER TABLE public.reservations ADD COLUMN pax_children integer NOT NULL DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN zone text NOT NULL DEFAULT '';
ALTER TABLE public.reservations ADD COLUMN nationality text NOT NULL DEFAULT '';
```

### 2. `Cotizaciones.tsx`
- Actualizar `QuoteItem` interface: agregar `qty_adults`, `qty_children`, `unit_price_child_mxn`, `zone`, `nationality`
- Cada línea de cotización pasa de una sola fila a un bloque compacto con:
  - Tour (Select) — fila 1
  - Zona (Select: Cancún/Playa del Carmen/Riviera Maya/Tulum), Nacionalidad (Select: Nacional/Extranjero) — fila 2
  - Adultos (number), Precio adulto, Niños (number), Precio niño — fila 3
- Auto-llenar precios desde `tour_price_variants` cuando se selecciona tour + zona + nacionalidad
- Calcular total como `(qty_adults × precio_adulto) + (qty_children × precio_niño)`
- Actualizar `saveMutation` y `openEdit` para persistir/cargar los nuevos campos
- Agregar campo de **Fecha** al formulario principal de cotización (a nivel de quote, no por línea)

### 3. `Reservas.tsx`
- Actualizar `emptyForm`: reemplazar `pax: 1` por `pax_adults: 1`, `pax_children: 0`, `zone: ""`, `nationality: ""`
- En el formulario agregar:
  - Selects para Zona (Cancún/Playa del Carmen/Riviera Maya/Tulum) y Nacionalidad (Nacional/Extranjero)
  - Inputs numéricos para Adultos y Niños (en lugar del campo `pax` genérico)
- Calcular `pax = pax_adults + pax_children` automáticamente al guardar
- Actualizar `saveMutation` y `openEdit` para los nuevos campos

### 4. POS — Sin cambios
El POS ya maneja adultos/niños/zona/nacionalidad via `VariantSelectDialog`. No requiere modificaciones.

### Archivos modificados
- Migración SQL (nueva)
- `src/pages/Cotizaciones.tsx` — campos por línea + auto-precio desde variantes
- `src/pages/Reservas.tsx` — campos en formulario de reserva

