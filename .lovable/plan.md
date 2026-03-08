

# Integración de Paquetes Xcaret en Cotizaciones y Reservas

## Enfoque recomendado

La opción más limpia es **agregar botones "Cotizar" y "Reservar" en cada paquete** dentro de la página de Paquetes Xcaret. Al hacer clic, el sistema redirige a Cotizaciones o Reservas con el paquete pre-cargado, reutilizando los formularios que ya existen. No se crean flujos nuevos ni ventanas independientes — solo se pre-llenan los datos del paquete automáticamente.

```text
┌─────────────────────────────────────┐
│  Paquetes Xcaret (tabla)            │
│  ┌─────────────┬────────┬────────┐  │
│  │ Xcaret+Xplor│ Cotizar│Reservar│  │
│  │ Xel-Há+Xoxim│ Cotizar│Reservar│  │
│  └─────────────┴────────┴────────┘  │
└──────────────┬──────────────────────┘
               │ click "Cotizar"
               ▼
┌─────────────────────────────────────┐
│  /cotizaciones?promo_package_id=X   │
│  → Diálogo abierto automáticamente  │
│  → Tours del paquete ya agregados   │
│  → Precios Xcaret pre-calculados    │
│  → Solo falta: cliente, zona, fecha │
└─────────────────────────────────────┘
```

## Cambios por archivo

### 1. `src/pages/PaquetesXcaret.tsx`
- Agregar botones "Cotizar" y "Reservar" en cada fila de la tabla (junto al switch y delete)
- Al hacer clic, navegar con `useNavigate` a:
  - `/cotizaciones?promo_package_id={id}`
  - `/reservas?promo_package_id={id}`

### 2. `src/pages/Cotizaciones.tsx`
- Detectar `promo_package_id` en los search params
- Fetch del paquete + sus tours asociados (`promo_package_tours`)
- Abrir automáticamente el diálogo de creación
- Pre-llenar los `items[]` con cada tour del paquete, usando el precio calculado del paquete (public_price_adult dividido proporcionalmente, o el total del paquete como descuento)
- Mostrar un badge indicando "Paquete Xcaret: {nombre}"

### 3. `src/pages/Reservas.tsx`
- Misma lógica: detectar `promo_package_id` en search params
- Pre-cargar el primer tour del paquete como tour principal
- Agregar los demás como `reservation_items`
- Aplicar el precio total del paquete
- Mostrar badge del paquete

## Flujo del usuario

1. Entra a Paquetes Xcaret, ve sus paquetes creados
2. Hace clic en "Cotizar" en el paquete deseado
3. Se abre Cotizaciones con el formulario pre-llenado: todos los tours del paquete con sus precios Xcaret
4. Solo necesita agregar: cliente, zona de pickup, nacionalidad, fechas
5. Guarda la cotización normalmente

Lo mismo para "Reservar" — redirige a Reservas con datos pre-cargados.

## Notas técnicas
- Los precios del paquete ya están guardados en `promo_packages.public_price_adult_usd` — se distribuyen proporcionalmente entre los tours o se manejan como descuento global
- No se necesitan cambios en la base de datos
- Se reutiliza 100% de los flujos existentes de cotización y reserva

