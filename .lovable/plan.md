

# Lista de Precios por Operador — Excel + PDF

## Qué se construirá
Un botón "Descargar Lista de Precios" en la tabla de operadores (junto al botón existente de "Mapear Lista de Precios") que genera dos archivos descargables:

1. **Excel (.xlsx)**: Tabla con todos los tours del operador, precio público adulto/menor, costo neto, impuestos, y precio final MXN.
2. **PDF**: Versión visual estilo la imagen que subiste, lista para imprimir o enviar al operador.

## Flujo del usuario
1. En la página de Operadores, el admin hace clic en un nuevo ícono de descarga junto al operador.
2. Se consulta la base de datos para obtener todos los tours de ese operador con sus precios.
3. Se genera un Excel y un PDF en el cliente, y se descargan automáticamente (o se muestran en un diálogo para elegir formato).

## Cambios técnicos

### 1. Nueva página/componente: `PriceListExportDialog.tsx`
- Recibe `operator: { id, name, exchange_rate, base_currency }`.
- Al abrirse, consulta `tours` filtrados por `operator_id` con sus campos de precios.
- Opcionalmente consulta `tour_price_variants` para incluir desglose por zona/nacionalidad.
- Genera Excel con `xlsx` (SheetJS) y PDF con `jspdf` + `jspdf-autotable`.
- Ambos archivos se descargan con un clic.

### 2. Estructura del Excel
| Tour | Precio Público Adulto | Precio Público Menor | Tax Adulto USD | Tax Menor USD | Costo Neto Adulto | Costo Neto Menor | Precio Venta Adulto MXN | Precio Venta Menor MXN |
|------|----------------------|---------------------|----------------|---------------|-------------------|-----------------|------------------------|----------------------|

- Header con nombre del operador, moneda base, T.C., fecha de generación.

### 3. Estructura del PDF
- Encabezado: Logo de la empresa + "Lista de Precios al Público" + nombre del operador.
- Tabla con las mismas columnas del Excel, estilizada similar a la imagen de referencia.
- Pie de página con fecha de generación y notas.

### 4. Integración en `Operadores.tsx`
- Agregar un nuevo botón con ícono `Download` en la fila de cada operador.
- Estado para controlar el diálogo de exportación.

### 5. Dependencias
- `xlsx` (SheetJS) para generar el Excel en el cliente.
- `jspdf` + `jspdf-autotable` para generar el PDF en el cliente.

## Archivos a crear/modificar
- **Crear**: `src/components/operators/PriceListExportDialog.tsx`
- **Modificar**: `src/pages/Operadores.tsx` (agregar botón y estado)
- **package.json**: agregar `xlsx`, `jspdf`, `jspdf-autotable`

