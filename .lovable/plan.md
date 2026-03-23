

# Rediseño Visual del Mapeo Inteligente — Cards con Iconos

## Resumen
Cambiar las secciones de "Mapeo Inteligente" en los 3 lugares (Generales, Paquetes, Matriz) de botones inline a cards visuales con iconos grandes, siguiendo el diseño de referencia.

## Cambios

### 1. Sección "Mapeo Inteligente — Generales" (`src/pages/Tours.tsx`)
Reemplazar los dos botones inline ("Mapear PDF" y "Importar Sheet") por un grid de 3 cards:

```text
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   📄 (icon) │  │   📊 (icon) │  │   📷 (icon) │
│    PDF      │  │   Sheets    │  │    Foto     │
└─────────────┘  └─────────────┘  └─────────────┘
```

- **PDF**: abre file input para PDF/imagen (igual que "Mapear PDF" actual)
- **Sheets**: abre SheetImportDialog (igual que "Importar Sheet" actual)
- **Foto**: abre file input para imagen (cámara/galería) — mismo handler que PDF pero con accept="image/*"

Cada card: borde redondeado, hover sutil, icono centrado grande (Lucide: `FileText`, `Sheet`, `Camera`), label debajo.

### 2. Sección Paquetes (`src/components/tours/PackageEditor.tsx`)
Reemplazar los botones "Mapear PDF" e "Importar Sheet" en el header por el mismo grid de cards debajo del título, con los mismos 3 opciones (PDF, Sheets, Foto).

### 3. Sección Matriz de Precios (`src/components/tours/PriceVariantEditor.tsx`)
Mismo cambio que Paquetes — cards en lugar de botones inline.

### Estilo de las cards
- Grid de 3 columnas
- Border rounded-xl, hover:bg-muted/50, cursor-pointer
- Icono de 24px centrado con color distinto por tipo (verde para Excel/Sheets, azul para Sheets, morado para Foto)
- Texto sm debajo del icono
- Disabled state con opacity-50 cuando `isMapping` es true
- Loading spinner reemplaza icono cuando está procesando

## Archivos modificados
- `src/pages/Tours.tsx` (sección Generales)
- `src/components/tours/PackageEditor.tsx`
- `src/components/tours/PriceVariantEditor.tsx`

