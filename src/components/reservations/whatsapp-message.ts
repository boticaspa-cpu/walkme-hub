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
  tours?: { title: string; includes: string[]; meeting_point: string } | null;
  clients?: { name: string; phone: string; email: string | null } | null;
}

interface OnSiteFees {
  amountPerAdult: number;
  amountPerChild: number;
  currency: string;
}

export function buildWhatsAppMessage(r: ReservationData, lang: "es" | "en" = "es", onSiteFees?: OnSiteFees): string {
  if (lang === "en") {
    const lines = [
      `🎫 *WalkMe Tours — Reservation Confirmation*`,
      ``,
      `📋 Folio: ${r.folio ?? "—"}`,
      `🏝️ Tour: ${r.tours?.title ?? "—"}`,
      `📅 Date: ${r.reservation_date} ${r.reservation_time || ""}`.trim(),
      `📍 Pickup zone: ${r.zone || "—"}`,
      `🚐 Modality: ${r.modality === "shared" ? "Shared" : "Private"}`,
      `👤 Client: ${r.clients?.name ?? "—"}`,
      `👥 Adults: ${r.pax_adults} | Children (Menores): ${r.pax_children}`,
      `💰 Total: $${r.total_mxn.toLocaleString("en-US", { minimumFractionDigits: 2 })} MXN`,
    ];

    if (r.tours?.meeting_point) {
      lines.push(`📌 Meeting point: ${r.tours.meeting_point}`);
    }

    if (r.tours?.includes?.length) {
      lines.push(``, `✅ *Includes:*`);
      r.tours.includes.forEach((item) => lines.push(`  • ${item}`));
    }

    if (r.notes) {
      lines.push(``, `📝 Notes: ${r.notes}`);
    }

    if (onSiteFees && (onSiteFees.amountPerAdult > 0 || onSiteFees.amountPerChild > 0)) {
      lines.push(``, `💵 *Fee of $${onSiteFees.amountPerAdult.toFixed(2)} ${onSiteFees.currency} per adult${onSiteFees.amountPerChild > 0 ? ` / $${onSiteFees.amountPerChild.toFixed(2)} ${onSiteFees.currency} per child` : ""} — payable at boarding in cash*`);
    }

    lines.push(``, `Thank you for choosing WalkMe Tours! 🌴`);
    return lines.join("\n");
  }

  // Spanish
  const lines = [
    `🎫 *WalkMe Tours — Confirmación de Reserva*`,
    ``,
    `📋 Folio: ${r.folio ?? "—"}`,
    `🏝️ Tour: ${r.tours?.title ?? "—"}`,
    `📅 Fecha: ${r.reservation_date} ${r.reservation_time || ""}`.trim(),
    `📍 Zona de pickup: ${r.zone || "—"}`,
    `🚐 Modalidad: ${r.modality === "shared" ? "Compartido" : "Privado"}`,
    `👤 Cliente: ${r.clients?.name ?? "—"}`,
    `👥 Adultos: ${r.pax_adults} | Menores: ${r.pax_children}`,
    `💰 Total: $${r.total_mxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`,
  ];

  if (r.tours?.meeting_point) {
    lines.push(`📌 Punto de encuentro: ${r.tours.meeting_point}`);
  }

  if (r.tours?.includes?.length) {
    lines.push(``, `✅ *Incluye:*`);
    r.tours.includes.forEach((item) => lines.push(`  • ${item}`));
  }

  if (r.notes) {
    lines.push(``, `📝 Notas: ${r.notes}`);
  }

  if (onSiteFees && (onSiteFees.amountPerAdult > 0 || onSiteFees.amountPerChild > 0)) {
    lines.push(``, `💵 *Impuesto de $${onSiteFees.amountPerAdult.toFixed(2)} ${onSiteFees.currency} por adulto${onSiteFees.amountPerChild > 0 ? ` / $${onSiteFees.amountPerChild.toFixed(2)} ${onSiteFees.currency} por menor` : ""} — se paga al abordar en efectivo*`);
  }

  lines.push(``, `¡Gracias por elegir WalkMe Tours! 🌴`);
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
