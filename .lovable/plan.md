
# Plan: Ejecutar Limpieza de Datos Operativos

## Estado Confirmado
Base de datos contiene datos operacionales que deben eliminarse:
- sales (3), sale_items (3), commissions (3)
- quotes (3), quote_items (6) 
- reservations (4), reservation_items (3)
- clients (1), leads (0)

## Orden de Ejecución
Respetando dependencias de foreign keys:

### 1. Borrar tablas dependientes primero
```sql
DELETE FROM sale_items;
DELETE FROM commissions;
DELETE FROM quote_items;  
DELETE FROM reservation_items;
```

### 2. Borrar tablas principales
```sql
DELETE FROM sales;
DELETE FROM quotes;
DELETE FROM reservations;
DELETE FROM leads;
DELETE FROM clients;
```

## Validación Post-Limpieza
Verificar que todas las tablas operacionales queden en 0:
- COUNT(*) de cada tabla objetivo debe ser 0
- Confirmar que catálogo (tours, operators, settings) permanece intacto

## Seguridad
- Solo datos transaccionales/operacionales
- Preserva catálogo maestro, usuarios, configuración
- No toca sistema de caja (cash_sessions, etc.)

Ejecutaré cada DELETE y verificaré el resultado antes de proceder al siguiente.
