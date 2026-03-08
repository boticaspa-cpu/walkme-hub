import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const lang = (url.searchParams.get("lang") || "es") as "es" | "en";

    if (!id) {
      return new Response("Missing id", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: r, error } = await supabase
      .from("reservations")
      .select("*, clients(name, phone, email), tours(title, meeting_point, short_description, includes)")
      .eq("id", id)
      .single();

    if (error || !r) {
      return new Response("Reservation not found", { status: 404, headers: corsHeaders });
    }

    // Also fetch reservation items for line-item pricing
    const { data: items } = await supabase
      .from("reservation_items")
      .select("*, tours(title)")
      .eq("reservation_id", id);

    // Also fetch cancellation policy from settings
    const policyKey = lang === "es" ? "cancellation_policy_es" : "cancellation_policy_en";
    const { data: settingsRows } = await supabase
      .from("settings")
      .select("value")
      .eq("key", policyKey)
      .limit(1);
    
    const defaultPolicyEs = "Cualquier cambio o cancelación deberá realizarse con al menos 48 horas de anticipación. Cancelaciones con menos de 48 horas o no shows no son reembolsables.";
    const defaultPolicyEn = "Any change or cancellation must be made at least 48 hours in advance. Cancellations with less than 48 hours notice or no-shows are non-refundable.";
    const policy = settingsRows?.[0]?.value || (lang === "es" ? defaultPolicyEs : defaultPolicyEn);

    const labels = lang === "es"
      ? {
          title: "VOUCHER DE RESERVA",
          folio: "Folio",
          opFolio: "Folio Operador",
          date: "Fecha",
          time: "Hora",
          client: "Cliente",
          phone: "Teléfono",
          tour: "Tour",
          meetingPoint: "Punto de encuentro",
          adults: "Adultos",
          children: "Menores",
          zone: "Zona",
          modality: "Modalidad",
          shared: "Compartido",
          private: "Privado",
          total: "TOTAL",
          includes: "Incluye",
          notes: "Notas",
          cancellation: "Políticas de cancelación",
          thanks: "¡Gracias por elegir WalkMe Tours!",
          priceAdult: "Precio adulto",
          priceChild: "Precio menor",
          subtotal: "Subtotal",
        }
      : {
          title: "RESERVATION VOUCHER",
          folio: "Folio",
          opFolio: "Operator Folio",
          date: "Date",
          time: "Time",
          client: "Client",
          phone: "Phone",
          tour: "Tour",
          meetingPoint: "Meeting point",
          adults: "Adults",
          children: "Minors",
          zone: "Zone",
          modality: "Modality",
          shared: "Shared",
          private: "Private",
          total: "TOTAL",
          includes: "Includes",
          notes: "Notes",
          cancellation: "Cancellation policies",
          thanks: "Thank you for choosing WalkMe Tours!",
          priceAdult: "Adult price",
          priceChild: "Minor price",
          subtotal: "Subtotal",
        };

    const fmtMXN = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })} MXN`;

    const client = r.clients as any;
    const tour = r.tours as any;

    // Build PDF
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pw = 210; // page width
    const margin = 15;
    const cw = pw - margin * 2; // content width
    let y = margin;

    const green = [45, 90, 39]; // #2d5a27
    const gray = [120, 120, 120];
    const lightGray = [200, 200, 200];

    // ── HEADER BAR ──
    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(margin, y, cw, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("WALKME TOURS", margin + 4, y + 9);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(labels.title, margin + cw - 4, y + 9, { align: "right" });
    y += 18;

    // ── FOLIO ROW ──
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`${labels.folio}: ${r.folio ?? "—"}`, margin, y);
    if (r.operator_folio) {
      doc.text(`${labels.opFolio}: ${r.operator_folio}`, margin + 60, y);
    }
    y += 6;

    // ── SEPARATOR ──
    const drawLine = (yPos: number) => {
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.line(margin, yPos, margin + cw, yPos);
    };

    drawLine(y);
    y += 5;

    // ── CLIENT INFO ──
    const addRow = (label: string, value: string, xOffset = 0) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(8);
      doc.text(label, margin + xOffset, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text(value, margin + xOffset + 1, y + 4);
    };

    addRow(labels.client, client?.name ?? "—");
    addRow(labels.phone, client?.phone ?? "—", 80);
    y += 10;

    // ── TOUR INFO ──
    drawLine(y);
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(green[0], green[1], green[2]);
    doc.setFontSize(11);
    doc.text(tour?.title ?? "—", margin, y + 1);
    y += 7;

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    // Grid of details
    const detailCol = cw / 4;
    const detailRow = (label: string, value: string, col: number) => {
      const x = margin + col * detailCol;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(label, x, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text(value, x, y + 4);
      doc.setFontSize(8);
    };

    detailRow(labels.date, r.reservation_date, 0);
    detailRow(labels.time, r.reservation_time || "—", 1);
    detailRow(labels.zone, r.zone || "—", 2);
    detailRow(labels.modality, r.modality === "shared" ? labels.shared : labels.private, 3);
    y += 10;

    detailRow(labels.adults, String(r.pax_adults), 0);
    detailRow(labels.children, String(r.pax_children), 1);
    if (tour?.meeting_point) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(labels.meetingPoint, margin + 2 * detailCol, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      const mpLines = doc.splitTextToSize(tour.meeting_point, detailCol * 2 - 4);
      doc.text(mpLines, margin + 2 * detailCol, y + 4);
      doc.setFontSize(8);
    }
    y += 12;

    // ── INCLUDES ──
    if (tour?.includes && tour.includes.length > 0) {
      drawLine(y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(green[0], green[1], green[2]);
      doc.setFontSize(9);
      doc.text(labels.includes, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      const incPerRow = 2;
      for (let i = 0; i < tour.includes.length; i += incPerRow) {
        for (let j = 0; j < incPerRow && i + j < tour.includes.length; j++) {
          doc.text(`✓ ${tour.includes[i + j]}`, margin + j * (cw / 2), y);
        }
        y += 4;
      }
      y += 2;
    }

    // ── PAYMENT SUMMARY ──
    drawLine(y);
    y += 2;
    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(margin, y, cw, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(labels.total, margin + 4, y + 7);
    doc.setFontSize(14);
    doc.text(fmtMXN(r.total_mxn), margin + cw - 4, y + 7, { align: "right" });
    y += 14;

    // ── Line items if available ──
    if (items && items.length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      for (const item of items) {
        const itemTour = (item as any).tours?.title ?? "—";
        const sub = item.qty_adults * item.unit_price_mxn + item.qty_children * item.unit_price_child_mxn;
        doc.setFont("helvetica", "normal");
        doc.text(`${itemTour}: ${item.qty_adults}A × ${fmtMXN(item.unit_price_mxn)}`, margin, y);
        if (item.qty_children > 0) {
          doc.text(` + ${item.qty_children}M × ${fmtMXN(item.unit_price_child_mxn)}`, margin + 90, y);
        }
        doc.text(`= ${fmtMXN(sub)}`, margin + cw - 4, y, { align: "right" });
        y += 4;
      }
      y += 2;
    }

    // ── NOTES ──
    if (r.notes) {
      drawLine(y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(8);
      doc.text(labels.notes, margin, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const noteLines = doc.splitTextToSize(r.notes, cw);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 3.5 + 3;
    }

    // ── CANCELLATION POLICY ──
    drawLine(y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFontSize(7);
    doc.text(labels.cancellation.toUpperCase(), margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    const policyLines = doc.splitTextToSize(policy, cw);
    doc.text(policyLines, margin, y);
    y += policyLines.length * 3 + 4;

    // ── FOOTER ──
    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(margin, y, cw, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(labels.thanks, pw / 2, y + 5.5, { align: "center" });

    const pdfBytes = doc.output("arraybuffer");
    const filename = `voucher-${r.folio ?? id}.pdf`;

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
