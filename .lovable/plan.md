

# Agregar accesos directos de Promociones y Paquetes Xcaret al Dashboard

## Cambio

En la sección de accesos rápidos del Dashboard (la grid con "Nueva Cotización", "Nueva Reserva", etc.), agregar dos tarjetas más:

- **Promociones** (icono `Tag`) → enlace a `/promociones`
- **Paquetes Xcaret** (icono `Package`) → enlace a `/paquetes-xcaret`

## Archivo a modificar

### `src/pages/Dashboard.tsx`
- Importar iconos `Tag` y `Package` de lucide-react
- Cambiar la grid de `grid-cols-2 lg:grid-cols-4` a `grid-cols-2 lg:grid-cols-3` (6 items, 3 columnas en desktop)
- Agregar las dos nuevas tarjetas con el mismo estilo de las existentes

