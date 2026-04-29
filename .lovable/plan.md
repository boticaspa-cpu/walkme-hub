
# Auditoría de rendimiento móvil

## Diagnóstico (qué encontré)

Revisé el código y hay **4 problemas claros** que explican la lentitud en celular y la fricción al cotizar/reservar.

### 1. Las fotos de los tours se suben sin comprimir 🔴
En `Tours.tsx` línea 1091-1098 se hace `supabase.storage.from("media").upload(path, file)` con el **archivo original** del celular. Una foto típica de un iPhone son 3-6 MB. Con 4 fotos por tour y 12 tours visibles en el catálogo, eso son **~150 MB descargándose en una pantalla**.

`compressImage()` ya existe (`src/lib/compress-image.ts`) pero **solo se usa para mandar fotos a la IA**, no antes de guardar en el bucket. Las fotos antiguas ya están sin comprimir en storage.

### 2. No se usa Image Transform de Lovable Cloud 🔴
Las URLs de imagen son `getPublicUrl()` directo, así que el celular descarga la **resolución completa** (ej. 4032×3024) aunque el `<img>` mida 360×200. Lovable Cloud (Supabase) soporta `?width=…&quality=…` para servir versiones redimensionadas al vuelo. Hoy no se usa en ninguna parte.

### 3. Bundle inicial enorme, sin code-splitting 🟠
`src/App.tsx` importa **las 22 páginas de golpe**, no usa `React.lazy()`. Y dependencias muy pesadas viajan en el bundle inicial:
- `xlsx` (~900 KB) — solo se usa al importar Excel
- `jspdf` + `jspdf-autotable` + `html2canvas` (~700 KB) — solo para vouchers/PDFs
- `recharts` (~400 KB) — solo en Reportes/Dashboard
- `embla-carousel` — solo en el showroom de tours

En 4G de celular eso son varios segundos antes de ver nada.

### 4. Queries que traen demasiado 🟠
- `Cotizaciones.tsx` línea 99: `select("*, clients(name)")` sin paginar — trae **todas** las cotizaciones históricas con todas sus columnas.
- `Reservas.tsx`, `POS.tsx`: mismo patrón, `select("*")`.
- Dashboard hace 8 queries en paralelo al cargar (incluso con Modo Cliente, varias siguen activas).
- `Tours.tsx` trae todas las columnas de `tours` (incluido `itinerary`, `recommendations`, etc. que pesan KB) cuando el grid solo necesita 8 campos.

### 5. Cotizar/reservar se siente lento en celular 🟠
- El dialog "Nueva Cotización" carga `tours-active` + `tour-price-variants-all` (todas las variantes de todos los tours) cada vez que abres el form. En celular 4G son ~1-2 seg de espera antes de poder escribir.
- Los `<Select>` de Radix con muchas opciones (zona, nacionalidad, tour, paquete) son lentos en celular porque renderizan todos los items en el DOM.

---

## Plan de acción

### Fase 1 — Imágenes (impacto inmediato, lo que más se nota)

**1.1 Comprimir antes de subir al bucket** (`src/pages/Tours.tsx`, `src/pages/Operadores.tsx`)
- Antes de `supabase.storage.from("media").upload(...)`, llamar `compressImage(file, 1600, 0.75)`.
- Esto baja una foto de 5 MB a ~250 KB (20x más rápido).
- Las fotos nuevas que suban quedarán optimizadas.

**1.2 Helper para servir versiones pequeñas** — crear `src/lib/image-url.ts`:
```ts
// Recibe URL pública de Supabase Storage y devuelve una versión transformada
export function tourThumb(url: string, width = 600): string
export function tourFull(url: string, width = 1200): string
```
Internamente convierte `/storage/v1/object/public/...` a `/storage/v1/render/image/public/...?width=…&quality=75&resize=cover`.

**1.3 Aplicar el helper en los lugares correctos:**
- `Tours.tsx` línea 1242 (cards del grid) → `tourThumb(url, 600)`
- `TourImageCarousel` línea 156 (showroom) → `tourFull(url, 1200)`
- `QuoteImageCard.tsx` (PDF/share) → `tourFull(url, 1200)`

**1.4 Atributos `<img>` modernos** en cards y carrusel:
- `loading="lazy"` (ya está en el grid, agregar al carrusel)
- `decoding="async"`
- `width` y `height` explícitos para evitar reflow
- `srcSet` con 2 tamaños para retina

**Resultado esperado:** Tours pasa de descargar ~150 MB a ~3 MB en mobile.

### Fase 2 — Code-splitting (carga inicial)

