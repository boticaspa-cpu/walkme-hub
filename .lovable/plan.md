

# Plan: Matriz de Variantes de Precio (Lookup) + CRUD en Tours.tsx

## Contexto

Los `tour_packages` siguen definiendo inclusiones y nivel de servicio. La nueva tabla `tour_price_variants` agrega una capa de precios por combinacion de **nacionalidad + zona + paquete**, eliminando formulas y usando busqueda directa.

---

## Cambio 1: Migracion SQL

Crear tabla `tour_price_variants`:

```sql
CREATE TABLE public.tour_price_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  tour_package_id uuid REFERENCES public.tour_packages(id) ON DELETE CASCADE,
  is_mexican boolean NOT NULL DEFAULT false,
  zone text NOT NULL DEFAULT 'Cancun',
  price_adult_mxn numeric NOT NULL DEFAULT 0,
  price_child_mxn numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint para evitar duplicados
CREATE UNIQUE INDEX uq_tour_variant 
  ON public.tour_price_variants(tour_id, COALESCE(tour_package_id, '00000000-0000-0000-0000-000000000000'), is_mexican, zone);

ALTER TABLE public.tour_price_variants ENABLE ROW LEVEL SECURITY;
-- RLS: mismas politicas que tour_packages
CREATE POLICY "Auth users can read tour_price_variants" ON public.tour_price_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tour_price_variants" ON public.tour_price_variants FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tour_price_variants" ON public.tour_price_variants FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tour_price_variants" ON public.tour_price_variants FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Agregar columna de referencia en sale_items
ALTER TABLE public.sale_items ADD COLUMN tour_price_variant_id uuid REFERENCES public.tour_price_variants(id);
```

**Nota**: `tour_package_id` es nullable. Tours sin paquetes tendran variantes directas (tour_package_id = NULL). Tours con paquetes tendran variantes por cada paquete.

**Nota sobre edades**: Los campos `child_age_min` y `child_age_max` ya existen en la tabla `tours`. Se usaran directamente del tour seleccionado.

---

## Cambio 2: Tours.tsx — CRUD de Variantes

Crear componente `src/components/tours/PriceVariantEditor.tsx`:

- Props: `tourId`, `packages: PackageForm[]` (para saber los niveles disponibles), `variants`, `onChange`
- UI tipo tabla/grid:
  - Columnas: Paquete (si hay), Zona (Select: Cancun/Playa/Riviera/Tulum), Nacional (checkbox), Precio Adulto MXN, Precio Nino MXN, Eliminar
  - Boton "+ Agregar Variante"
- El campo "Paquete" solo aparece si el tour tiene paquetes definidos
- Info de edades del tour mostrada como referencia: "Nino: {child_age_min}-{child_age_max} anos"

Integracion en Tours.tsx:
- Agregar seccion "Matriz de Precios" despues de la seccion de Paquetes
- Estado local `variants: VariantForm[]`
- Al abrir `openEdit`: query `tour_price_variants` por `tour_id`
- En `handleSave`: DELETE variantes viejas, INSERT nuevas (mismo patron que paquetes)

---

## Cambio 3: POS.tsx — Flujo de Seleccion con Lookup

Nuevo flujo al hacer click en un tour:

1. Abrir `VariantSelectDialog` (nuevo componente `src/components/pos/VariantSelectDialog.tsx`)
2. El dialog carga las variantes disponibles para ese tour
3. Muestra dropdowns secuenciales:
   - **Nacionalidad**: Mexicano / Extranjero (solo si ambas opciones existen para ese tour)
   - **Zona**: Cancun, Playa, Riviera, Tulum (solo las que existen)
   - **Paquete**: Regular, Premier, Gold (solo si el tour tiene paquetes, solo las que existen para la combinacion seleccionada)
4. Al completar la seleccion → mostrar precio adulto y nino con info de rango de edad
5. Inputs de cantidad: Adultos y Ninos
6. Boton "Agregar al Carrito"

CartItem actualizado:
- Nuevos campos: `variantId`, `zone`, `isMexican`, `priceChildMxn`, `qtyAdults`, `qtyChildren`
- `unitPrice` = `price_adult_mxn` de la variante
- El total del item = `(priceAdult * qtyAdults) + (priceChild * qtyChildren)`

sale_items insert incluira `tour_price_variant_id`.

---

## Cambio 4: Compatibilidad

- Tours SIN variantes cargadas siguen usando el flujo actual (paquetes o precio directo)
- Tours CON variantes activan el nuevo flujo de lookup
- La deteccion es: si `tour_price_variants` tiene registros activos para ese `tour_id`, usar lookup; si no, fallback al flujo anterior

---

## Archivos a crear/modificar

```
supabase/migrations/XXXX_create_tour_price_variants.sql  — nueva tabla
src/components/tours/PriceVariantEditor.tsx               — CRUD de variantes (nuevo)
src/components/pos/VariantSelectDialog.tsx                 — dialog de seleccion con lookup (nuevo)
src/pages/Tours.tsx                                        — integrar PriceVariantEditor
src/pages/POS.tsx                                          — integrar VariantSelectDialog + nuevo CartItem
```

