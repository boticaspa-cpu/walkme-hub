

# Optimización móvil de Promociones y Paquetes Xcaret

## Problema
Las tablas de ambas páginas tienen demasiadas columnas visibles en móvil, causando scroll horizontal. Los botones de acciones (Cotizar, Reservar, Editar, Eliminar) están en línea horizontal y desbordan el ancho.

## Cambios

### 1. `src/pages/Promociones.tsx` — Tabla
- Ocultar columnas Subtotal/Descuento/Total en móvil (`hidden sm:table-cell`)
- Mostrar esos montos **dentro de la celda Nombre** en móvil como texto compacto apilado
- Convertir los botones de acciones a layout vertical en móvil: apilar Cotizar/Reservar como iconos pequeños, o usar un `DropdownMenu` en móvil
- Reemplazar la fila horizontal de botones por un `DropdownMenu` con `MoreHorizontal` en pantallas pequeñas, mostrando los botones normales solo en `hidden sm:flex`

### 2. `src/pages/PaquetesXcaret.tsx` — Tabla
- Misma estrategia: ocultar Subtotal y Dcto. paquete en móvil (ya están con `hidden sm:table-cell`)
- Los botones Cotizar/Reservar/Eliminar en la última celda → `DropdownMenu` en móvil
- Mostrar subtotal resumido dentro de la celda "Paquete" en móvil

### 3. Ambas páginas — Diálogos/Modales
- Los diálogos ya tienen `sm:max-w-2xl max-h-[90dvh] overflow-y-auto` (correcto)
- Asegurar que `DialogFooter` use `flex-col sm:flex-row` para apilar botones en móvil
- El tour selector y calculadora ya funcionan bien (son flex verticales)

### Patrón concreto para acciones móviles
En móvil: un solo botón `MoreHorizontal` que abre un `DropdownMenu` con las opciones.
En desktop: los botones normales visibles.

```text
Mobile:                    Desktop:
┌────────┬──────┐         ┌────────┬──────────────────────────────┐
│ Nombre │  ⋯   │         │ Nombre │ Cotizar Reservar ✏️ 🗑️     │
│ $10k   │      │         │        │                              │
│ -$2k   │      │         │        │                              │
│ =$8k   │      │         │        │                              │
└────────┴──────┘         └────────┴──────────────────────────────┘
```

### Archivos a modificar
- `src/pages/Promociones.tsx`
- `src/pages/PaquetesXcaret.tsx`