**2.1 Lazy-load de páginas en `src/App.tsx`:**
Cambiar `import Tours from "./pages/Tours"` por `const Tours = lazy(() => import("./pages/Tours"))` para las 22 páginas, envolver `<Routes>` en `<Suspense fallback={<LoaderSpinner/>}>`.

**2.2 Lazy-load de librerías pesadas:**
- `xlsx`: importar dinámicamente solo dentro de `SheetImportDialog` y `PriceListExportDialog` (ya hay `await import()` en algunos sitios; auditar y corregir donde se importa estático).
- `jspdf` / `html2canvas`: solo en `VoucherPrintView` y `CotizacionPDF` — verificar que sean import dinámico.
- `recharts`: solo en Reportes; usar `lazy()` en el componente de gráficas.

**2.3 Manual chunks en `vite.config.ts`** para que React + Radix queden cacheados aparte de la lógica de la app.

**Resultado esperado:** El primer load del dashboard pasa de ~2.5 MB a ~600 KB.

### Fase 3 — Queries más livianas

**3.1 Listas seleccionan solo lo que muestran:**
- `Cotizaciones.tsx` línea 99: `.select("id, folio, status, total_mxn, created_at, client_name, clients(name)")` y agregar `.limit(100)` por defecto (paginar si hay más).
- `Reservas.tsx`: igual, columnas explícitas + `.limit(100)`.
- `Tours.tsx` query principal: traer solo los campos del card (`id, title, type, price_mxn, image_urls, days, short_description, tax_adult_usd, tax_child_usd, service_type, operators(name), categories(name)`). El detalle completo se lee en el showroom con un segundo query bajo demanda.

**3.2 Dashboard:** asegurar que en Modo Cliente realmente todas las queries financieras tengan `enabled: !clientMode` (revisar las 8 queries — algunas siguen corriendo).

**3.3 Variantes de precio:** en lugar de cargar `tour-price-variants-all` al abrir el dialog de cotización, cargar las variantes solo del tour seleccionado (`enabled: !!selectedTourId`).

### Fase 4 — UX móvil de cotizar/reservar

**4.1 Evitar el "select largo":** en mobile, los Select de tour y paquete con muchas opciones se vuelven pesados. Convertirlos a un buscador con `Command` (cmdk, ya está en el proyecto) — el usuario escribe 2 letras y filtra.

**4.2 Pre-cargar (`prefetch`) en el dashboard:** cuando se carga el dashboard, hacer `queryClient.prefetchQuery` de `tours-active` para que cuando el usuario tape "Nueva Cotización" ya esté en caché.

**4.3 Inputs sin zoom:** verificar que todos los `<Input>` tengan `font-size: 16px` (ya está en una memoria pero confirmar en los nuevos formularios).

---

## Archivos a tocar

- `src/pages/Tours.tsx` — comprimir antes de upload, usar `tourThumb`/`tourFull`, aligerar query
- `src/pages/Operadores.tsx` — comprimir antes de upload del logo
- `src/pages/Cotizaciones.tsx` — query liviana + paginación + buscador en lugar de select
- `src/pages/Reservas.tsx` — query liviana + paginación
- `src/pages/Dashboard.tsx` — verificar `enabled` en Modo Cliente, prefetch de tours
- `src/App.tsx` — `lazy()` en las 22 páginas + `<Suspense>`
- `src/lib/image-url.ts` — **nuevo**, helpers `tourThumb` / `tourFull`
- `src/components/cotizaciones/QuoteImageCard.tsx` — usar `tourFull`
- `src/components/tours/SheetImportDialog.tsx` y `PriceListExportDialog.tsx` — confirmar import dinámico de `xlsx`
- `vite.config.ts` — `manualChunks` para React/Radix/utilidades

**No requiere migraciones de base de datos.** Las fotos viejas (sin comprimir) se siguen sirviendo, pero ahora a través del Image Transform que las redimensiona al vuelo, así que igual se ven rápido.

---

## Métricas para validar después

Cuando lo implemente, en celular real (4G):
- Tours catálogo: de **8-12 seg** a **<2 seg** para ver imágenes
- Dashboard inicial: de **3-5 seg** a **<1 seg**
- Abrir "Nueva Cotización": de **1-2 seg** a **instantáneo**
- Bundle JS inicial: de **~2.5 MB** a **<800 KB**

## Orden recomendado

Las 4 fases son independientes; sugiero hacerlo en este orden por impacto vs esfuerzo:
1. **Fase 1** (imágenes) — el cambio más visible, lo que más duele hoy
2. **Fase 2** (code-splitting) — segundo más visible
3. **Fase 3** (queries) — mejora sostenida cuando crezcan los datos
4. **Fase 4** (UX cotizar) — pulido final
