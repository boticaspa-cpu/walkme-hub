

# Plan: Corregir mapeo de paquetes en Matriz de Precios

## Problema
1. El Sheet tiene "Xplor Día - Con transporte" en la columna Paquete
2. El importador lo lee correctamente, pero el **Select del editor** solo muestra paquetes del `PackageEditor` — si el nombre importado no coincide exactamente, aparece vacío
3. "Sin paquete (General)" no debería existir como opción

## Solución

### 1. `PriceVariantEditor.tsx` — Cambiar Select de paquete a Input con datalist
- Reemplazar el `<Select>` de paquete por un `<Input>` que permita texto libre
- Agregar un datalist con los paquetes existentes como sugerencias (autocompletado)
- Eliminar la opción "Sin paquete (General)"
- Así, los nombres importados del Sheet se preservan tal cual

### 2. `Tours.tsx` — Mejorar mapeo de matriz
- Cuando se importa la matriz y el paquete viene del Sheet, usarlo directamente como string sin forzar `GENERAL_PACKAGE`
- Si el paquete importado no existe en la lista de paquetes del tour, auto-crearlo en el `PackageEditor` para mantener consistencia

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/components/tours/PriceVariantEditor.tsx` | Cambiar Select de paquete a Input con datalist, eliminar GENERAL_PACKAGE |
| `src/pages/Tours.tsx` | Auto-crear paquetes faltantes al importar matriz |

