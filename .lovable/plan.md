

# Corregir precios a MXN usando tipo de cambio del tour

## Problema
Los precios del paquete Xcaret se están calculando y mostrando en USD. Deben convertirse a MXN usando el `exchange_rate_tour` de cada tour (como se hace en las fichas de tours).

## Cambios en `src/pages/PaquetesXcaret.tsx`

1. **Tour interface**: agregar `exchange_rate_tour`, `tax_adult_usd`, `public_price_child_usd`, `tax_child_usd` 
2. **Query de tours**: incluir esos campos en el select
3. **Cálculo**: convertir cada tour a MXN antes de sumar: `(public_price_adult_usd + tax_adult_usd) × exchange_rate_tour`
4. **Formato**: cambiar `fmt()` de USD a MXN (`es-MX`, `currency: "MXN"`)
5. **Tabla y BD**: los campos `promo_packages` almacenarán precios en MXN (renombrar conceptualmente; los campos ya existen como `_usd` pero almacenaremos MXN — o bien documentar que ahora son MXN)

### Fórmula actualizada
```text
Por cada tour:
  precioMXN = (public_price_adult_usd + tax_adult_usd) × exchange_rate_tour

sumaMXN = Σ precioMXN de tours seleccionados

Público Adulto  = sumaMXN × 0.80
Público Menor   = Público Adulto × 0.75
Pref. Adulto    = Público Adulto × 0.70
Pref. Menor     = Pref. Adulto × 0.75
```

### Archivos
- `src/pages/PaquetesXcaret.tsx` — actualizar interface Tour, query, cálculo y formato

