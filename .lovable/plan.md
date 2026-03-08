

# Plan: Flujo obligatorio de apertura/cierre de caja

## Resumen

Agregar un componente `CashSessionGuard` que se muestre como modal/banner en el Dashboard (o en el AppLayout) para:

1. **Al entrar**: Si no hay caja abierta hoy, mostrar diálogo para abrir caja (permitiendo fondo $0).
2. **Cierre pendiente**: Detectar si hay una sesión abierta de un día anterior y mostrar alerta de que debe cerrarla antes de continuar.
3. **Permitir fondo $0**: Quitar cualquier validación que impida abrir sin fondo.

## Cambios

### 1. Nuevo componente `src/components/cash/CashSessionGuard.tsx`

- Usa `useCashSession()` para verificar estado.
- **Caso A**: Hay una sesión abierta de un día anterior (`activeSession.business_date < hoy`) → Muestra diálogo bloqueante: "Tienes una caja pendiente de cerrar del día {fecha}. Debes cerrarla antes de continuar." con botón que lleva a `/cierre-diario`.
- **Caso B**: No hay sesión abierta → Muestra diálogo: "Abre caja para comenzar tu día" con campo de fondo inicial (default 0, no obligatorio) y botón "Abrir Caja".
- **Caso C**: Sesión abierta de hoy → No muestra nada, deja pasar.

### 2. Modificar `src/components/layout/AppLayout.tsx`

- Importar y renderizar `<CashSessionGuard />` dentro del layout, después del `<Outlet />`.
- Se muestra como Dialog modal sobre cualquier página.

### 3. Modificar `src/pages/CierreDiario.tsx`

- Asegurar que el campo de fondo inicial acepte 0 sin error (ya lo hace, solo confirmar).

## Lógica clave

```text
Al montar AppLayout:
  ├─ Carga sesión activa (useCashSession)
  ├─ Si hay sesión abierta con business_date < hoy
  │    → Modal: "Cierre pendiente del {fecha}" → Ir a Cierre Diario
  ├─ Si no hay sesión abierta
  │    → Modal: "Abre caja" (fondo default 0, permitido)
  └─ Si sesión abierta de hoy → nada
```

Solo se crean/modifican 2 archivos: `CashSessionGuard.tsx` (nuevo) y `AppLayout.tsx` (agregar import + render).

