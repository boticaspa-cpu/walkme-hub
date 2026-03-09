
# Plan: Completar Validaciones Pendientes BLOQUE 1

## Contexto
Retomar QA desde interrupciones previas. Ya confirmado: card payment, fees internos, comisiones admin view, payment status updates.

## Validaciones Pendientes

### 1. COMISIONES - SELLER VIEW
**Objetivo**: Verificar RLS funciona para sellers (solo ven propias comisiones)
**Proceso**:
- Login como seller existente
- Navegar a `/comisiones`  
- Verificar que columna "Vendedor" no aparece
- Confirmar que solo muestra comisiones propias vs admin view
- SQL audit: `SELECT seller_id FROM commissions WHERE visible_to_seller`

### 2. MULTI-TOUR REAL TEST
**Objetivo**: Probar persistencia de campos nuevos con datos reales
**Proceso**:
- Crear reserva multi-tour desde `/reservas`
- Llenar explícitamente:
  - hotel_name: "Hotel Test QA"
  - pickup_notes: "Lobby principal 8:30am"  
  - pax_email: "test@walkme.com"
  - operator_confirmation_code: "OP-123456"
- Guardar y verificar en DB:
```sql
SELECT folio, hotel_name, pickup_notes, pax_email, operator_confirmation_code
FROM reservations 
WHERE created_at > NOW() - INTERVAL '10 minutes'
AND (hotel_name != '' OR pickup_notes != '' OR pax_email != '' OR operator_confirmation_code != '');
```

### 3. OUTPUTS VALIDATION
**Objetivo**: Confirmar que voucher/PDF/WhatsApp muestran campos nuevos
**Para reserva con campos llenos**:
- Voucher HTML: verificar campos aparecen correctamente
- PDF generation: sin errores 500, campos visibles
- WhatsApp message: formato correcto incluye nuevos campos
- Browser network logs para detectar errores

### 4. CAJA FLOW
**Objetivo**: Validar flujo completo apertura → cobro → cierre
**Proceso**:
- Estado actual cash session
- Si cerrada: abrir caja con float test
- Si abierta: proceder con cobro
- Cerrar caja y verificar no hay errores
- Confirmar esperado vs contado calculation

## Metodología
- **Empírico**: Testear comportamiento real, no asumir
- **Datos reales**: Usar reservas/cuentas existentes donde posible  
- **SQL validation**: Confirmar cada paso con queries
- **Browser tools**: Para UI testing y error detection

## Entregables
- Checklist [✅/⚠️/❌] para cada validación pendiente
- Bugs reales encontrados (funcional vs datos vacíos vs QA incompleto)
- Assessment final de qué está operacional
- SQL queries exactas usadas para validación

## Tiempo Estimado
15-20 minutos de testing focused en validaciones específicas pendientes.
