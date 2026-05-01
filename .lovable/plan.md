# Corrección Paquetes Xcaret — clasificación correcta

## Contexto
La regla de negocio es: **solo tours con transporte** entran en paquetes Xcaret combinables. Esa regla es correcta. El problema es que en la base de datos los tours principales de Xcaret (Full Day, Plus, Xelha, Xenses, Xoximilco, Xplor Día/Fuego) están mal marcados como `entry_only`, por eso solo aparecían Xichén Clásico y Deluxe.

## Solución (2 partes)

### 1. Migración: reclasificar tours Xcaret a `with_transport`

Actualizar `service_type = 'with_transport'` en los tours activos de Blue Dreams / McSERI Tours que sí incluyen transporte:

- Xcaret Full Day
- Xcaret Plus: Entrada + Comida Buffet
- Xelha Light
- XENSES
- Xoximilco
- Xplor Día
- Xplor Fuego

Quedan como `entry_only` (no entran en paquetes):
- Ferry Xcaret Cozumel sencillo (solo traslado marítimo)
- ATV's Experience Sencilla (ya excluido por nombre)
- Catamarán Fury Cozumel (ya excluido por nombre)

### 2. Restaurar filtro estricto en `src/pages/PaquetesXcaret.tsx`

Volver a agregar `.eq("service_type", "with_transport")` en el query de tours, para que la regla de negocio quede protegida hacia el futuro (si alguien crea un tour `entry_only` no se cuele al paquete por error).

## Resultado esperado
En el diálogo "Nuevo paquete Xcaret" aparecerán los ~9 tours activos elegibles: Xichén Clásico, Xichén Deluxe, Xcaret Full Day, Xcaret Plus, Xelha Light, Xenses, Xoximilco, Xplor Día, Xplor Fuego, ATV Doble.

## Archivos
- Migración SQL (UPDATE en `tours`)
- `src/pages/PaquetesXcaret.tsx` — restaurar filtro `with_transport`
- Actualizar `mem://features/xcaret-package-logic` para reflejar la regla correcta