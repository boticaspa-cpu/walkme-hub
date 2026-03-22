

# Mejorar página de Comisiones

## Resumen
Reescribir `src/pages/Comisiones.tsx` para usar la tabla `commissions` en lugar de `seller_commissions`, con KPIs, tabla mejorada, dialog de edición y dialog de pago.

## Cambios

### `src/pages/Comisiones.tsx` — Reescritura completa

**1. Query**: Cambiar de `seller_commissions` a `commissions` con joins a `profiles` (seller + confirmed_by), `reservations` → `clients`.

**2. KPIs** (4 cards arriba): Pendientes de Pago, Pagadas Este Mes, Ganancia Agencia (Mes), Ganancia Total (Mes). Iconos: `Clock`, `CheckCircle`, `Building2`, `TrendingUp`.

**3. Tabla con columnas**:
- Recibo (`receipt_number` o "Pendiente")
- Fecha (`created_at`)
- Vendedor (`seller.full_name`) — solo admin
- Reserva (cliente)
- Ganancia Bruta (`gross_profit`)
- Fee Tarjeta (`card_fee_amount`) — hidden en móvil
- Ganancia Neta (`net_profit`) — hidden en móvil
- Comisión Vendedor (`commission_amount`)
- Comisión Agencia (`agency_commission`) — hidden en móvil
- Estado (badge)
- Acciones (Editar + Pagar para admin en pending, Recibo para paid)

**4. EditCommissionDialog** (inline en el mismo archivo):
- Campos: comisión vendedor (editable), comisión agencia (calculada = net_profit - comisión vendedor)
- Mutation: update `commission_amount` y `agency_commission` en `commissions`

**5. PayCommissionDialog** (inline en el mismo archivo):
- Campos: método de pago (select), monto pagado (input)
- Genera `receipt_number` = `COM-{timestamp}`
- Mutation: update `status`, `paid_at`, `payment_method`, `payment_amount`, `receipt_number`, `confirmed_by`

**6. Filtros**: Se mantienen estado + vendedor (admin).

### Detalle técnico
- La tabla `commissions` ya tiene todas las columnas necesarias: `gross_profit`, `net_profit`, `commission_amount`, `agency_commission`, `card_fee_amount`, `receipt_number`, `payment_method`, `payment_amount`, `confirmed_by`, `status`, `paid_at`
- RLS: Admin tiene full access, seller solo SELECT de sus propias — no se necesitan cambios de DB
- No se necesitan migraciones

### Archivo a modificar
- `src/pages/Comisiones.tsx` — reescritura completa

