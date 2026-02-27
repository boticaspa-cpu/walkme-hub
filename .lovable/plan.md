

# Plan: Importador masivo de lista de precios con selector de regla de costo

Ninguno de los componentes necesarios existe aún (ni `PriceListImportDialog`, ni la edge function `parse-operator-pricelist`, ni la utilidad de compresión). Se crean desde cero.

---

## 1. Utilidad de compresión de imagen
Crear `src/lib/compress-image.ts`:
- `compressImage(file: File, maxWidth=1200, quality=0.7): Promise<File>`
- Si el archivo no es imagen (PDF), devolverlo sin modificar
- Canvas resize + JPEG compress

## 2. Edge Function `parse-operator-pricelist`
Crear `supabase/functions/parse-operator-pricelist/index.ts`:
- Recibe FormData con `file` + `operator_id`
- Envía a Lovable AI (Gemini 2.5 Flash) con prompt para extraer **múltiples tours** de una lista de precios
- Tool schema incluye:
  - `detected_commission_percent` (number|null) — detecta frases como "Comisión Agencias: 20%"
  - `tours[]` con `tour_name` y `price_variants[]` (cada una con `sale_price`, `net_cost`, `tax_fee`, `zone`, `nationality`, `pax_type`)
- No escribe en DB — devuelve JSON al frontend
- Registrar en `supabase/config.toml` con `verify_jwt = false`

## 3. Componente `PriceListImportDialog`
Crear `src/components/operators/PriceListImportDialog.tsx`:
- Props: `open`, `onOpenChange`, `operator: {id, name}`
- Flujo: subir archivo → comprimir si es imagen → llamar edge function → mostrar preview
- **Selector de regla de costo** (RadioGroup):
  - "Monto Fijo" — usa `net_cost` tal como viene del documento (o editable)
  - "Porcentaje de Descuento" — input numérico pre-llenado con `detected_commission_percent`
- **Cálculo automático**: cuando se elige porcentaje, `net_cost = sale_price * (1 - pct / 100)` para todas las variantes
- Tabla preview con tours detectados, # variantes, checkboxes de selección
- Botón "Importar Seleccionados": para cada tour seleccionado:
  1. Buscar tour existente por `title` (ilike) + `operator_id`
  2. Si existe: solo reemplazar variantes
  3. Si no existe: crear tour mínimo + variantes
  4. `net_cost` calculado se guarda en `tour_price_variants.net_cost` (columna ya existe)

## 4. Integrar en `Operadores.tsx`
- Agregar estado `priceListOp` para el operador seleccionado
- Botón "📄 Mapear Lista de Precios" por fila (solo admin)
- Renderizar `<PriceListImportDialog>`

## 5. Refinar mapeo en `Tours.tsx`
- En `handleDocUpload` (líneas 552-563): eliminar el bloque que sobrescribe variantes (`setVariants`)
- Solo pre-llenar campos descriptivos, sin tocar precios existentes
- Aplicar compresión de imagen antes de enviar

---

## Detalle técnico

**Edge function tool schema** (extracto clave):
```text
detected_commission_percent: number | null
tours: [{
  tour_name: string,
  price_variants: [{
    zone, pax_type, nationality, sale_price, net_cost, tax_fee
  }]
}]
```

**Cálculo en frontend**:
```text
if mode === "percentage":
  variant.net_cost = round(variant.sale_price * (1 - pct / 100), 2)
if mode === "fixed":
  variant.net_cost = valor del documento o editable
```

**Persistencia**: Los `net_cost` calculados se escriben directamente en `tour_price_variants.net_cost`. No se requieren cambios de esquema.

