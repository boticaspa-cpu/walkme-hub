

# Agregar confirmación de eliminación

Usar `AlertDialog` de shadcn/ui para pedir confirmación antes de eliminar un paquete Xcaret.

## Cambios en `src/pages/PaquetesXcaret.tsx`

1. Importar `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle`
2. Agregar estado `deletingId` para trackear qué paquete se quiere eliminar
3. Reemplazar el `onClick` directo del botón de eliminar por `setDeletingId(pkg.id)`
4. Agregar el `AlertDialog` con mensaje "¿Estás seguro de eliminar este paquete?" y botones Cancelar / Eliminar

