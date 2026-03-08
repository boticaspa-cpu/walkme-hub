

# Plan: Asesor IA como chat flotante en todas las páginas

## Resumen
Convertir el Asesor de Ventas de una página independiente a un **widget de chat flotante** (botón en esquina inferior derecha → se expande como panel de chat), visible en todas las páginas autenticadas.

## Cambios

### 1. Nuevo componente `src/components/chat/FloatingChatWidget.tsx`
- Botón flotante (`fixed bottom-4 right-4 z-50`) con icono `Bot`
- Al hacer click se expande un panel de chat (~400px ancho, ~500px alto) con la misma lógica que ya existe en `AsesorVentas.tsx`
- Botón para cerrar/minimizar
- El historial se mantiene en memoria mientras el panel está montado

### 2. `src/components/layout/AppLayout.tsx`
- Agregar `<FloatingChatWidget />` dentro del layout, después del `<Outlet />`
- Así aparece en todas las páginas autenticadas

### 3. `src/App.tsx`
- Eliminar la ruta `/asesor-ventas` y el import de `AsesorVentas`

### 4. `src/components/layout/AppSidebar.tsx`
- Eliminar "Asesor IA" de `adminNav` y `sellerNav`

### 5. `src/pages/AsesorVentas.tsx`
- Se puede eliminar (la lógica se mueve al widget)

| Archivo | Cambio |
|---|---|
| `src/components/chat/FloatingChatWidget.tsx` | Nuevo: widget flotante con toda la lógica del chat |
| `src/components/layout/AppLayout.tsx` | Agregar el widget |
| `src/App.tsx` | Eliminar ruta `/asesor-ventas` |
| `src/components/layout/AppSidebar.tsx` | Eliminar nav item "Asesor IA" |
| `src/pages/AsesorVentas.tsx` | Eliminar archivo |

