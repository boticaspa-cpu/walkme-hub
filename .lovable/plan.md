
# Auditoría del flujo de dinero + Apertura de pantallas para vendedores

Hago dos cosas en una corrida: (1) informe senior con hallazgos clasificados por riesgo y queries reales sobre tu BD, (2) implemento los fixes críticos de dinero y abro las pantallas a vendedores con filtrado propio. Lo no crítico queda como Fase 2 para que decidas.

---

## 1. Hallazgos de la BD (queries ejecutadas hoy)

### 🔴 CRÍTICO — afectan dinero real

| # | Hallazgo | Impacto |
|---|----------|---------|
| C1 | **11 de 17 ventas (65%) no tienen `operator_payable`**. No existe el costo al operador en cuentas por pagar. | No se sabe a quién pagarle. Ganancia/reporte irreal. |
| C2 | **10 de 10 ventas en efectivo NO crean `cash_movement` de entrada (`in_cash`)**. Solo se registran salidas. | La caja arranca en 0 y nunca refleja ingresos por ventas → cuadre imposible, "Mi Caja" miente. |
| C3 | **2 `operator_payables` en USD sin `exchange_rate_used` ni `equivalent_mxn`**. | No se pueden sumar correctamente a reportes en MXN. |
| C4 | **Card fee 4% no se persiste en `sales`** (solo en `commissions`, columna `card_fee_amount`). Como hoy todas las ventas son de admin → 0 comisiones → 0 card fee guardado en ningún lado. | Reportes de ganancia neta sobreestimados ~4% en ventas con tarjeta (7 de 17). |
| C5 | **6 de 8 `operator_payables` con `status='paid'` y `payment_method=NULL`**. | No se sabe cómo se pagó al operador → caja descuadra, auditoría imposible. |
| C6 | **4 ventas sin `cash_session_id`**. | Quedan fuera del cierre diario. |

### 🟠 ALTO — riesgo estructural

| # | Hallazgo | Impacto |
|---|----------|---------|
| A1 | **Vendedores hoy NO ven ninguna pantalla de dinero** (Cuentas por Pagar, Gastos, Comisiones, Reportes, Cierre, Transferencias). Hardcoded a admin en `AppSidebar.tsx` y guards en rutas. | No pueden trabajar de forma autónoma. |
| A2 | El cálculo de **`reporte` (costo operador)** en checkout depende de `tour_price_variants` por (zona, nacionalidad, pax_type, package). Si falta una variante, queda en 0 → ganancia inflada → si fuera vendedor, comisión inflada. | Riesgo cuando entren vendedores. |
| A3 | **No hay transacción** alrededor de `sale → sale_items → operator_payable → commission → cash_movement`. Si una falla, las otras quedan creadas. | Estado parcial sin rollback. |
| A4 | RLS de `commissions`, `operator_payables`, `expense_items` es **solo admin** (cmd `ALL`). Vendedor no puede leer ni sus propias comisiones por API directa, solo a través de joins en código. | Tras abrir UI debemos abrir RLS por ownership. |

### 🟡 MEDIO

| # | Hallazgo |
|---|----------|
| M1 | `commissions.payment_method` vs `operator_payables.payment_method` usan vocabularios distintos (`cash` vs `cash_mxn`/`cash_usd`). |
| M2 | No hay tipo de cambio configurable persistido por pago (se usa fallback de settings). |
| M3 | No hay reporte "salidas vs entradas por sesión de caja" en pantalla. |
| M4 | Card fee es un parámetro hardcoded (4%) en varios lugares — debería vivir en `settings`. |

### 🟢 BAJO
- Algunas tablas no tienen `updated_at` automático.
- Falta índice en `operator_payables(sale_id)` y `commissions(sale_id)` (los chequeos hacen seq scans, hoy es trivial pero crecerá).

---

## 2. Implementación inmediata (esta corrida)

### Fase A — Fixes críticos de dinero

1. **C2 fix: ingreso de venta en efectivo → `cash_movement type='in_cash'`**
   - En `ReservationCheckout.tsx` y `POS.tsx`, al insertar `sales` con `payment_method='cash'` y `cash_session_id` activo, crear `cash_movement` `in_cash` con `amount_mxn = total_mxn`, `reference = sale.id`.
   - Si la venta es mixta (efectivo + tarjeta), solo la parte cash.

2. **C1 fix: garantizar `operator_payable` por venta**
   - En el flujo de checkout, calcular `reporte` por cada `sale_item` desde `tour_price_variants.net_cost_mxn` (o `net_cost_usd × tipo cambio`), y crear `operator_payable` por operador agrupando los items.
   - Idempotencia: si ya existe payable para `(sale_id, operator_id)`, no duplicar.
   - Si falta variante → bloquear checkout con mensaje "Configura costo del operador para zona X" (en vez de pasar con 0).

3. **C4 fix: persistir card fee en `sales`**
   - Migración: añadir `sales.card_fee_mxn numeric DEFAULT 0`.
   - Checkout: si tarjeta, calcular `card_fee = total × 0.04`, guardar en `sales.card_fee_mxn` (no se cobra extra al cliente — es costo interno que reduce ganancia).
   - Reportes y comisiones leen de aquí, no recalculan.

