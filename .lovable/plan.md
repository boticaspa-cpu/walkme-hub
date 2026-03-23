

# Moneda del Proveedor: Soporte USD / MXN en la Ficha del Tour

## Problema
El 10% de los proveedores cobra en pesos mexicanos, no en dólares. Actualmente todo el flujo asume USD y obliga a "traducir" manualmente a dólares, lo cual es impreciso.

## Solución
Agregar un selector de moneda del proveedor ("USD" / "MXN") en la sección "Precios Operador" de la ficha del tour. Según la moneda seleccionada, el formulario se adapta:

- **USD (default, 90% de los casos)**: Funciona exactamente igual que ahora. Costo neto en USD, tipo de cambio aplica, precios MXN se calculan automáticamente.
- **MXN**: Los campos de costo neto y precio público cambian a MXN. El tipo de cambio se oculta o se desactiva (no aplica). Los precios finales MXN se toman directamente sin conversión. Los impuestos en USD se mantienen opcionales (algunos operadores MXN también cobran tax en USD al abordar).

## Cambios

### 1. Base de datos — nueva columna `supplier_currency` en `tours`
```sql
ALTER TABLE public.tours 
  ADD COLUMN supplier_currency text NOT NULL DEFAULT 'USD';
```

### 2. Formulario del Tour (`src/pages/Tours.tsx`)

**TourForm**: Agregar campo `supplier_currency: string` (default `"USD"`).

**Sección "Precios Operador"**: 
- Agregar un toggle o selector USD/MXN junto al título "Precios Operador".
- Cuando es **MXN**:
  - Labels cambian de "Costo Neto Adulto USD" → "Costo Neto Adulto MXN"
  - Labels cambian de "Precio Público Adulto USD" → "Precio Público Adulto MXN"
  - La sección de T.C. se oculta (no hay conversión)
  - Los campos `price_mxn` y `suggested_price_mxn` se toman directamente del precio público ingresado (sin multiplicar por T.C.)
- Cuando es **USD** (default): todo funciona igual que ahora.

**Auto-calc (useEffect)**: 
- Si `supplier_currency === "MXN"`: `price_mxn = public_price_adult` directo, sin multiplicar por T.C.
- Si `supplier_currency === "USD"`: lógica actual sin cambios.

**Guardar**: incluir `supplier_currency` en el upsert.

### 3. Motor de precios (`src/lib/tour-pricing.ts`)
Verificar que cuando `supplier_currency === "MXN"`, los precios de la variante/tour base se usen directamente sin conversión adicional. Este archivo ya retorna precios en MXN, así que el impacto debería ser mínimo.

## Archivos a modificar
- **Migración SQL**: agregar `supplier_currency` a `tours`
- **`src/pages/Tours.tsx`**: selector de moneda, lógica condicional en formulario y auto-calc
- **`src/lib/tour-pricing.ts`**: revisar que no aplique doble conversión cuando moneda es MXN

