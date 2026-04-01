

# Tours Temporada Alta — Pagina Separada

## Resumen
Se crea una nueva pagina `/tours-temporada-alta` con su propia entrada en el sidebar. El admin puede duplicar cualquier tour regular hacia esa pagina con un boton. El tour duplicado copia toda la info (fotos, descripcion, incluye/excluye, itinerario, impuestos, etc.) pero deja todos los precios en cero para que el admin los llene manualmente.

## Cambios

### 1. Migracion: columna `season` en `tours`
```sql
ALTER TABLE tours ADD COLUMN season text NOT NULL DEFAULT 'regular';
```

### 2. Nueva pagina `src/pages/ToursTemporadaAlta.tsx`
- Copia simplificada de `Tours.tsx` que filtra tours con `season = 'alta'`
- Misma funcionalidad: ver, editar, cambiar precios en matriz, paquetes, etc.
- Sin boton de duplicar (solo se duplica desde la pagina regular)
- Reutiliza los mismos componentes: `PriceVariantEditor`, `PackageEditor`, etc.

### 3. `src/pages/Tours.tsx` — boton "Duplicar para Temp. Alta"
- Agregar un boton/icono en cada tarjeta de tour (solo admin)
- Al hacer click, duplica el tour completo:
  - **Conserva**: titulo, fotos, descripcion, itinerario, incluye/excluye, que traer, punto de encuentro, recomendaciones, tags, dias, tipo, operador, categoria, destino, edades nino, impuestos (`tax_adult_usd`, `tax_child_usd`), tipo de cambio, `service_type`, `supplier_currency`
  - **Pone en cero**: `price_mxn`, `suggested_price_mxn`, `price_adult_usd`, `price_child_usd`, `public_price_adult_usd`, `public_price_child_usd`, `mandatory_fees_usd`, `commission_percentage`
- Duplica `tour_packages` (conserva nombre, tipo, incluye/excluye, impuestos; precios en cero)
- Duplica `tour_price_variants` (conserva zona, nacionalidad, pax_type, package_name, tax_fee; `sale_price` y `net_cost` en cero)
- Nuevo tour tiene `season = 'alta'`
- Toast de confirmacion

### 4. Routing (`src/App.tsx`)
- Agregar ruta `/tours-temporada-alta` → `<ToursTemporadaAlta />`
- Dentro del `<AdminRoute>` (solo admin puede ver temporada alta)

### 5. Sidebar (`src/components/layout/AppSidebar.tsx`)
- Agregar entrada "Tours Temp. Alta" en `adminNav`, debajo de "Tours"
- Icono: `Sun` o similar de lucide

### 6. Bottom Nav (`src/components/layout/BottomNav.tsx`)
- Agregar entrada si aplica para mobile

## Flujo del usuario
1. Admin va a **Tours** → ve sus tours regulares
2. Click en icono de duplicar en "Xcaret"
3. Toast: "Tour duplicado para temporada alta"
4. Va a **Tours Temp. Alta** en el menu → ve "Xcaret" con precios en cero
5. Abre el tour → llena los precios de temporada alta
6. En POS/Cotizaciones ambos tours aparecen como opciones separadas

## Archivos a crear/modificar
- 1 migracion SQL
- `src/pages/ToursTemporadaAlta.tsx` (nuevo)
- `src/pages/Tours.tsx` (agregar boton duplicar)
- `src/App.tsx` (nueva ruta)
- `src/components/layout/AppSidebar.tsx` (nueva entrada sidebar)

