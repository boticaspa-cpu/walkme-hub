

# Reducir tamaño de MappingCards

Hacer las cards de mapeo más compactas: reducir padding, tamaño de iconos y texto.

## Cambios en `src/components/tours/MappingCards.tsx`

- Padding: `py-5 px-3` → `py-3 px-2`
- Iconos: `h-6 w-6` → `h-5 w-5`
- Texto: `text-xs` → `text-[11px]`
- Gap entre icono y texto: `gap-2` → `gap-1`
- Gap entre cards: `gap-3` → `gap-2`

Resultado: cards ~50% más compactas, misma funcionalidad.

