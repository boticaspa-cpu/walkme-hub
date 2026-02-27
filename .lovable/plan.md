

# Fix: Stack overflow en edge function + lógica de costos

## Problema raíz
Línea 29 de `parse-operator-pricelist/index.ts`:
```
btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
```
El operador spread pasa cada byte como argumento individual a `String.fromCharCode()`. Para un archivo de 1MB son ~1 millón de argumentos, lo que excede el límite del call stack (~65K).

## Cambios

### 1. Fix edge function — conversión base64 en chunks
En `supabase/functions/parse-operator-pricelist/index.ts`, reemplazar línea 29 con una función que procese el array en bloques de 8KB:
```typescript
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}
```
Y usar: `const base64 = uint8ToBase64(new Uint8Array(arrayBuffer));`

### 2. Compresión de imagen — ya funciona correctamente
`compress-image.ts` no tiene recursión; el bug está solo en la edge function. La compresión canvas sigue siendo útil para reducir payload.

### 3. Config.toml — registrar función
Agregar `[functions.parse-operator-pricelist]` con `verify_jwt = false` al config.toml (si no está ya).

### 4. Lógica de costos en PriceListImportDialog — ya implementada
El componente `PriceListImportDialog.tsx` ya contiene el selector de regla de costo (RadioGroup con "Monto Fijo" y "Porcentaje de Descuento"), el input de porcentaje pre-llenado con `detected_commission_percent`, y el cálculo automático `net_cost = sale_price * (1 - pct/100)`. No requiere cambios adicionales.

---

**Resumen**: El único cambio real necesario es reemplazar la línea 29 de la edge function con conversión base64 chunked y asegurar que config.toml registre la función.