4. **C5 fix: `operator_payables.payment_method` obligatorio al marcar paid**
   - UI `CuentasPorPagar.tsx`: el botón "Marcar pagado" abre diálogo que exige método (transfer / cash_mxn / cash_usd / card) antes de actualizar.
   - Migración: backfill de los 6 históricos a `transfer` (asumido) o dejar pending con nota — te pregunto antes de tocar datos.

5. **C3 fix: USD payables siempre con tipo de cambio**
   - En el diálogo de pago, si `amount_currency='USD'`, requerir `exchange_rate_used` y calcular `equivalent_mxn` automático.
   - Backfill de los 2 históricos con TC actual de `settings`.

6. **C6 fix: sales requiere `cash_session_id` salvo método 100% tarjeta/transfer no-cash**
   - Validar en checkout.

### Fase B — Apertura de pantallas a vendedores (con datos propios)

Respondiste: "vendedores ven lo relacionado a ellos: sus cuentas por pagar a proveedores, sus gastos, transferencias, cotizaciones; catálogos compartidos."

#### Cambios en navegación (`AppSidebar.tsx`, `App.tsx`)
Abrir a vendedor (con filtro `created_by/sold_by = auth.uid()`):
- **Cuentas por Pagar** (sus ventas)
- **Gastos** (los que ellos crearon)
- **Comisiones** (las suyas — ya tienen RLS)
- **Cierre Diario** (su propia caja del día)
- **Reportes** → versión "Mis Resultados" (sus ventas, sus comisiones, su ganancia generada para Walkme)
- **Transferencias** (las suyas)

Quedan **solo admin**:
- Configuración / Categorías / Destinos / Operadores (CRUD)
- Conceptos de gastos recurrentes
- Reportes globales de la agencia
- Aprobación de usuarios

#### Cambios en RLS (migración)
- `operator_payables`: añadir policy `SELECT/UPDATE WHERE sale_id IN (SELECT id FROM sales WHERE sold_by = auth.uid())`.
- `expense_items`: añadir policy `SELECT/UPDATE/INSERT WHERE created_by = auth.uid()`.
- `commissions`: ya tiene SELECT propio; añadir UPDATE propio para marcar "recibida".
- `transfers`: añadir policy `SELECT WHERE created_by = auth.uid()`.

#### Filtros en cada pantalla
Cada página detecta `role !== 'admin'` y agrega `.eq('sold_by'|'created_by', user.id)` al query principal. Helper `useScope()` para no repetir.

### Fase C — Sincronización en tiempo real (bonus pequeño)
Añadir `supabase.channel()` en Dashboard, POS, CuentasPorPagar y Comisiones para que cuando admin/otro vendedor cambie algo, las pantallas se invaliden automáticamente (TanStack Query `invalidateQueries`). Sin esto, hay que recargar.

---

## 3. Lo que NO se toca aún (queda en Fase 2 con tu visto bueno)

- Backfill de los 11 históricos sin payable (requiere decidir operador/costo manualmente o por defecto).
- Mover `card_fee_rate` a `settings`.
- Wrapping de checkout en RPC/transacción (refactor mayor).
- Reportes financieros con "salidas vs entradas por sesión".
- Conciliación automática operador-vs-pagos al cierre de mes.

---

## 4. Archivos a tocar

**Migraciones (1 archivo):**
- `supabase/migrations/...` → `ALTER TABLE sales ADD card_fee_mxn`, nuevas policies RLS, backfill TC en 2 payables USD.

**Frontend:**
- `src/components/reservations/ReservationCheckout.tsx` (in_cash, card_fee, validación reporte)
- `src/pages/POS.tsx` (in_cash en venta directa)
- `src/pages/CuentasPorPagar.tsx` (diálogo método, USD TC obligatorio, filtro por sold_by si seller)
- `src/pages/Gastos.tsx` (filtro propio)
- `src/pages/Comisiones.tsx` (UPDATE propio)
- `src/pages/CierreDiario.tsx` (vista por sesión propia)
- `src/pages/Reportes.tsx` (modo "Mis Resultados" para seller)
- `src/components/layout/AppSidebar.tsx` (abrir items a seller)
- `src/App.tsx` (quitar guards admin de rutas habilitadas)
- `src/hooks/useScope.ts` (nuevo, helper de filtrado por rol)

**Memoria del proyecto:** actualizar `mem://features/commissions-management` y `mem://security/access-rules` con el nuevo modelo abierto-con-filtro.

---

## 5. Preguntas antes de ejecutar (rápidas)

1. **Los 11 históricos sin operator_payable**: ¿los dejo así (solo arreglo a futuro) o intentas un backfill manual luego desde la UI?
2. **Los 6 payables con method=NULL**: ¿asumo `transfer` o los dejo y los corriges manualmente?
3. **Card fee 4%**: ¿confirmas que lo absorbe Walkme (no se le cobra al cliente)? — así está hoy en código nuevo.

Si me dices "dale" sin contestar las 3, asumo: **(1) no backfill, (2) dejar NULL, (3) absorbido por Walkme**.
