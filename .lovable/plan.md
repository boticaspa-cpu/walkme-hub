

# Plan: Renombrar "Niño" → "Menor" y "Mexicano" → "Nacional"

## Contexto
La base de datos tiene registros con `pax_type = "Niño"` y `nationality = "Extranjero"` (no hay "Mexicano" aún). Necesitamos cambiar la terminología en toda la app y migrar datos existentes.

## Cambios

### 1. Migración de base de datos
Actualizar valores existentes en `tour_price_variants`:
```sql
UPDATE tour_price_variants SET pax_type = 'Menor' WHERE pax_type = 'Niño';
UPDATE tour_price_variants SET nationality = 'Nacional' WHERE nationality = 'Mexicano';
```

### 2. Archivos a modificar (reemplazo "Niño" → "Menor", "Mexicano" → "Nacional")

| Archivo | Cambios |
|---|---|
| `src/components/tours/PriceVariantEditor.tsx` | Constantes `PAX_TYPES`, `NATIONALITIES`, comentarios |
| `src/lib/tour-pricing.ts` | Lookups `"Niño"` → `"Menor"` |
| `src/lib/sheet-import.ts` | Alias para menor/nacional en mapeo de columnas |
| `src/pages/Cotizaciones.tsx` | `lookupPrice(..., "Niño")` → `"Menor"`, labels UI |
| `src/pages/CotizacionPDF.tsx` | Headers "Niños" → "Menores", "P/U Niño" → "P/U Menor" |
| `src/pages/Reservas.tsx` | Labels de formulario "Niños" → "Menores" |
| `src/components/pos/VariantSelectDialog.tsx` | Búsqueda de variante child `"Niño"` → `"Menor"`, labels |
| `src/components/cotizaciones/AcceptQuoteDialog.tsx` | Label "niños" → "menores" |
| `src/components/cotizaciones/SendQuoteDialog.tsx` | Texto WhatsApp "niño" → "menor" |
| `src/components/reservations/ReservationCheckout.tsx` | Label "niños" → "menores" |
| `src/components/reservations/whatsapp-message.ts` | "Children" / "Niños" → "Menores" |
| `src/components/tours/PackageEditor.tsx` | Labels "Niño" → "Menor" |
| `src/components/operators/PriceListImportDialog.tsx` | Búsqueda `"Niño"` → `"Menor"` |
| `supabase/functions/parse-tour-document/index.ts` | Enum `"Niño"` → `"Menor"`, `"Mexicano"` → `"Nacional"` |
| `supabase/functions/parse-tour-pricing/index.ts` | Enum `"Niño"` → `"Menor"`, `"Mexicano"` → `"Nacional"` |

### 3. Resumen
- **"Niño"** → **"Menor"** en toda la app (UI, lógica, edge functions, DB)
- **"Mexicano"** → **"Nacional"** en toda la app
- Labels de UI: "Niños" → "Menores", "P/U Niño" → "P/U Menor"
- WhatsApp messages actualizados en ambos idiomas

