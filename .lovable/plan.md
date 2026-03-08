

# Plan: Integrar Pagos a Proveedores, Comisiones y Gastos al Flujo de Trabajo (Solo Admin)

## Resumen

3 cambios principales:
1. **Auto-generar comisión al cobrar** usando tasa por vendedor
2. **Dashboard admin** con 3 KPIs financieros nuevos
3. **Cierre Diario** con resumen financiero

---

## 1. DB: Agregar campo `commission_rate` a `profiles`

```sql
ALTER TABLE profiles ADD COLUMN commission_rate numeric NOT NULL DEFAULT 0.10;
```

Esto permite al admin configurar la tasa de comisión por vendedor (ej: 0.10 = 10%).

---

## 2. Auto-generar comisión al cobrar (`ReservationCheckout.tsx`)

Después del paso 5 (operator_payable), agregar paso 6:

- Leer `commission_rate` del perfil del vendedor (`user.id`)
- Insertar en `commissions`: `seller_id`, `sale_id`, `rate`, `amount_mxn = totalMxn * rate`

---

## 3. Dashboard Admin — 3 KPIs financieros nuevos (`Dashboard.tsx`)

Solo visibles si `role === "admin"`:

| KPI | Query |
|---|---|
| Pagos pendientes a proveedores | `operator_payables` WHERE status=pending, mes actual → SUM(amount_mxn) |
| Comisiones generadas del mes | `commissions` del mes → SUM(amount_mxn) |
| Gastos: pagado vs planeado | `expense_items` del mes → SUM(paid) vs SUM(estimated) |

Se muestran como una fila de 3 cards debajo de los KPIs actuales.

---

## 4. Cierre Diario — Sección financiera (`CierreDiario.tsx`)

Solo visible si `role === "admin"`. Debajo del resumen de caja:

- **Pagos a proveedores del día**: operator_payables con service_date = hoy
- **Comisiones generadas**: commissions vinculadas a sales del día
- **Gastos pagados hoy**: expense_items con paid_at = hoy

---

## 5. Configuración: Editar tasa por vendedor

En la sección de usuarios de `Configuracion.tsx`, agregar campo editable de "% Comisión" junto al nombre/rol de cada vendedor.

---

| Archivo | Cambio |
|---|---|
| **Migration SQL** | Agregar `commission_rate` a `profiles` |
| `ReservationCheckout.tsx` | Paso 6: auto-insert comisión |
| `Dashboard.tsx` | 3 KPIs financieros (admin only) |
| `CierreDiario.tsx` | Sección resumen financiero (admin only) |
| `Configuracion.tsx` | Campo editable tasa comisión por vendedor |

