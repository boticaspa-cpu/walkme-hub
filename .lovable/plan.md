# Cupón para el Operador

Nuevo cupón imprimible pensado para entregar/enviar al operador: solo datos operativos, sin precios al cliente ni "qué incluye", y con el monto a pagar al operador.

## Qué muestra el cupón del operador

Siempre visible:
- Folio de la reserva y folio/confirmación del operador
- Nombre del tour, modalidad, zona, nacionalidad
- Fecha y hora del servicio
- Pax: adultos / menores
- Hotel y punto de pickup
- Idioma del tour
- Nombre del pasajero
- Notas operativas
- Bloque de pago al operador: monto, moneda y forma de pago

Nunca se incluye:
- Precio de venta al cliente, total, depósito ni saldo
- Sección "Incluye"
- Políticas de cancelación al cliente

## Controles antes de imprimir

Panel de opciones arriba de la vista previa:
- Interruptores para mostrar/ocultar: Teléfono del pasajero, Email del pasajero, Hotel, Punto de pickup, Notas, Idioma
- Campos editables (solo para este cupón, no cambian la reserva): nombre del pasajero, teléfono, email, hotel, punto de pickup, notas
- Bloque de pago al operador:
  - Monto a pagar (numérico)
  - Moneda: MXN / USD
  - Forma de pago: Efectivo, Transferencia, Tarjeta, Crédito (pago posterior), Prepagado
  - Referencia opcional
- Botón "Restablecer" para volver a los datos originales de la reserva

El monto se pre-llena automáticamente con el costo del operador cuando existe (`tour_price_variants.net_cost` por adulto/menor según zona y nacionalidad), y la moneda con la moneda base del operador. Si no hay costo configurado, queda en 0 para capturarlo a mano.

## Dónde se accede

En la tabla de Reservas, junto a la acción de Voucher, se agrega "Cupón Operador" (ícono de edificio). Abre un diálogo con las opciones, la vista previa y botón Imprimir, igual que el voucher actual.

## Detalles técnicos

Archivos nuevos:
- `src/components/reservations/OperatorVoucherPrintView.tsx` — vista imprimible. Recibe `reservation` más un objeto `overrides` con los campos editados/visibilidad y `payment { amount, currency, method, reference }`. Reutiliza los estilos inline y el logo del voucher actual para consistencia de impresión.
- `src/components/reservations/OperatorVoucherDialog.tsx` — diálogo con los interruptores, campos editables, bloque de pago, vista previa y `handlePrint` (misma técnica de impresión que el voucher actual, con contenedor oculto y `window.print()`).

Archivos modificados:
- `src/pages/Reservas.tsx` — estado `operatorVoucherRes`, botón/entrada en el menú de acciones y montaje del nuevo diálogo.

Datos:
- Sin cambios de base de datos. Toda la personalización es de la sesión de impresión (no se guarda), y el bloque de pago es informativo para el operador; los pagos reales se siguen registrando en Cuentas por Pagar.
- El precálculo del monto usa una consulta a `tour_price_variants` filtrada por `tour_id`, `zone`, `nationality` y `package_name` de la reserva, igual que hace hoy el checkout.

Sin cambios en cotizador, POS, voucher del cliente ni comisiones.
