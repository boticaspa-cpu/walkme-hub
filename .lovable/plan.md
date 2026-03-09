
# Plan: Limpieza de Datos Operativos - Base de Datos

## Análisis y Preparación

Voy a preparar la limpieza de datos operativos manteniendo intacto el catálogo maestro, configuración y usuarios.

### A. Tablas a Borrar (Datos Operativos)
```
✅ BORRAR:
- sales
- sale_items  
- commissions
- quotes
- quote_items
- reservations
- reservation_items
- clients
- leads
```

### B. Tablas a PRESERVAR (Catálogo y Configuración)
```
❌ NO BORRAR:
- tours (catálogo maestro)
- operators (operadores)
- categories (categorías)
- destinations (destinos)
- tour_price_variants (precios del catálogo)
- tour_packages (paquetes del catálogo)
- promo_packages (promociones)
- promo_package_tours (relaciones promo-tours)
- promotion_tours (relaciones promoción-tours)
- promotions (promociones)
- settings (configuración)
- profiles (perfiles de usuarios)
- user_roles (roles de usuarios)
- cash_sessions (sesiones de caja)
- cash_movements (movimientos de caja)
- daily_closings (cierres diarios)
- cash_registers (cajas registradoras)
- expense_concepts (conceptos de gastos)
- expense_items (gastos)
- operator_payables (pagos a operadores)
- message_templates (plantillas de mensajes)
```

### C. Orden de Borrado por Foreign Keys

Basado en las relaciones de dependencia:

1. **sale_items** (depende de sales)
2. **commissions** (depende de sales)
3. **sales** (puede depender de clients, reservations)
4. **quote_items** (depende de quotes)
5. **reservation_items** (depende de reservations)
6. **quotes** (puede depender de clients, reservations)
7. **reservations** (puede depender de clients)
8. **leads** (puede depende de clients)
9. **clients** (última, otros pueden depender de ella)

### D. Preview de Datos Actuales

Primero consultaré el estado actual con SELECT COUNT(*) para cada tabla.

### E. SQL de Borrado Final

Se preparará el script completo respetando el orden de dependencias.

### F. Confirmaciones de Seguridad

- ✅ Catálogo de tours intacto
- ✅ Operadores preservados
- ✅ Configuración mantenida
- ✅ Usuarios y roles intactos
- ✅ Sistema de caja preservado
- ✅ Solo datos operacionales/transaccionales borrados

El plan garantiza que solo se eliminen datos de prueba/operación manteniendo toda la estructura de catálogo y configuración funcional.
