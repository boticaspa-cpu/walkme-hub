

# Fix: Chunked base64 en `parse-tour-document`

## Problema
`parse-tour-document/index.ts` línea 30 usa `btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))` — mismo bug que ya corregimos en `parse-operator-pricelist`.

## Cambios

### 1. Fix edge function `parse-tour-document`
Reemplazar líneas 29-30 con conversión chunked idéntica a la de `parse-operator-pricelist`:
```typescript
const bytes = new Uint8Array(arrayBuffer);
let binary = "";
const chunkSize = 8192;
for (let i = 0; i < bytes.length; i += chunkSize) {
  const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
  for (let j = 0; j < chunk.length; j++) {
    binary += String.fromCharCode(chunk[j]);
  }
}
const base64 = btoa(binary);
```

### 2. Protección de datos en Tours.tsx
Verificar que `handleDocUpload` ya no sobrescribe variantes de precio (cambio del paso anterior). Si el bloque `setVariants` sigue presente, eliminarlo para que solo se pre-llenen campos descriptivos.

Dos ediciones, un deploy.

