

# Plan: Página de Paquetes Promocionales Xcaret

## Concepto

Página dedicada para armar paquetes promocionales del grupo Xcaret aplicando las reglas del contrato:

- **Precio Público Adulto** = 80% de la suma de precios públicos USD de los tours elegidos
- **Precio Público Menor** = 75% del precio público adulto del paquete
- **Tarifa Preferencial Adulto** = 70% del precio público adulto del paquete
- **Tarifa Preferencial Menor** = 75% de la tarifa preferencial adulto
- **Comisión**: 30%
- Mínimo 2 tours, vigencia 15 días, intransferible

## Modelo de datos

### Tabla `promo_packages`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| name | text | "2 días Xcaret + Xel-Há" |
| description | text | Notas |
| discount_rule | text | 'xcaret_contract' (para futuro soporte de otras reglas) |
| public_price_adult_usd | numeric | Calculado: 80% suma |
| public_price_child_usd | numeric | 75% del adulto |
| preferential_adult_usd | numeric | 70% del adulto |
| preferential_child_usd | numeric | 75% del preferencial adulto |
| commission_rate | numeric | 0.30 |
| active | boolean | true |
| created_at | timestamptz | |

### Tabla `promo_package_tours` (tours incluidos)
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| promo_package_id | uuid FK → promo_packages | |
| tour_id | uuid FK → tours | |

### RLS
- Lectura: todos los autenticados
- Escritura: solo admin (usando `has_role`)

## Página `/paquetes-xcaret` (admin + seller lectura)

### Interfaz
1. **Lista de paquetes** creados con nombre, tours incluidos, precios calculados, estado
2. **Crear/Editar paquete**:
   - Nombre del paquete
   - Selector multi-tour (filtrado a tours del grupo Xcaret por categoría/operador)
   - **Calculadora automática en tiempo real**: al seleccionar tours, suma los `public_price_adult_usd` y aplica las 4 fórmulas del contrato
   - Muestra la tabla de precios resultante (Público Adulto/Menor, Preferencial Adulto/Menor)
   - Toggle activo/inactivo

### Cálculo en vivo (ejemplo)
```text
Tours seleccionados:
  Xcaret    → $119.99 USD adulto
  Xel-Há   → $139.99 USD adulto
  Suma      = $259.98

Precio Público Adulto  = $259.98 × 0.80 = $207.98
Precio Público Menor   = $207.98 × 0.75 = $155.99
Tarifa Pref. Adulto    = $207.98 × 0.70 = $145.59
Tarifa Pref. Menor     = $145.59 × 0.75 = $109.19
Comisión               = 30%
```

## Navegación
- Agregar "Paquetes Xcaret" al sidebar admin (icono `BadgePercent`) entre Destinos y Cotizaciones
- También visible para sellers (solo lectura para consultar precios)
- Ruta `/paquetes-xcaret` en `App.tsx`

## Archivos

| Archivo | Acción |
|---|---|
| Migración SQL | Crear `promo_packages` y `promo_package_tours` con RLS |
| `src/pages/PaquetesXcaret.tsx` | Página CRUD con calculadora |
| `src/App.tsx` | Agregar ruta |
| `src/components/layout/AppSidebar.tsx` | Agregar enlace en adminNav y sellerNav |

