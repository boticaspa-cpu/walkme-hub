

# Arreglar chat IA y desbordamiento en móvil

## Problemas identificados

1. **Chat IA — input tapado por BottomNav**: El chat ocupa `h-[100dvh]` en móvil y el input queda detrás de la barra de navegación inferior (64px). El usuario no puede escribir.

2. **Chat IA — z-index conflicto**: Tanto el chat como el BottomNav usan `z-50`. El BottomNav se pinta encima del input del chat.

3. **Desbordamiento horizontal general**: Varias páginas tienen elementos con anchos fijos que no se adaptan en pantallas pequeñas (Configuracion, tablas, etc.).

## Cambios

### 1. `FloatingChatWidget.tsx` — Ajustar para no chocar con BottomNav

**Botón flotante**: Mover más arriba en móvil para que no se tape con BottomNav (`bottom-20` ya existe, OK).

**Chat abierto en móvil**:
- Cambiar `h-[100dvh]` → `h-[calc(100dvh-4rem)]` para dejar espacio al BottomNav (64px = 4rem)
- Subir z-index a `z-[60]` para quedar sobre el BottomNav
- Agregar `pb-safe` (safe area) al formulario de input

### 2. `AppLayout.tsx` — Ocultar BottomNav cuando chat está abierto

Pasar un estado o simplemente usar CSS: cuando el chat está abierto en móvil, elevar su z-index basta para cubrir el BottomNav.

### 3. `index.css` — Overflow global

Agregar `overflow-x: hidden` al `html` y `body` como respaldo.

### 4. `Configuracion.tsx` — Anchos fijos responsivos

- `w-[70px]` → `w-[70px]` (OK, es un input numérico pequeño)
- `w-[110px]` → `w-full sm:w-[110px]` en el select de rol

### 5. Tablas en general

Verificar que los contenedores de tabla tienen `overflow-x-auto` (la mayoría ya lo tienen).

## Archivos a modificar
- `src/components/chat/FloatingChatWidget.tsx` — z-index, altura móvil, padding bottom
- `src/pages/Configuracion.tsx` — anchos responsivos en selectores
- `src/index.css` — overflow-x hidden global como respaldo

