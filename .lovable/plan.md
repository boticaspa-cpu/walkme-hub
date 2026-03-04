

# Plan: Reemplazar columna "Operador" por "Paquete" en Matriz de Precios v2

## Problema
La columna "Operador" en la Matriz de Precios v2 es redundante — el operador ya está definido a nivel del tour. Lo que realmente varía por fila es a **qué paquete** del tour aplica la variante de precio (ej. "Xcaret Plus", "Xcaret Light"), junto con zona, nacionalidad y tipo de pax.

## Cambios

### 1. `PriceVariantEditor.tsx`
- Reemplazar prop `operators: Operator[]` por `packages: {id?: string; name: string}[]`
- Reemplazar campo `operator_id` en `VariantForm` por `package_name: string` (referencia al paquete del tour)
- En la tabla: cambiar columna "Operador" → "Paquete" con un Select que muestra los paquetes del tour actual
- En `generateAll`: generar combinaciones por cada paquete × zona × nacionalidad × tipo pax
- En `emptyVariant`: cambiar `operator_id: ""` por `package_name: ""`

### 2. `Tours.tsx`
- Pasar `packages` (la lista de paquetes del tour actual) a `PriceVariantEditor` en vez de `operatorsList`
- Al guardar variantes en DB (`tour_price_variants`), seguir asignando `operator_id` desde `form.operator_id` del tour automáticamente (no desde cada fila)

### 3. DB: `tour_price_variants`
La tabla ya tiene `operator_id` (se asigna automáticamente del tour). No se necesitan cambios de esquema — el `operator_id` se sigue guardando pero se hereda del tour, no se selecciona por fila.

### Resultado visual
```text
┌──────────────────────────────────────────────────────────────────┐
│ Paquete       │ Zona    │ Tipo Pax │ Nacionalidad │ Precio │ Tax │
│ Xcaret Plus   │ Cancun  │ Adulto   │ Extranjero   │ 120    │ 15  │
│ Xcaret Plus   │ Cancun  │ Adulto   │ Nacional     │ 90     │ 15  │
│ Xcaret Light  │ Playa   │ Niño     │ Extranjero   │ 60     │ 10  │
└──────────────────────────────────────────────────────────────────┘
```

### Archivos modificados
- `src/components/tours/PriceVariantEditor.tsx` — reemplazar Operador por Paquete
- `src/pages/Tours.tsx` — pasar packages en vez de operators, asignar operator_id automáticamente al guardar

