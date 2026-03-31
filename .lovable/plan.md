

# Fix: Error FK en "Nuevo Pago" de Cuentas por Pagar

## Problema
En `src/pages/CuentasPorPagar.tsx` línea ~109, al crear un pago manual se hace:
```typescript
sale_id: newForm.operator_id, // required FK — use operator_id as placeholder
```
Esto viola la FK `operator_payables_sale_id_fkey` porque ese UUID no existe en `sales`.

## Solución

### 1. Migración: hacer `sale_id` nullable
La columna `sale_id` en `operator_payables` ya es nullable en el schema (`Nullable: Yes`), pero tiene una FK constraint. Solo necesitamos confirmar que acepta NULL. Si ya es nullable, simplemente enviar `null` en el insert.

### 2. Código: `src/pages/CuentasPorPagar.tsx`
Cambiar el insert del `createPayableMutation` para enviar `sale_id: null` en lugar del placeholder con `operator_id`.

```typescript
// Antes:
sale_id: newForm.operator_id, // required FK — use operator_id as placeholder

// Después:
sale_id: null,
```

Cambio de 1 línea en 1 archivo.

