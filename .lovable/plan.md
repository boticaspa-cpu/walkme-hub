

# Plan: Arreglar diálogos para que se adapten correctamente en móvil

## Problema
Los diálogos usan clases como `max-w-2xl`, `max-w-md`, `max-w-sm` sin el prefijo `sm:`, lo que limita el ancho del diálogo en móvil en lugar de dejarlo ocupar todo el ancho de pantalla. En la captura se ve cómo el diálogo no llena el ancho en móvil.

## Solución

### 1. `src/components/ui/dialog.tsx` — Mejorar base del diálogo
- Agregar `overflow-y-auto` al contenido base para que siempre sea scrollable
- Cambiar el `max-w-lg` del desktop default para que funcione bien con los overrides
- Asegurar que en móvil el diálogo siempre sea full-width sin restricciones de max-width

### 2. Todos los archivos que usan `DialogContent` con `max-w-*`
Agregar el prefijo `sm:` a todos los `max-w-*` para que solo apliquen en desktop:

| Archivo | Cambio |
|---|---|
| `Tours.tsx` (×2) | `max-w-2xl` → `sm:max-w-2xl` |
| `Reservas.tsx` (×2) | `max-w-sm`, `max-w-2xl` → `sm:max-w-sm`, `sm:max-w-2xl` |
| `Cotizaciones.tsx` | `max-w-sm` → `sm:max-w-sm` |
| `Leads.tsx` | `max-w-lg` → `sm:max-w-lg` |
| `Clientes.tsx` | `max-w-md` → `sm:max-w-md` |
| `Configuracion.tsx` (×2) | `max-w-md`, `max-w-sm` → `sm:max-w-md`, `sm:max-w-sm` |
| `CierreDiario.tsx` (×3) | `max-w-sm`, `max-w-md` → `sm:max-w-sm`, `sm:max-w-md` |
| `SendQuoteDialog.tsx` | `max-w-lg` → `sm:max-w-lg` |
| `AcceptQuoteDialog.tsx` | `max-w-md` → `sm:max-w-md` |
| `SheetImportDialog.tsx` | `max-w-md` → `sm:max-w-md` |
| `PackageSelectDialog.tsx` | `max-w-md` → `sm:max-w-md` |
| `VariantSelectDialog.tsx` | Similar fix |

Esto garantiza que en móvil el diálogo sea full-width (bottom sheet) y en desktop mantenga su tamaño centrado.

