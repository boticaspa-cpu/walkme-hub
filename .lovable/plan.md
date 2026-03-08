

# Inspección completa de la app -- Hallazgos

Revisé el flujo completo: Login, Dashboard, Tours, Cotizaciones, Reservas, POS, Cierre Diario, BottomNav, Sidebar, Topbar, Chat Widget y AuthContext. Aqui los hallazgos:

---

## Problemas encontrados

### 1. Error 406: Tabla `settings` sin dato `exchange_rate_usd`
La request `GET /rest/v1/settings?key=eq.exchange_rate_usd` devuelve 406 porque no existe el registro en la tabla. Esto afecta la página de Tours (usa `.single()` que falla si no hay fila). El fallback `return 17.5` lo maneja, pero genera un error silencioso en cada carga.

**Solución**: Insertar los registros iniciales en `settings` (`exchange_rate_usd`, `exchange_rate_eur`, `exchange_rate_cad`) con una migración, o cambiar `.single()` a `.maybeSingle()` para evitar el error 406.

### 2. Clase CSS `safe-area-pb` inexistente
En `BottomNav.tsx` se usa `safe-area-pb` pero esta clase no existe en Tailwind ni está definida como utilidad custom. El `body` en `index.css` ya aplica `padding-bottom: env(safe-area-inset-bottom)` globalmente, así que el BottomNav no tiene safe-area propio -- no se aplica ningún padding extra en iPhones con notch/barra inferior.

**Solución**: Agregar una utilidad CSS o usar inline style `pb-[env(safe-area-inset-bottom)]`.

### 3. Advertencia: DialogContent sin `Description`
El console warning `Missing Description or aria-describedby` viene de `CashSessionGuard` -- el diálogo "Abrir Caja" no tiene `DialogDescription` (el de "Cierre pendiente" sí lo tiene). No es un error funcional pero genera warnings.

**Solución**: Ya tiene `DialogDescription` en ambos casos al revisar el código. El warning probablemente viene de otro diálogo (posiblemente el Sheet del BottomNav que no usa description).

### 4. Comisiones: admin ve todas sin filtro de vendedor
En `Comisiones.tsx`, el admin ve todas las comisiones sin filtrar por usuario. Si el admin accede desde el sidebar donde dice "Mis Comisiones", podría ser confuso. El sidebar del admin no muestra "Comisiones" (correcto), pero la ruta `/comisiones` sí es accesible.

### 5. BottomNav `isActive` conflicto potencial
La función `isActive` usa `startsWith` para todos excepto `/dashboard`. Esto causa que si estás en `/cotizaciones`, la ruta `/cotizaciones/:id/pdf` también se marcaría como activa (menor issue, ya que esa ruta es pública y no usa AppLayout).

---

## Flujo de trabajo -- Sin problemas de congruencia

- **Login → Dashboard**: Correcto. Redirección funciona.
- **Dashboard → Tours/Reservas/Cotizaciones**: Links de acceso rápido correctos.
- **BottomNav ↔ Sidebar**: Items consistentes entre ambos. Tours en barra principal, POS en "Más". Sidebar desktop coincide.
- **CashSessionGuard**: Se muestra en todas las rutas autenticadas. Bloquea correctamente si hay sesión pasada sin cerrar o sin sesión abierta.
- **POS → requiere caja abierta**: Correcto, `CashSessionGuard` lo maneja globalmente.
- **Cotizaciones → Aceptar → Reserva**: Flujo disponible via `AcceptQuoteDialog`.
- **Roles admin/seller**: Navegación diferenciada correcta.

---

## Plan de corrección

### Archivo: `src/pages/Tours.tsx`
Cambiar `.single()` a `.maybeSingle()` en la query de `exchange_rate_usd` para evitar el error 406.

### Archivo: `src/components/layout/BottomNav.tsx`
Reemplazar `safe-area-pb` por `pb-[env(safe-area-inset-bottom)]` usando un estilo inline o agregar una clase CSS custom en `index.css`.

### Archivo: `src/index.css`
Agregar utilidad `.safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }` para que la clase funcione.

### Archivo: `src/pages/Configuracion.tsx` (migración de datos)
Insertar registros default en `settings` si no existen, para evitar el 406 recurrente.

