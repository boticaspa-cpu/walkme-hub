

# Plan: Importar fotos desde Google Sheets (URLs) y computadora

## Contexto
Actualmente solo se pueden subir imágenes desde la computadora (file input). El usuario quiere también poder pegar URLs de imágenes (ej. desde Google Sheets o directamente) para agregarlas al tour.

## Cambios

### `src/pages/Tours.tsx`

1. **Agregar botón "Agregar URL"** junto al botón de subir archivo en la sección de imágenes
   - Al hacer clic, muestra un input de texto para pegar una URL de imagen
   - Al confirmar, valida que sea una URL válida de imagen y la agrega a `imagePreviews` directamente (sin archivo local)

2. **Actualizar `handleFileChange`** para distinguir entre URLs externas (ya son `http`) y archivos locales (necesitan `imageFiles` para upload)

3. **Actualizar lógica de guardado** — las URLs externas ya se preservan en `finalImageUrls` (línea 957 ya filtra `startsWith("http")`), así que solo hay que asegurar que no se pierdan

4. **Integrar con importación de Sheet** — agregar alias `image_url` / `imagen` / `foto` / `image` en `GENERAL_ALIASES` de `sheet-import.ts`, para que al importar generales del Sheet se auto-llenen las URLs de imagen

### `src/lib/sheet-import.ts`
- Agregar alias de imagen en `GENERAL_ALIASES`: `image_url`, `imagen`, `foto`, `url imagen`, `image`

### UI del input de URL
- Debajo de la cuadrícula de imágenes, agregar un mini-form inline: `[input URL] [+ Agregar]`
- Validar que la URL empiece con `http` antes de agregar

