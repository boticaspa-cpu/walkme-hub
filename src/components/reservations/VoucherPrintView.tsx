import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import walkMeLogo from "@/assets/walkme-logo.png";
import { CheckCircle, MapPin, Users, Calendar, Clock, CreditCard, FileText, AlertTriangle } from "lucide-react";

interface OnSiteFees {
  amountPerAdult: number;
  amountPerChild: number;
  currency: string;
}

interface VoucherProps {
  reservation: {
    id: string;
    folio: string | null;
    operator_folio?: string | null;
    cancellation_folio?: string | null;
    operator_confirmation_code?: string;
    reservation_date: string;
    reservation_time: string;
    pax_adults: number;
    pax_children: number;
    total_mxn: number;
    unit_price_mxn?: number;
    unit_price_child_mxn?: number;
    modality: string;
    zone: string;
    nationality: string;
    notes: string | null;
    created_at: string;
    status?: string;
    hotel_name?: string;
    pickup_notes?: string;
    pax_email?: string;
    tours?: { title: string; includes: string[]; meeting_point: string; short_description: string } | null;
    clients?: { name: string; phone: string; email: string | null } | null;
  };
  lang?: "es" | "en";
  onSiteFees?: OnSiteFees;
}

const DEFAULT_POLICY_ES = `Cualquier cambio o cancelación deberá realizarse con al menos 48 horas de anticipación. Cancelaciones con menos de 48 horas de anticipación o no shows no son reembolsables. WalkMe Tours se reserva el derecho de modificar horarios o itinerarios por condiciones climáticas o de seguridad. Menores de edad deben ir acompañados de un adulto responsable.`;
const DEFAULT_POLICY_EN = `Any change or cancellation must be made at least 48 hours in advance. Cancellations with less than 48 hours notice or no-shows are non-refundable. WalkMe Tours reserves the right to modify schedules or itineraries due to weather or safety conditions. Minors must be accompanied by a responsible adult.`;

const t = {
  es: {
    title: "VOUCHER DE RESERVA",
    folio: "Folio",
    operatorFolio: "Folio Operador",
    cancellationFolio: "Folio Cancelación",
    purchaseDate: "Fecha de compra",
    client: "Cliente",
    phone: "Teléfono",
    email: "Email",
    adults: "Adultos",
    children: "Menores",
    tour: "Tour",
    departure: "Punto de encuentro",
    tourDate: "Fecha del tour",
    tourTime: "Hora",
    includes: "Incluye",
    priceAdult: "Precio adulto",
    priceChild: "Precio menor",
    total: "Total",
    notes: "Notas",
    cancellation: "Políticas de cancelación",
    modality: "Modalidad",
    shared: "Compartido",
    private: "Privado",
    zone: "Zona",
    thanks: "¡Gracias por elegir WalkMe Tours!",
    passengers: "Pasajeros",
    tourDetails: "Detalles del Tour",
    paymentSummary: "Resumen de Pago",
    confirmed: "CONFIRMADA",
    cancelled: "CANCELADA",
    pending: "PENDIENTE",
  },
  en: {
    title: "RESERVATION VOUCHER",
    folio: "Folio",
    operatorFolio: "Operator Folio",
    cancellationFolio: "Cancellation Folio",
    purchaseDate: "Purchase date",
    client: "Client",
    phone: "Phone",
    email: "Email",
    adults: "Adults",
    children: "Minors",
    tour: "Tour",
    departure: "Meeting point",
    tourDate: "Tour date",
    tourTime: "Time",
    includes: "Includes",
    priceAdult: "Adult price",
    priceChild: "Minor price",
    total: "Total",
    notes: "Notes",
    cancellation: "Cancellation policies",
    modality: "Modality",
    shared: "Shared",
    private: "Private",
    zone: "Zone",
    thanks: "Thank you for choosing WalkMe Tours!",
    passengers: "Passengers",
    tourDetails: "Tour Details",
    paymentSummary: "Payment Summary",
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    pending: "PENDING",
  },
};

const fmtMXN = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;

