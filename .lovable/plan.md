

# Plan: Cobro de impuestos en ficha del operador + simplificar campos en tour

## Resumen
Mover la preferencia de cobro de impuestos a la ficha del operador ("Con impuestos" / "Sin impuestos") y eliminar el campo "Fees al Abordar USD (muelle/parques)" del formulario de tours, ya que es redundante con los tax fields.

## Cambios

### 1. Migración DB
```sql
ALTER TABLE operators ADD COLUMN fee_collection_mode text NOT NULL DEFAULT 'agency';
```
Valores: `'agency'` (nosotros cobramos) / `'on_site'` (se pagan al abordar en efectivo).

### 2. `src/pages/Operadores.tsx`
- Agregar `fee_collection_mode` al `OperatorForm` interface y `emptyForm`
- Agregar Select en el formulario: "Cobro de Impuestos" con opciones:
  - "Los cobramos nosotros" (`agency`)
  - "Se pagan al abordar" (`on_site`)
- Leer/guardar en el payload de create/update
- Pre-llenar al editar

### 3. `src/pages/Tours.tsx`
- Eliminar el campo "Fees al Abordar USD (muelle/parques)" (`mandatory_fees_usd`) del formulario
- Mantener los campos de tax_adult_usd y tax_child_usd (son los impuestos reales)
- Actualizar la alerta ⚠️ para que diga que depende de la configuración del operador

### 4. `src/pages/Reservas.tsx`
- Cargar `fee_collection_mode` del operador del tour
- En `handleVoucherWithCheck`, pre-seleccionar `taxIncluded` basado en el operador:
  - `on_site` → `setTaxIncluded(false)`
  - `agency` → `setTaxIncluded(true)`
- En `computeOnSiteFees`, ya no sumar `mandatory_fees_usd` (solo usar tax_adult/child)

| Archivo | Cambio |
|---|---|
| SQL Migration | `ALTER TABLE operators ADD COLUMN fee_collection_mode` |
| `Operadores.tsx` | Campo Select "Cobro de Impuestos" en formulario |
| `Tours.tsx` | Eliminar campo `mandatory_fees_usd` del form |
| `Reservas.tsx` | Pre-seleccionar toggle según operador, quitar mandatory_fees del cálculo |

