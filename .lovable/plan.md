

# Plan: Carousel de imágenes en TourShowroom

## Cambios

### 1. Agregar imports (línea 1-19)
Añadir imports de `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext` y `AspectRatio`.

### 2. Reemplazar `<img>` por Carousel (líneas 136-141)
Sustituir la imagen única por:
- `Carousel` con `opts={{ loop: true }}`
- `.map()` sobre `tour.image_urls` (o fallback a array con placeholder)
- Cada `CarouselItem` contiene `AspectRatio` ratio 16/9 con `<img>` con `object-cover`
- `CarouselPrevious` y `CarouselNext` posicionados como overlay (dentro del carousel, con clases absolutas ajustadas para quedar sobre la imagen)
- Indicador de dots usando estado del carousel API (`selectedIndex`)
- Si `image_urls` está vacío/null, mostrar un solo slide con `PLACEHOLDER_IMG`

### Estructura visual resultante:
```text
┌──────────────────────────────┐
│  ◀  [  imagen 16:9  ]  ▶    │
│         ● ○ ○ ○              │
└──────────────────────────────┘
```

No se tocan edge functions, base de datos, ni otros componentes.

