

# Dashboard "a prueba de cliente"

## Problema
El Dashboard muestra montos sensibles (ventas del día, comisiones, gastos, pagos a proveedores, ventas recientes). Si un cliente alcanza a ver tu pantalla, expone información privada del negocio. Además, los accesos rápidos a **Promociones** y **Paquetes Xcaret** llevan a páginas con precios netos / márgenes que tampoco quieres exponer.

## Solución: botón "Modo Cliente" + reorganizar accesos

### 1. Botón "Modo Cliente" en el Dashboard
Arriba a la derecha del título "Dashboard General" se agrega un toggle (icono de ojo) con dos estados:
- **Modo Normal** (default): se ve todo como hoy.
- **Modo Cliente** (un clic): oculta cifras y secciones sensibles al instante. Pensado para cuando un cliente está mirando tu pantalla.

Lo que se oculta en Modo Cliente:
- Los 3 KPIs superiores (Ventas del Día, Reservas Hoy, Leads Activos) → se reemplazan por el bloque de accesos rápidos seguros (ver punto 2).
- La fila completa de KPIs financieros admin (Pagos Pendientes, Comisiones, Gastos).
- La tarjeta "Ventas Recientes" completa.
- La tarjeta "Próximas Reservas" se mantiene pero **sin nombres de clientes** (solo título del tour y fecha).
- Se ocultan los accesos a **Promociones** y **Paquetes Xcaret** (porque llevan a precios netos).

El estado del toggle se guarda en `localStorage` para que persista entre recargas — así si dejas la pantalla en Modo Cliente, sigue así al refrescar.

### 2. Accesos rápidos: dos grupos
Los 6 accesos actuales se dividen en dos grupos según si son seguros frente a un cliente:

**Seguros (siempre visibles, también en Modo Cliente):**
- Nueva Cotización
- Nueva Reserva
- Ver Catálogo
- Nuevo Lead

**Sensibles (solo visibles en Modo Normal):**
- Promociones
- Paquetes Xcaret

En Modo Cliente, los 4 accesos seguros se promueven a la parte superior (donde antes iban los KPIs), para que el Dashboard se vea limpio y útil sin exponer nada.

### 3. Resultado visual

**Modo Normal** (lo que tú ves):
```
Dashboard General                              [👁 Modo Cliente]
[Ventas Hoy] [Reservas Hoy] [Leads Activos]
[Pagos Pend.] [Comisiones]  [Gastos]
[Cotización] [Reserva] [Catálogo] [Lead] [Promos] [Xcaret]
[Próximas Reservas]              [Ventas Recientes]
```

**Modo Cliente** (un clic):
```
Dashboard                                     [👁 Modo Normal]
[Nueva Cotización] [Nueva Reserva]
[Ver Catálogo]     [Nuevo Lead]
[Próximas Reservas - solo tour y fecha]
```

## Archivos a modificar
- `src/pages/Dashboard.tsx` — único archivo. Se agrega el estado `clientMode` (con persistencia en localStorage), el botón toggle, y la lógica condicional para ocultar los bloques sensibles.

No requiere migraciones de base de datos ni cambios en otros componentes.

