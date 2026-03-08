

# Nueva página: Promociones

## Concepto

Una página independiente donde puedas crear promociones personalizadas mezclando **cualquier tour o entrada** (Xcaret, Ocean, Cirque du Soleil, Coco Bongo, etc.) y aplicar un descuento global en **porcentaje o monto fijo** (reutilizando el componente `DiscountInput` que ya existe). Se muestra el subtotal (suma de tours), el descuento aplicado y el total final.

## Nueva tabla: `promotions`

```sql
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  discount_mode text NOT NULL DEFAULT 'percent',  -- 'percent' | 'amount'
  discount_value numeric NOT NULL DEFAULT 0,       -- % o monto fijo MXN
  discount_mxn numeric NOT NULL DEFAULT 0,         -- monto calculado
  subtotal_mxn numeric NOT NULL DEFAULT 0,
  total_mxn numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.promotion_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE
);
```

Con RLS: admin full access, auth users read.

## Cambios por archivo

### 1. `src/pages/Promociones.tsx` (nuevo)
- Tabla principal con columnas: Nombre, Tours incluidos, Subtotal, Descuento, Total, Activo, Acciones (Cotizar, Reservar, Editar, Eliminar)
- Diálogo crear/editar:
  - Campo nombre y descripción
  - Selector multi-tour con checkboxes (igual que PaquetesXcaret)
  - Calculadora en vivo: lista cada tour con su precio MXN, subtotal
  - **DiscountInput** (componente existente) para elegir % o monto fijo
  - Total final = subtotal - descuento
- Botones "Cotizar" y "Reservar" que redirigen con `?promotion_id={id}` (mismo patrón que promo_packages)

### 2. `src/components/layout/AppSidebar.tsx`
- Agregar entrada "Promociones" en `adminNav` y `sellerNav` con icono `Tag`

### 3. `src/App.tsx`
- Agregar ruta `/promociones` → `<Promociones />`

### 4. `src/pages/Cotizaciones.tsx` y `src/pages/Reservas.tsx`
- Detectar `promotion_id` en search params (mismo patrón que `promo_package_id`)
- Pre-cargar tours de la promoción con precios ajustados por el descuento

## Flujo del usuario

1. Va a Promociones → clic "Nueva Promoción"
2. Escribe nombre, selecciona tours (cualquiera del catálogo)
3. Ve el subtotal en vivo, elige descuento (ej: 15% o $500 MXN fijo)
4. Ve el total final calculado → Guarda
5. Desde la tabla puede hacer clic en "Cotizar" o "Reservar" para pre-cargar esos tours en el formulario correspondiente

