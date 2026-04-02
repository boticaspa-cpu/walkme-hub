interface ReservationData {
  folio: string | null;
  reservation_date: string;
  reservation_time: string;
  pax_adults: number;
  pax_children: number;
  total_mxn: number;
  zone: string;
  modality: string;
  notes: string | null;
  hotel_name?: string;
  pickup_notes?: string;
  operator_confirmation_code?: string;
  tours?: { title: string; includes: string[]; meeting_point: string } | null;
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
      `👥 *Passengers:* ${r.pax_adults} adult(s), ${r.pax_children} child(ren)`,
      ``,
      `💰 *Total paid: $${r.total_mxn.toLocaleString("en-US", { minimumFractionDigits: 2 })} MXN*`,
    ];

    if (r.hotel_name) lines.push(``, `🏨 *Hotel:* ${r.hotel_name}`);
    if (r.tours?.meeting_point) lines.push(`📌 *Meeting point:* ${r.tours.meeting_point}`);
    if (r.pickup_notes) lines.push(`🚏 *Pickup notes:* ${r.pickup_notes}`);
    if (r.operator_confirmation_code) lines.push(`🔑 *Confirmation code:* ${r.operator_confirmation_code}`);

    if (r.tours?.includes?.length) {
      lines.push(``, `✅ *Includes:*`);
      r.tours.includes.forEach((item) => lines.push(`  • ${item}`));
    }

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
    `👥 *Pasajeros:* ${r.pax_adults} adulto(s), ${r.pax_children} menor(es)`,
    ``,
    `💰 *Total pagado: $${r.total_mxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN*`,
  ];

  if (r.hotel_name) lines.push(``, `🏨 *Hotel:* ${r.hotel_name}`);
  if (r.tours?.meeting_point) lines.push(`📌 *Punto de encuentro:* ${r.tours.meeting_point}`);
  if (r.pickup_notes) lines.push(`🚏 *Notas de pickup:* ${r.pickup_notes}`);
  if (r.operator_confirmation_code) lines.push(`🔑 *Código de confirmación:* ${r.operator_confirmation_code}`);

  if (r.tours?.includes?.length) {
    lines.push(``, `✅ *Incluye:*`);
    r.tours.includes.forEach((item) => lines.push(`  • ${item}`));
  }

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
