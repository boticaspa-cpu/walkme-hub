# Corrección de Paquetes Xcaret

## Diagnóstico
Ya revisé la razón exacta.

Hoy la pantalla de **Paquetes Xcaret** no está fallando por el menú o por el modal: está filtrando demasiado los tours.

En `src/pages/PaquetesXcaret.tsx` la lista se arma con estas reglas:
- solo operadores **Xcaret Blue Dreams** y **Xcaret McSERI Tours**
- solo tours `active = true`
- solo `service_type = 'with_transport'`
- excluye títulos con `Fury` y `ATV`

Con los datos actuales del backend, **solo 2 tours cumplen ese filtro**:
- Xichén Clásico
- Xichén Deluxe

Los demás tours Xcaret activos sí existen, pero están guardados como `entry_only`, por ejemplo:
- Xcaret Full Day
- Xcaret Plus
- Xelha Light
- Xenses
- Xoximilco
- Xplor Día
- Xplor Fuego

Por eso el modal solo te deja elegir esos dos.

## Plan de solución

### 1. Ajustar el filtro del selector de tours
Modificar `src/pages/PaquetesXcaret.tsx` para que el selector ya no dependa únicamente de `with_transport`.

Lo cambiaré para mostrar **todos los tours Xcaret activos elegibles**, manteniendo fuera únicamente los productos que realmente no deban entrar al paquete (por ejemplo Fury y ATV, si esa exclusión sigue siendo correcta).

Resultado esperado:
- al crear paquete aparecerá el catálogo Xcaret completo que sí quieres combinar
- dejarán de verse solo 2 opciones

### 2. Mantener la lógica de cálculo del paquete
No cambiaré la parte del cálculo del paquete, solo la fuente de tours elegibles.

Se conservará:
- suma de tours seleccionados
- descuento del paquete
- generación del precio final del paquete

Así el cambio corrige la selección sin romper la fórmula actual.

### 3. Validar compatibilidad con Cotizar y Reservar
Revisaré el flujo que manda un paquete Xcaret a:
- `Cotizaciones`
- `Reservas`

Ese flujo ya trabaja con `tour_id` del paquete, así que la idea es confirmar que al incluir más tours del catálogo:
- se precarguen correctamente
- no fallen los items del paquete
- se mantenga la nota `Paquete Xcaret: ...`

### 4. Dejar la regla más clara para evitar que vuelva a pasar
Aprovecharé para dejar la lógica más explícita en código, para que el módulo no dependa de una restricción vieja de negocio que ya no coincide con lo que necesitas.

## Archivos a tocar
- `src/pages/PaquetesXcaret.tsx` — ajuste principal del filtro
- posible revisión menor en `src/pages/Cotizaciones.tsx` y `src/pages/Reservas.tsx` solo si hace falta reforzar compatibilidad, pero en principio no parece requerir cambios grandes

## Impacto
- No requiere migraciones
- No requiere cambios de base de datos
- No afecta autenticación
- Es un cambio localizado al módulo de Paquetes Xcaret

## Resultado esperado después del fix
Cuando abras **Nuevo paquete Xcaret**, en “Tours incluidos” ya no verás solo `Xichén Clásico` y `Xichén Deluxe`, sino el catálogo Xcaret activo permitido para paquetes.