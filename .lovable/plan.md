

# Plan: Mapeo Inteligente para Paquetes y Matriz de Precios v2

## Contexto
Actualmente solo existe un botón "Mapear Documento" que extrae campos descriptivos (itinerario, incluye, etc.). El usuario quiere agregar botones de mapeo AI similares en las secciones de **Paquetes** y **Matriz de Precios v2** para extraer datos de pricing desde documentos del operador.

## Cambios

### 1. Nueva Edge Function `parse-tour-pricing`
Crear una edge function dedicada que reciba un documento + un parámetro `mode` (`packages` o `variants`) y extraiga:

**Modo `packages`**: nombre del paquete, tipo de servicio, precio público adulto/niño USD, costo neto adulto/niño USD, fees, incluye/no incluye.

**Modo `variants`**: zona, tipo de pax, nacionalidad, precio de venta, costo neto, tax/fee.

Tool schema para paquetes:
```json
{
  "packages": [{
    "name": "string",
    "service_type": "with_transport | entry_only",
    "public_price_adult_usd": "number",
    "public_price_child_usd": "number",
    "cost_adult_usd": "number",
    "cost_child_usd": "number",
    "mandatory_fees_usd": "number",
    "includes": ["string"],
    "excludes": ["string"]
  }]
}
```

Tool schema para variantes:
```json
{
  "variants": [{
    "zone": "Cancun | Playa | Tulum | Riviera Maya",
    "pax_type": "Adulto | Niño",
    "nationality": "Mexicano | Extranjero",
    "sale_price": "number",
    "net_cost": "number",
    "tax_fee": "number"
  }]
}
```

### 2. Configuración: `supabase/config.toml`
Agregar entrada `[functions.parse-tour-pricing]` con `verify_jwt = false`.

### 3. Actualizar `PackageEditor.tsx`
- Agregar prop `onDocUpload?: (packages: PackageForm[]) => void` (opcional)
- Agregar botón "📄 Mapear Documento" junto a "Agregar Paquete" (visible solo si `onDocUpload` está definido)
- El botón sube archivo, llama a la edge function con `mode=packages`, y devuelve los paquetes parseados via callback

### 4. Actualizar `PriceVariantEditor.tsx`
- Agregar prop `onDocUpload?: (variants: VariantForm[]) => void` (opcional)
- Agregar botón "📄 Mapear Documento" junto a "Generar Combinaciones" y "Agregar"
- El botón sube archivo, llama a la edge function con `mode=variants`, y devuelve las variantes parseadas via callback

### 5. Actualizar `Tours.tsx`
- Agregar handlers `handlePackageDocUpload` y `handleVariantDocUpload` que:
  - Comprimen la imagen
  - Llaman a `parse-tour-pricing` con el mode correspondiente
  - Mapean la respuesta al formato de `PackageForm[]` o `VariantForm[]`
  - Hacen merge con los datos existentes (append, no reemplazar)
- Pasar los handlers como props a `PackageEditor` y `PriceVariantEditor`
- Solo visibles para admins

### Flujo del usuario
```text
┌─────────────────────────────────────────┐
│  Paquetes del Tour                      │
│  [📄 Mapear Documento] [+ Agregar]      │
│  → Sube PDF/imagen → AI extrae paquetes │
│  → Se agregan al editor                 │
├─────────────────────────────────────────┤
│  Matriz de Precios v2                   │
│  [📄 Mapear] [⚡ Generar] [+ Agregar]   │
│  → Sube PDF/imagen → AI extrae precios  │
│  → Se agregan como filas a la tabla     │
└─────────────────────────────────────────┘
```

### Archivos modificados
- `supabase/functions/parse-tour-pricing/index.ts` (nuevo)
- `supabase/config.toml` (agregar entry)
- `src/components/tours/PackageEditor.tsx` (botón + props)
- `src/components/tours/PriceVariantEditor.tsx` (botón + props)
- `src/pages/Tours.tsx` (handlers + pasar props)