export default function VoucherPrintView({ reservation, lang: initialLang = "es", onSiteFees }: VoucherProps) {
  const [lang, setLang] = useState<"es" | "en">(initialLang);
  const l = t[lang];

  const { data: policies } = useQuery({
    queryKey: ["cancellation-policies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["cancellation_policy_es", "cancellation_policy_en"]);
      const map: Record<string, string> = {};
      data?.forEach((r) => (map[r.key] = r.value));
      return map;
    },
  });

  const policy = lang === "es"
    ? (policies?.cancellation_policy_es || DEFAULT_POLICY_ES)
    : (policies?.cancellation_policy_en || DEFAULT_POLICY_EN);

  const r = reservation;
  const tour = r.tours;
  const client = r.clients;

  const isCancelled = r.status === "cancelled";
  const isConfirmed = !!r.operator_folio && !isCancelled;

  const statusLabel = isCancelled ? l.cancelled : isConfirmed ? l.confirmed : l.pending;
  const statusColor = isCancelled ? "#dc2626" : isConfirmed ? "#2d5a27" : "#d97706";

  return (
    <div className="voucher-print-root bg-white text-black" id="voucher-content" style={{ fontFamily: "Arial, sans-serif", maxWidth: "680px", margin: "0 auto" }}>
      {/* Language toggle — hidden on print */}
      <div className="flex justify-end gap-1 mb-3 print:hidden">
        <button
          onClick={() => setLang("es")}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${lang === "es" ? "text-white border-transparent" : "border-gray-300 text-gray-600"}`}
          style={lang === "es" ? { backgroundColor: "#2d5a27" } : {}}
        >
          ES
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${lang === "en" ? "text-white border-transparent" : "border-gray-300 text-gray-600"}`}
          style={lang === "en" ? { backgroundColor: "#2d5a27" } : {}}
        >
          EN
        </button>
      </div>

      {/* ── HEADER ── */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: "2px solid #2d5a27" }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ background: "linear-gradient(135deg, #2d5a27 0%, #3d7a35 100%)" }}>
          <div className="flex items-center gap-3">
            <img src={walkMeLogo} alt="WalkMe Tours" className="h-14 w-auto rounded-lg" style={{ background: "white", padding: "4px" }} />
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">WALKME TOURS</h1>
              <p className="text-xs text-white/80">{l.title}</p>
            </div>
          </div>
          <div className="text-right">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: statusColor }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Folios row */}
        <div className="flex flex-wrap gap-4 px-5 py-3 bg-white" style={{ borderTop: "1px solid #e5e7eb" }}>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-400">{l.folio}</span>
            <p className="text-sm font-bold font-mono" style={{ color: "#2d5a27" }}>{r.folio ?? "—"}</p>
          </div>
          {r.operator_folio && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">{l.operatorFolio}</span>
              <p className="text-sm font-bold font-mono" style={{ color: "#2d5a27" }}>{r.operator_folio}</p>
            </div>
          )}
          {r.cancellation_folio && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">{l.cancellationFolio}</span>
              <p className="text-sm font-bold font-mono text-red-600">{r.cancellation_folio}</p>
            </div>
          )}
          <div className="ml-auto text-right">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">{l.purchaseDate}</span>
            <p className="text-sm">{new Date(r.created_at).toLocaleDateString(lang === "es" ? "es-MX" : "en-US")}</p>
          </div>
        </div>
      </div>

      {/* ── CLIENT SECTION ── */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "#f0f7ef" }}>
          <Users size={14} style={{ color: "#2d5a27" }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2d5a27" }}>{l.passengers}</h3>
        </div>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500">{l.client}</th>
              <th className="text-center py-2 px-4 text-xs font-semibold text-gray-500">{l.adults}</th>
              <th className="text-center py-2 px-4 text-xs font-semibold text-gray-500">{l.children}</th>
              <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500">{l.zone}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: "1px solid #f3f4f6" }}>
              <td className="py-2 px-4">
                <p className="font-medium">{client?.name ?? "—"}</p>
                {client?.phone && <p className="text-xs text-gray-400">{client.phone}</p>}
              </td>
              <td className="text-center py-2 px-4 font-bold" style={{ color: "#2d5a27" }}>{r.pax_adults}</td>
              <td className="text-center py-2 px-4 font-bold" style={{ color: "#2d5a27" }}>{r.pax_children}</td>
              <td className="text-right py-2 px-4">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: "#f0f7ef", color: "#2d5a27" }}>
                  {r.zone || "—"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── TOUR DETAILS ── */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "#f0f7ef" }}>
          <Calendar size={14} style={{ color: "#2d5a27" }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2d5a27" }}>{l.tourDetails}</h3>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-base font-bold" style={{ color: "#2d5a27" }}>{tour?.title ?? "—"}</p>
            {tour?.short_description && <p className="text-xs text-gray-500 mt-0.5">{tour.short_description}</p>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-start gap-1.5">
              <Calendar size={12} className="mt-0.5 text-gray-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase text-gray-400">{l.tourDate}</p>
                <p className="text-sm font-medium">{r.reservation_date}</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <Clock size={12} className="mt-0.5 text-gray-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase text-gray-400">{l.tourTime}</p>
                <p className="text-sm font-medium">{r.reservation_time || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <MapPin size={12} className="mt-0.5 text-gray-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase text-gray-400">{l.departure}</p>
                <p className="text-sm font-medium">{tour?.meeting_point || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <FileText size={12} className="mt-0.5 text-gray-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase text-gray-400">{l.modality}</p>
                <p className="text-sm font-medium">{r.modality === "shared" ? l.shared : l.private}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INCLUDES ── */}
      {tour?.includes && tour.includes.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #e5e7eb" }}>
          <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "#f0f7ef" }}>
            <CheckCircle size={14} style={{ color: "#2d5a27" }} />
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2d5a27" }}>{l.includes}</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {tour.includes.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span style={{ color: "#2d5a27" }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT SUMMARY ── */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "#f0f7ef" }}>
          <CreditCard size={14} style={{ color: "#2d5a27" }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2d5a27" }}>{l.paymentSummary}</h3>
        </div>
        {r.unit_price_mxn !== undefined && r.unit_price_mxn > 0 && (
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {r.pax_adults > 0 && (
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td className="py-2 px-4 text-gray-600">{r.pax_adults} × {l.priceAdult}</td>
                  <td className="py-2 px-4 text-right text-gray-500">{fmtMXN(r.unit_price_mxn!)}</td>
                  <td className="py-2 px-4 text-right font-medium">{fmtMXN(r.pax_adults * r.unit_price_mxn!)}</td>
                </tr>
              )}
              {r.pax_children > 0 && r.unit_price_child_mxn !== undefined && r.unit_price_child_mxn > 0 && (
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td className="py-2 px-4 text-gray-600">{r.pax_children} × {l.priceChild}</td>
                  <td className="py-2 px-4 text-right text-gray-500">{fmtMXN(r.unit_price_child_mxn!)}</td>
                  <td className="py-2 px-4 text-right font-medium">{fmtMXN(r.pax_children * r.unit_price_child_mxn!)}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <div className="flex justify-between items-center px-4 py-3" style={{ background: "linear-gradient(135deg, #2d5a27 0%, #3d7a35 100%)" }}>
          <span className="text-sm font-bold text-white">{l.total}</span>
          <span className="text-xl font-bold text-white">{fmtMXN(r.total_mxn)}</span>
        </div>
      </div>

      {/* ── On-site fees warning ── */}
      {onSiteFees && (onSiteFees.amountPerAdult > 0 || onSiteFees.amountPerChild > 0) && (
        <div className="mb-4 rounded-xl p-3" style={{ border: "2px solid #dc2626", backgroundColor: "#fef2f2" }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-600" />
            <p className="text-sm font-bold text-red-700">
              {lang === "es" ? "IMPORTANTE" : "IMPORTANT"}
            </p>
          </div>
          <p className="text-xs text-red-700">
            {lang === "es"
              ? `Impuesto de $${onSiteFees.amountPerAdult.toFixed(2)} ${onSiteFees.currency} por adulto${onSiteFees.amountPerChild > 0 ? ` / $${onSiteFees.amountPerChild.toFixed(2)} ${onSiteFees.currency} por menor` : ""} — se paga al abordar en efectivo.`
              : `Fee of $${onSiteFees.amountPerAdult.toFixed(2)} ${onSiteFees.currency} per adult${onSiteFees.amountPerChild > 0 ? ` / $${onSiteFees.amountPerChild.toFixed(2)} ${onSiteFees.currency} per child` : ""} — payable at boarding in cash.`}
          </p>
        </div>
      )}

      {/* ── Notes ── */}
      {r.notes && (
        <div className="mb-4 rounded-xl p-3" style={{ border: "1px solid #e5e7eb", backgroundColor: "#fffbeb" }}>
          <h3 className="text-xs font-bold mb-1 text-gray-700">{l.notes}</h3>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{r.notes}</p>
        </div>
      )}

      {/* ── Cancellation policy ── */}
      <div className="mb-4 rounded-xl p-3" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
        <h3 className="text-[10px] font-bold mb-1 uppercase tracking-wider text-gray-400">{l.cancellation}</h3>
        <p className="text-[10px] text-gray-500 leading-tight whitespace-pre-wrap">{policy}</p>
      </div>

      {/* ── Footer ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #2d5a27 0%, #3d7a35 100%)" }}>
        <p className="text-center text-xs text-white/90 py-2.5 font-medium">
          🌴 {l.thanks}
        </p>
      </div>
    </div>
  );
}
