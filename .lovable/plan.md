

# Cotización rápida: solo lo esencial

## Objetivo
Que crear una cotización tome segundos. Quitar fricción: cliente y email pasan a ser opcionales, y los datos pesados (teléfono, hotel, etc.) solo se piden al convertir en reserva (donde ya están implementados).

## Cambios en el formulario "Nueva Cotización"

### Datos del cliente (arriba del formulario)
Reemplazar el bloque actual (Select cliente obligatorio + botón "+") por dos inputs sueltos, ambos **opcionales**:

- **Nombre** (texto libre, opcional) — placeholder: "Nombre del cliente (opcional)"
- **Email** (texto libre, opcional) — placeholder: "Email (opcional)"

Si el vendedor escribe un nombre, se guarda en `quotes.client_name`. Si lo deja vacío, se guarda algo como `"Cliente sin nombre"` para que la lista no muestre vacío. El email se guarda en `quotes.notes` con un prefijo `Email: ...` (no requiere migración) o se ignora si está vacío.

Se elimina:
- El Select de clientes existentes
- El mini-dialog "Nuevo Cliente" (`clientDialogOpen`, `clientForm`, `saveClientMutation`) — ya no se necesita en este flujo
- La validación `disabled={!form.client_id}` del botón Crear

### Datos del tour (lo único obligatorio)
Lo que el vendedor SÍ debe llenar para una cotización válida:
- **Tour o paquete** (ya existe)
- **Adultos / Menores** (ya existe)
- **Fecha del tour** (ya existe)

Zona y nacionalidad siguen disponibles porque son los que disparan el precio correcto, pero NO se vuelven obligatorios — si el vendedor no los pone, se usa el precio base del tour (lookup actual ya cae a `tour_packages` y luego a `price_mxn`).

### Validación al guardar
Solo se exige:
- Al menos 1 item con `tour_id` seleccionado
- Cantidad total de pax > 0

Si falta nombre del cliente, se guarda como "Cliente sin nombre" automáticamente — sin bloquear.

## Conversión a Reserva (sin cambios funcionales)
`AcceptQuoteDialog.tsx` ya pide la fecha y crea la reserva. Cuando una cotización sin cliente formal pasa a reserva, ahí es donde el vendedor completa los datos pesados (teléfono, email, hotel, pickup, etc.) en el flujo de Reservas que ya existe. No se toca esa lógica.

## Detalles técnicos

**Archivo a modificar:** `src/pages/Cotizaciones.tsx` únicamente.

Cambios concretos:
1. `emptyForm` → quitar `client_id`, dejar `client_name`, `email` (nuevo campo local), `notes`, `status`, `discount_mxn`
2. Reemplazar el bloque "Cliente *" (líneas ~583-595) por dos `<Input>` opcionales (Nombre, Email)
3. En `saveMutation`:
   - `client_id: null` siempre (desde este flujo simplificado)
   - `client_name: form.client_name || "Cliente sin nombre"`
   - Si `form.email`, anteponerlo a `notes`: `Email: ${email}\n${notes}`
4. Cambiar `disabled={saveMutation.isPending || !form.client_id}` → `disabled={saveMutation.isPending || items.length === 0 || !items.some(i => i.tour_id)}`
5. Eliminar: `clientDialogOpen`, `clientForm`, `saveClientMutation`, query `clients-list`, mini-dialog "Nuevo Cliente"
6. En `openEdit`, pre-cargar `client_name` y extraer `email` de notes si tiene el prefijo

No se requiere migración de base de datos: las columnas `client_id`, `client_name`, `notes` ya soportan el nuevo flujo (todas son nullable o tienen default).

## Validación al implementar
1. Abrir "Nueva Cotización" → solo seleccionar tour, poner 2 adultos, fecha, guardar → debe crearse sin pedir cliente
2. Crear otra con nombre y email → verificar que aparezcan en la lista y en el PDF
3. Convertir una cotización sin cliente a reserva → el dialog de reserva debe pedir todos los datos del cliente como ya lo hace
4. Editar una cotización vieja (con cliente formal) → debe seguir funcionando

