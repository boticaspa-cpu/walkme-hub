interface ReservationData {
  folio: string | null;
  reservation_date: string;
  reservation_time: string;
  pax_adults: number;
  pax_children: number;
  pax_infants?: number;
  total_mxn: number;
  zone: string;
  modality: string;
  discount_mxn?: number;
  notes: string | null;
  hotel_name?: string;
  pickup_notes?: string;
  operator_confirmation_code?: string;
  tours?: { title: string; meeting_point: string; service_type?: string } | null;
  voucher_items?: Array<{
    qty_adults: number;
    qty_children: number;
    qty_infants?: number;
    child_ages?: number[];
    infant_ages?: number[];
    unit_price_mxn: number;
    unit_price_child_mxn: number;
    unit_price_infant_mxn?: number;
    subtotal_mxn: number;
    package_name?: string | null;
    tours?: { title: string; service_type?: string } | null;
  }>;
  clients?: { name: string; phone: string; email: string | null } | null;
}

interface OnSiteFees {
  amountPerAdult: number;
  amountPerChild: number;
  currency: string;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildWhatsAppMessage(r: ReservationData, lang: "es" | "en" = "es", onSiteFees?: OnSiteFees): string {
  const SEP = "━━━━━━━━━━━━━━━━━━━━";
  const items = r.voucher_items ?? [];
  const money = (value: number) => `$${Number(value || 0).toLocaleString(lang === "en" ? "en-US" : "es-MX", { minimumFractionDigits: 2 })} MXN`;
  const subtotal = items.length > 0 ? items.reduce((sum, item) => sum + Number(item.subtotal_mxn || 0), 0) : r.total_mxn + Number(r.discount_mxn || 0);
  const discount = Number(r.discount_mxn || 0);
  const discountPct = subtotal > 0 ? discount / subtotal * 100 : 0;

  if (lang === "en") {
    const dateStr = capitalize(
      new Date(r.reservation_date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    );

    const lines = [
      SEP,
      `   🌴 *WALKME TOURS*`,
      `    Playa del Carmen`,
      SEP,
      ``,
      `🎫 *RESERVATION CONFIRMATION*`,
      ``,
      `📋 *Folio:* ${r.folio ?? "—"}`,
      `👤 *Client:* ${r.clients?.name ?? "—"}`,
      `🏝️ *Tour:* ${r.tours?.title ?? "—"}`,
      `📅 *Date:* ${dateStr}`,
      `🕐 *Time:* ${r.reservation_time || "—"}`,
      `📍 *Pickup zone:* ${r.zone || "—"}`,
      `🚐 *Modality:* ${r.modality === "shared" ? "Shared" : "Private"}`,
      `👥 *Passengers:* ${r.pax_adults} adult(s), ${r.pax_children} minor(s), ${r.pax_infants ?? 0} infant(s)`,
      ``,
      `💰 *Tour breakdown:*`,
    ];

    items.forEach((item) => {
      const service = item.tours?.service_type === "with_transport" ? "With transportation" : "Without transportation";
      lines.push(`• *${item.tours?.title ?? r.tours?.title ?? "Tour"}*${item.package_name ? ` — ${item.package_name}` : ""} · ${service}`);
      if (item.qty_adults > 0) lines.push(`  ${item.qty_adults} adult(s) × ${money(item.unit_price_mxn)} = ${money(item.qty_adults * item.unit_price_mxn)}`);
      if (item.qty_children > 0) lines.push(`  ${item.qty_children} minor(s)${item.child_ages?.length ? ` (ages: ${item.child_ages.join(", ")})` : ""} × ${money(item.unit_price_child_mxn)} = ${money(item.qty_children * item.unit_price_child_mxn)}`);
      if ((item.qty_infants ?? 0) > 0) lines.push(`  ${item.qty_infants} infant(s)${item.infant_ages?.length ? ` (ages: ${item.infant_ages.join(", ")})` : ""} × ${money(item.unit_price_infant_mxn ?? 0)} = ${money((item.qty_infants ?? 0) * (item.unit_price_infant_mxn ?? 0))}`);
      if (r.modality === "private") lines.push(`  Private service total: ${money(item.subtotal_mxn)}`);
    });
    if (discount > 0) lines.push(``, `🏷️ *Discount (${discountPct.toFixed(2)}%):* -${money(discount)}`);
    lines.push(`💳 *Total: ${money(r.total_mxn)}*`);

    if (r.hotel_name) lines.push(``, `🏨 *Hotel:* ${r.hotel_name}`);
    if (r.tours?.meeting_point) lines.push(`📌 *Meeting point:* ${r.tours.meeting_point}`);
    if (r.pickup_notes) lines.push(`🚏 *Pickup notes:* ${r.pickup_notes}`);
    if (r.operator_confirmation_code) lines.push(`🔑 *Confirmation code:* ${r.operator_confirmation_code}`);

    if (r.notes) lines.push(``, `📝 *Notes:* ${r.notes}`);

    if (onSiteFees && (onSiteFees.amountPerAdult > 0 || onSiteFees.amountPerChild > 0)) {
      lines.push(``, `💵 *Fee of $${onSiteFees.amountPerAdult.toFixed(2)} ${onSiteFees.currency} per adult${onSiteFees.amountPerChild > 0 ? ` / $${onSiteFees.amountPerChild.toFixed(2)} ${onSiteFees.currency} per child` : ""} — payable at boarding in cash*`);
    }

    lines.push(
      ``,
      SEP,
      `⚠️ *Cancellation Policy:*`,
      `Changes or cancellations must be made at least 72 hours in advance. No refunds on the day of the tour or for no-shows.`,
      SEP,
      ``,
      `📲 WhatsApp: +52 56 3974 8122`,
      `📷 Instagram: @walkme_travel`,
      ``,
      `Thank you for choosing WalkMe Tours! 🌴✨`,
    );

    return lines.join("\n");
  }

  // Spanish
  const dateStr = capitalize(
    new Date(r.reservation_date + "T12:00:00").toLocaleDateString("es-MX", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
  );

  const lines = [
    SEP,
    `   🌴 *WALKME TOURS*`,
    `    Playa del Carmen`,
    SEP,
    ``,
    `🎫 *CONFIRMACIÓN DE RESERVA*`,
    ``,
    `📋 *Folio:* ${r.folio ?? "—"}`,
    `👤 *Cliente:* ${r.clients?.name ?? "—"}`,
    `🏝️ *Tour:* ${r.tours?.title ?? "—"}`,
    `📅 *Fecha:* ${dateStr}`,
    `🕐 *Hora:* ${r.reservation_time || "—"}`,
    `📍 *Zona:* ${r.zone || "—"}`,
    `🚐 *Modalidad:* ${r.modality === "shared" ? "Compartido" : "Privado"}`,
      `👥 *Pasajeros:* ${r.pax_adults} adulto(s), ${r.pax_children} menor(es), ${r.pax_infants ?? 0} infante(s)`,
    ``,
      `💰 *Desglose de tours:*`,
  ];

  items.forEach((item) => {
    const service = item.tours?.service_type === "with_transport" ? "Con transporte" : "Sin transporte";
    lines.push(`• *${item.tours?.title ?? r.tours?.title ?? "Tour"}*${item.package_name ? ` — ${item.package_name}` : ""} · ${service}`);
    if (item.qty_adults > 0) lines.push(`  ${item.qty_adults} adulto(s) × ${money(item.unit_price_mxn)} = ${money(item.qty_adults * item.unit_price_mxn)}`);
    if (item.qty_children > 0) lines.push(`  ${item.qty_children} menor(es)${item.child_ages?.length ? ` (edades: ${item.child_ages.join(", ")})` : ""} × ${money(item.unit_price_child_mxn)} = ${money(item.qty_children * item.unit_price_child_mxn)}`);
    if ((item.qty_infants ?? 0) > 0) lines.push(`  ${item.qty_infants} infante(s)${item.infant_ages?.length ? ` (edades: ${item.infant_ages.join(", ")})` : ""} × ${money(item.unit_price_infant_mxn ?? 0)} = ${money((item.qty_infants ?? 0) * (item.unit_price_infant_mxn ?? 0))}`);
    if (r.modality === "private") lines.push(`  Total servicio privado: ${money(item.subtotal_mxn)}`);
  });
  if (discount > 0) lines.push(``, `🏷️ *Descuento (${discountPct.toFixed(2)}%):* -${money(discount)}`);
  lines.push(`💳 *Total: ${money(r.total_mxn)}*`);

  if (r.hotel_name) lines.push(``, `🏨 *Hotel:* ${r.hotel_name}`);
  if (r.tours?.meeting_point) lines.push(`📌 *Punto de encuentro:* ${r.tours.meeting_point}`);
  if (r.pickup_notes) lines.push(`🚏 *Notas de pickup:* ${r.pickup_notes}`);
  if (r.operator_confirmation_code) lines.push(`🔑 *Código de confirmación:* ${r.operator_confirmation_code}`);

  if (r.notes) lines.push(``, `📝 *Notas:* ${r.notes}`);

  if (onSiteFees && (onSiteFees.amountPerAdult > 0 || onSiteFees.amountPerChild > 0)) {
    lines.push(``, `💵 *Impuesto de $${onSiteFees.amountPerAdult.toFixed(2)} ${onSiteFees.currency} por adulto${onSiteFees.amountPerChild > 0 ? ` / $${onSiteFees.amountPerChild.toFixed(2)} ${onSiteFees.currency} por menor` : ""} — se paga al abordar en efectivo*`);
  }

  lines.push(
    ``,
    SEP,
    `⚠️ *Políticas de cancelación:*`,
    `Cambios o cancelaciones deben realizarse con 72 hrs de anticipación. No aplica reembolso el mismo día del tour ni por inasistencia.`,
    SEP,
    ``,
    `📲 WhatsApp: +52 56 3974 8122`,
    `📷 Instagram: @walkme_travel`,
    ``,
    `¡Gracias por elegir WalkMe Tours! 🌴✨`,
  );

  return lines.join("\n");
}

export function openWhatsApp(phone: string | undefined, message: string) {
  const encoded = encodeURIComponent(message);
  const cleanPhone = phone?.replace(/\D/g, "") || "";
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank");
}
