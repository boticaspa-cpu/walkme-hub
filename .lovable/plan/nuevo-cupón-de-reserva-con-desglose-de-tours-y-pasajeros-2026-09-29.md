# Nuevo cupón de reserva con desglose de tours y pasajeros

Actualizar el cupón que recibe el cliente para quitar por completo las secciones **“Incluye”** y recomendaciones, y sustituirlas por un desglose financiero y operativo claro de cada tour reservado.

## Información que conservará

- Folio, estado y confirmación del operador.
- Nombre y contacto del cliente.
- Fecha, hora, hotel, punto de pickup, zona, nacionalidad e idioma.
- Notas, impuestos que se pagan en sitio, depósito, saldo y políticas de cancelación de 72 horas.
- Total de la reserva y datos necesarios para operar el servicio.

## Nuevo desglose por tour

Cada tour reservado tendrá su propio bloque o renglón con:

- Nombre del tour y paquete seleccionado.
- **Con transporte** o **sin transporte**, tomado de la ficha del tour.
- Fecha, hora y modalidad: **Compartido** o **Privado**.
- Adultos: cantidad, precio por persona y subtotal.
- Menores: cantidad, edad individual, precio por persona y subtotal.
- Infantes: cantidad, edad individual, precio editable por persona y subtotal; podrá ser $0 cuando no pague.
- Descuento de la reserva expresado en **porcentaje y monto**.
- Subtotal antes del descuento y total final.
- En servicios privados se mostrarán ambos datos: **precio por persona** y **precio total privado**.

## Captura de edades e infantes

- Agregar en Reservas la cantidad de infantes y su precio.
- Al indicar menores o infantes, mostrar campos para capturar la edad de cada uno.
- Validar que la cantidad de edades coincida con la cantidad de menores e infantes.
- Los infantes contarán en el total de pasajeros, pero solo sumarán al precio cuando se capture un importe mayor a cero.
- Las reservas anteriores seguirán funcionando: comenzarán sin infantes ni edades registradas.

## Consistencia en todos los formatos del cliente

- La vista previa, impresión, descarga y envío como imagen usarán el nuevo desglose.
- El mensaje de WhatsApp/email dejará de mostrar “Incluye” y reflejará adultos, menores, infantes, transporte, modalidad, descuento y total.
- La generación directa de PDF dejará de incluir “Incluye” y leerá el mismo detalle guardado en la reserva.
- El cupón para el operador no se modificará.

## Detalles técnicos

- Ampliar `reservation_items`, que ya es la fuente definitiva del precio, con cantidad/precio de infantes y arreglos de edades para menores e infantes.
- Mantener los campos resumidos de `reservations` sincronizados para búsquedas y visualización rápida.
- Consultar todos los `reservation_items` del folio, no solo el primero, junto con `tours.service_type`.
- Calcular el porcentaje mostrado como `descuento ÷ subtotal × 100`, evitando división entre cero.
- Adaptar la creación, edición y conversión desde cotización para conservar el nuevo detalle; las cotizaciones existentes iniciarán con cero infantes.
- Verificar cupón en español e inglés, reserva de un tour y de varios tours, modalidad privada/compartida, impresión y vista móvil.
