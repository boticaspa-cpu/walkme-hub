

# Plan: Asesor de Ventas IA (con GPT-5-mini)

## Cambios

### 1. Edge Function `supabase/functions/sales-advisor/index.ts`
- Streaming chat usando `openai/gpt-5-mini` vía Lovable AI Gateway
- System prompt especializado en:
  - Uso de la app WalkMe Tours (POS, Cotizaciones, Reservas, Calendario, etc.)
  - Técnicas de cierre de ventas y manejo de objeciones
  - Política de descuentos: hasta dónde bajar sin perder margen, cuándo ofrecer paquetes
  - Costos operativos y cuándo ceder en precio
  - Respuestas en español

### 2. `supabase/config.toml`
- Agregar `[functions.sales-advisor]` con `verify_jwt = false`

### 3. Nueva página `src/pages/AsesorVentas.tsx`
- Chat con streaming token-by-token
- Historial en memoria (no persiste)
- Chips de preguntas rápidas: "¿Cómo cotizar?", "¿Cuánto descuento puedo dar?", "Tips para cerrar venta", "¿Cómo usar el POS?"
- Renderizado markdown con `react-markdown` (nueva dependencia)

### 4. `src/App.tsx`
- Ruta `/asesor-ventas` dentro del layout protegido

### 5. `src/components/layout/AppSidebar.tsx`
- Agregar "Asesor IA" con icono `Bot` a `sellerNav` y `adminNav`

## UI

```text
┌─────────────────────────────────┐
│  🤖 Asesor de Ventas IA        │
│─────────────────────────────────│
│  [¿Cómo cotizar?] [Descuentos] │
│  [Tips de cierre] [Usar POS]   │
│                                 │
│  👤 ¿Cuánto descuento puedo    │
│     dar en Xcaret?              │
│                                 │
│  🤖 Para Xcaret, el margen...  │
│     (streaming markdown)        │
│                                 │
│  ┌─────────────────────┐ [➤]   │
│  │ Escribe tu pregunta  │       │
│  └─────────────────────┘        │
└─────────────────────────────────┘
```

| Archivo | Cambio |
|---|---|
| `package.json` | Agregar `react-markdown` |
| `supabase/functions/sales-advisor/index.ts` | Nuevo: edge function streaming con GPT-5-mini |
| `supabase/config.toml` | Agregar config función |
| `src/pages/AsesorVentas.tsx` | Nuevo: página de chat |
| `src/App.tsx` | Agregar ruta |
| `src/components/layout/AppSidebar.tsx` | Agregar nav item |

