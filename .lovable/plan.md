

# Plan: Fix — Derivar campos faltantes (costo, edades, impuestos) desde variantes

## Problema

El código ya envía `tax_adult_usd`, `child_age_min/max`, `price_adult_usd` (net cost) al tour, **pero depende de que la IA los extraiga correctamente a nivel tour**. Si la IA devuelve 0 o vacío para esos campos (cosa frecuente), no hay fallback desde los datos de variantes que SÍ extrae bien.

## Solución

Agregar lógica de **fallback en el cliente** (`PriceListImportDialog.tsx`) para derivar campos generales desde las variantes cuando la IA no los devuelve a nivel tour:

### Cambios en `PriceListImportDialog.tsx` — dentro de `handleImport`, después de línea 170

```typescript
// Fallback: derive general fields from variants if AI didn't extract them at tour level
// Tax: use tax_fee from first adult/child variant
const taxAdultFinal = taxAdult > 0 ? taxAdult 
  : (firstAdultVariant?.tax_fee ?? 0);
const taxChildFinal = taxChild > 0 ? taxChild 
  : (firstChildVariant?.tax_fee ?? 0);

// Public price: use sale_price from first adult/child variant  
const pubAdultFinal = pubAdult > 0 ? pubAdult 
  : (firstAdultVariant?.sale_price ?? 0);
const pubChildFinal = pubChild > 0 ? pubChild 
  : (firstChildVariant?.sale_price ?? 0);

// Net cost: always compute if commission mode, else use variant net_cost
const netAdult = useCommission 
  ? Math.round(pubAdultFinal * (1 - pct / 100) * 100) / 100
  : (firstAdultVariant?.net_cost ?? 0);
const netChild = useCommission
  ? Math.round(pubChildFinal * (1 - pct / 100) * 100) / 100
  : (firstChildVariant?.net_cost ?? 0);
```

Then use `taxAdultFinal`, `pubAdultFinal`, `netAdult`, etc. in the payload instead of the raw AI values. Also **always set** `price_adult_usd` and `price_child_usd` (remove the `> 0` guard).

### Edge Function — strengthen prompt

Add explicit instruction: "IMPORTANT: If the document shows a fee/tax column (like 'Muelle', 'Impuesto', 'Fee', 'Dock Fee'), extract those values into tax_adult_usd and tax_child_usd. If child age range is shown anywhere (header, footer, notes), extract it into child_age_range."

## Files

| File | Action |
|---|---|
| `src/components/operators/PriceListImportDialog.tsx` | Add variant-based fallbacks for tax, public price, net cost, ages |
| `supabase/functions/parse-operator-pricelist/index.ts` | Strengthen prompt for taxes and age extraction |

