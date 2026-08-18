# Folios desde 555

Los folios nuevos arrancan en 555 y con 4 dígitos, para que se vean más sólidos: `WM-0555` en reservas y `COT-0555` en cotizaciones.

## Qué cambia

- Reservas: la próxima reserva nueva sale como `WM-0555`, luego `WM-0556`, etc.
- Cotizaciones: la próxima cotización sale como `COT-0555` y sigue.
- Los folios ya existentes (WM-001, COT-002…) se quedan tal cual, como histórico. No se reescribe nada ya impreso ni enviado.
- El cupón del operador y el voucher siguen mostrando el folio de la reserva, así que heredan el formato nuevo automáticamente.

## Detalle técnico

Migración que reemplaza `public.generate_folio()`:

- Se conserva la lógica actual de prefijo por tabla (`WM` para `reservations`, `COT` para `quotes`).
- El número siguiente pasa a ser `GREATEST(max_actual + 1, 555)`, tomando el máximo solo de la tabla que dispara el trigger (hoy la subconsulta ya lo separa por `TG_TABLE_NAME`).
- Relleno con `lpad(..., 4, '0')` en vez de 3, para que 555 se vea como `0555` y siga alineado al pasar de 999.
- Los triggers `trg_reservations_folio` y `trg_quotes_folio` no cambian.

Sin cambios de esquema ni de código frontend: los folios se leen tal cual vienen de la base.

## Sobre la letra

Ya tienes `WM` en reservas, que es justo "WalkMe" — se ve limpio y corto. Sugiero dejarlo así en lugar de `WMM`, porque un prefijo con la inicial de una persona envejece mal si mañana lo emite alguien más. Si igual lo quieres personalizado, lo cambio en un minuto.
