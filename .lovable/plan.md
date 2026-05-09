
# Sincronizar Entradas a Parques (Sin Transporte) — Baja

## Objetivo
Que los precios "Sin Transporte" (Reporte = costo, Taquilla = público) en USD de cada parque coincidan exactamente con la tabla de la imagen, tanto para Extranjeros como para Nacionales, en cada ficha de tour.

## Cómo se almacenará
- **Tour base (`tours`)** con `service_type = 'entry_only'`, `supplier_currency = 'USD'`. Aquí se guarda el Reporte/Taquilla "general" (USD) y se queda como referencia.
- **Matriz (`tour_price_variants`)** con 4 filas por servicio: `Adulto/Extranjero`, `Menor/Extranjero`, `Adulto/Nacional`, `Menor/Nacional`. `sale_price = Taquilla USD`, `net_cost = Reporte USD`, `package_name = ''` (general), `zone = 'Riviera Maya'`. El descuento por Nacionalidad queda implícito por el precio diferenciado.
- Los **paquetes "Con transporte"** existentes en `tour_packages` se mantienen intactos (no se tocan).

## Tours existentes a actualizar (entry_only)
Se ajustan precios USD del tour base y se reemplaza la matriz:

| Servicio | Adulto Reporte | Adulto Taquilla | Menor Reporte | Menor Taquilla |
|---|---|---|---|---|
| Xcaret Plus | 159 / 143 | 179.00 / 161.10 | 119 / 107 | 134.25 / 120.83 |
| Xelha All Inclusive | 109 / 100 | 129.00 / 116.10 | 81 / 75 | 96.75 / 87.08 |
| Xplor Día | 135 / 122 | 159.00 / 143.10 | 87 / 87 | 119.25 / 107.33 |
| Xplor Fuego | 118 / 106 | 139.00 / 125.10 | 89 / 80 | 104.25 / 93.83 |
| Xenses | 76 / 68 | 89.00 / 80.10 | 57 / 51 | 66.75 / 60.08 |
| Xoximilco | 100 / 91 | 119.00 / 107.10 | 75 / 68 | 89.25 / 80.33 |
| ATV Xperience Doble (por pax) | 55 / 50 | 69.00 / 62.10 | NA | NA |
| ATV Xperience Sencilla | 71 / 64 | 89.00 / 80.10 | NA | NA |

(Formato: Extranjero / Nacional)

Acciones:
- `UPDATE tours` → fijar `service_type='entry_only'`, `price_adult_usd`, `price_child_usd` (Reporte Extranjero), `public_price_adult_usd`, `public_price_child_usd` (Taquilla Extranjero), `season='regular'`.
- Borrar variantes anteriores del tour y reinsertar 4 nuevas con valores Extranjero y Nacional.

> Nota: Xcaret Plus y Xelha Light hoy están como `with_transport` con paquete "Solo Entrada". Los voy a separar: el tour base pasa a `entry_only` (entradas sueltas) y los paquetes con transporte permanecen. Si prefieres que sean tours independientes, dímelo antes de implementar.

## Tours nuevos a crear (entry_only)
| Servicio | Adulto Ext. Reporte / Taquilla | Menor Ext. | Adulto Nac. | Menor Nac. |
|---|---|---|---|---|
| Entradas Xcaret BÁSICO | 132 / 149.00 | 99 / 111.75 | 119 / 134.10 | 89 / 100.58 |
| Entradas Xcaret NOCHE | 96 / 109.00 | 72 / 81.75 | 88 / 98.10 | 66 / 73.58 |
| Entradas Catamarán PRIME (con muelle) | 83 / 139.00 | 63 / 104.25 | 75 / 125.10 | 56 / 93.83 |
| Entradas Catamarán LIGHT (con muelle) | 59 / 99.00 | 45 / 74.25 | 53 / 89.10 | 40 / 66.83 |
| Entradas ATV Xperience Doble + Jetboat (por pax) | 71 / 89.00 | NA | 64 / 80.10 | NA |
| Entradas ATV Xperience Sencilla + Jetboat | 87 / 109.00 | NA | 78 / 98.10 | NA |

Cada uno se da de alta con: categoría inferida (Parque / Catamarán / ATV), `service_type='entry_only'`, `supplier_currency='USD'`, `season='regular'`, sin operador asignado (lo defines luego), tax = 0, y matriz completa por nacionalidad.

## Aclaraciones técnicas
- Los precios se guardan en USD (no se convierten a MXN aquí; la conversión la hace el front con el tipo de cambio configurado).
- `zone` = `Riviera Maya` por convención (única zona aplicable a parques).
- Para ATV Menor (NA) se omite la fila de Menor en la matriz y `price_child_usd = 0`.
- No se modifican `tour_packages` con transporte ni Promociones Xcaret.
- Cambios en datos via `supabase--insert` (UPDATE/INSERT/DELETE), sin migraciones de esquema.

## Verificación posterior
- Consultar `tour_price_variants` por cada tour y confirmar 4 filas (o 2 para ATV) con valores correctos.
- Abrir 2-3 fichas en /tours y validar que el precio público y el reporte coincidan con la imagen.
