import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import walkMeLogo from "@/assets/walkme-logo.png";
import {
  CheckCircle, MapPin, Users, Calendar, Clock, CreditCard,
  AlertTriangle, Phone, Mail, Globe, Building2,
} from "lucide-react";

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
    operator_name?: string | null;
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
    pickup_point?: string;
    tour_language?: string;
    tax_included?: boolean;
    pax_email?: string;
    tours?: { title: string; includes: string[]; meeting_point: string; short_description: string } | null;
    clients?: { name: string; phone: string; email: string | null } | null;
  };
  lang?: "es" | "en";
  onSiteFees?: OnSiteFees;
}

const DEFAULT_POLICY_ES =
  "POLÍTICAS DE CANCELACIÓN — Cualquier cambio o cancelación a su reserva deberá acudir a las oficinas de WALKME TOURS con su ticket de compra original, solo se permite un cambio por reservación y las reservaciones con cambios no pueden ser canceladas. Para reembolsos completos se contemplarán con 72 horas de anticipación a su servicio. En caso de no estar a la hora indicada en este cupón y perder la excursión no habrá derecho a reembolso. No aplica reembolso el mismo día de la excursión. El acto de suscripción o compra implica la total conformidad de todas y cada una de las condiciones mencionadas en este cupón. WALKME TOURS actúa como agente intermediario de compañías de transportación y prestadores de servicios turísticos (proveedores), sin asumir responsabilidad alguna por accidentes, muerte, pérdidas y/o daños materiales o humanos, cambios de horario o alguna otra irregularidad originada por caso fortuito o fuerza mayor ocurrida durante su travesía. Todos los proveedores de tours son contratistas independientes. El acto de su suscripción o compra implica la total conformidad de todas y cada una de las condiciones mencionadas en este cupón. Los menores de edad deberán ir acompañados por un adulto responsable en todo momento.";

const DEFAULT_POLICY_EN =
  "CANCELLATION POLICIES — Any change or cancellation to your reservation must go to the desks of WALKME TOURS with your original purchase ticket, only one change per reservation is allowed and reservations with changes cannot be canceled. For full refunds, they will be considered 72 hours in advance of your service. In case of not being at the time indicated in this coupon and losing the excursion, there will be no right to reimbursement. No refund applies the same day of the excursion. The act of subscription or purchase implies full compliance with every one of the conditions mentioned in this coupon. WALKME TOURS acts as an intermediary agent between the transportation companies and tour service providers (suppliers), without assuming any responsibility for accidents, death, personal damage, loss/damage of material goods, change of schedule or any other irregular occurrence and unforeseen event during your excursion. All such suppliers providing tour services are independent contractors. The act of purchasing a service becomes the full agreement of all the terms and conditions stated in this coupon. Minors must be accompanied by a responsible adult at all times.";

const t = {
  es: {
    title: "VOUCHER DE RESERVA",
    folio: "FOLIO",
    operator: "OPERADOR",
    confirmation: "CONFIRMACIÓN",
    date: "FECHA",
    adults: "ADULTOS",
    minors: "MENORES",
    language: "IDIOMA",
    tourDate: "FECHA",
    tourTime: "HORA",
    modality: "MODALIDAD",
    zone: "ZONA",
    hotel: "HOTEL",
    pickupPoint: "PUNTO DE PICKUP",
    includes: "INCLUYE",
    priceAdult: "Adulto",
    priceChild: "Menor",
    total: "TOTAL",
    notes: "NOTAS",
    cancellation: "POLÍTICAS DE CANCELACIÓN",
    shared: "Compartido",
    private: "Privado",
    thanks: "¡Gracias por elegir WalkMe Tours!",
    confirmed: "CONFIRMADA",
    cancelled: "CANCELADA",
    pending: "PENDIENTE",
    important: "IMPORTANTE",
  taxNote: "se paga al abordar en efectivo",
    perAdult: "por adulto",
    perChild: "por menor",
    deposit: "DEPÓSITO PAGADO",
    balanceDue: "PENDIENTE AL ABORDAR",
  },
  en: {
    title: "RESERVATION VOUCHER",
    folio: "FOLIO",
    operator: "OPERATOR",
    confirmation: "CONFIRMATION",
    date: "DATE",
    adults: "ADULTS",
    minors: "MINORS",
    language: "LANGUAGE",
    tourDate: "DATE",
    tourTime: "TIME",
    modality: "MODALITY",
    zone: "ZONE",
    hotel: "HOTEL",
    pickupPoint: "PICKUP POINT",
    includes: "INCLUDES",
    priceAdult: "Adult",
    priceChild: "Minor",
    total: "TOTAL",
    notes: "NOTES",
    cancellation: "CANCELLATION POLICIES",
    shared: "Shared",
    private: "Private",
    thanks: "Thank you for choosing WalkMe Tours!",
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    pending: "PENDING",
    important: "IMPORTANT",
  taxNote: "payable at boarding in cash",
    perAdult: "per adult",
    perChild: "per minor",
    deposit: "DEPOSIT PAID",
    balanceDue: "BALANCE DUE AT BOARDING",
  },
};

const fmtMXN = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;

const DARK_GREEN = "#1B3D2F";
const LIGHT_GREEN = "#E1F5EE";
const LIGHT_YELLOW = "#FFF8EB";
const LIGHT_GRAY = "#f7f6f3";
const LIGHT_RED = "#FEF2F2";
const LIGHT_NOTES = "#FFFBEB";
const PINK = "#E85B8A";
const ORANGE = "#E8943A";

const labelStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "8px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

export default function VoucherPrintView({
  reservation,
  lang: initialLang = "es",
  onSiteFees,
}: VoucherProps) {
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
      data?.forEach((row) => (map[row.key] = row.value));
      return map;
    },
  });

  const policy =
    lang === "es"
      ? policies?.cancellation_policy_es || DEFAULT_POLICY_ES
      : policies?.cancellation_policy_en || DEFAULT_POLICY_EN;

  const r = reservation;
  const tour = r.tours;
  const client = r.clients;

  const isCancelled = r.status === "cancelled";
  const isConfirmed = !!r.operator_folio && !isCancelled;

  const statusLabel = isCancelled ? l.cancelled : isConfirmed ? l.confirmed : l.pending;
  const statusBg = isCancelled ? "#dc2626" : isConfirmed ? "#16a34a" : "#d97706";

  const pickupDisplay = r.pickup_point || r.pickup_notes;

  return (
    <div
      className="voucher-print-root bg-white text-black"
      id="voucher-content"
      style={{ fontFamily: "Arial, sans-serif", maxWidth: "680px", margin: "0 auto" }}
    >
      {/* Language toggle — hidden on print */}
      <div className="flex justify-end gap-1 mb-2 print:hidden">
        <button
          onClick={() => setLang("es")}
          style={
            lang === "es"
              ? { backgroundColor: DARK_GREEN, color: "white", border: "none", padding: "3px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer" }
              : { background: "none", border: "1px solid #d1d5db", color: "#6b7280", padding: "3px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer" }
          }
        >
          ES
        </button>
        <button
          onClick={() => setLang("en")}
          style={
            lang === "en"
              ? { backgroundColor: DARK_GREEN, color: "white", border: "none", padding: "3px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer" }
              : { background: "none", border: "1px solid #d1d5db", color: "#6b7280", padding: "3px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer" }
          }
        >
          EN
        </button>
      </div>

      {/* ── HEADER ── */}
      <div
        style={{
          backgroundColor: DARK_GREEN,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={walkMeLogo}
            alt="WalkMe Tours"
            style={{
              height: "36px",
              width: "auto",
              background: "white",
              borderRadius: "6px",
              padding: "3px",
            }}
          />
          <div>
            <div style={{ color: "white", fontWeight: "bold", fontSize: "15px", letterSpacing: "1px" }}>
              WALKME TOURS
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "8px", letterSpacing: "2px" }}>
              {l.title}
            </div>
          </div>
        </div>
        <span
          style={{
            backgroundColor: statusBg,
            color: "white",
            padding: "3px 10px",
            borderRadius: "20px",
            fontSize: "9px",
            fontWeight: "bold",
            letterSpacing: "1px",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* ── FOLIOS BAR ── */}
      <div
        style={{
          backgroundColor: LIGHT_GRAY,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          padding: "5px 12px",
          gap: "6px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div>
          <div style={labelStyle}>{l.folio}</div>
          <div style={{ color: DARK_GREEN, fontWeight: "bold", fontSize: "13px", fontFamily: "monospace", marginTop: "2px" }}>
            {r.folio ?? "—"}
          </div>
        </div>
        <div>
          <div style={labelStyle}>{l.operator}</div>
          <div style={{ fontWeight: "600", fontSize: "11px", marginTop: "2px" }}>
            {r.operator_name ?? "—"}
          </div>
        </div>
        <div>
          <div style={labelStyle}>{l.confirmation}</div>
          <div style={{ fontWeight: "600", fontSize: "11px", fontFamily: "monospace", marginTop: "2px" }}>
            {r.operator_confirmation_code ?? "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={labelStyle}>{l.date}</div>
          <div style={{ fontWeight: "600", fontSize: "11px", marginTop: "2px" }}>
            {new Date(r.created_at).toLocaleDateString(lang === "es" ? "es-MX" : "en-US")}
          </div>
        </div>
      </div>

      {/* ── CLIENT SECTION ── */}
      <div
        style={{
          padding: "6px 12px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          gap: "12px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: "bold", fontSize: "13px", color: "#111827" }}>
            {client?.name ?? "—"}
          </div>
          {client?.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
              <Phone size={10} color="#9ca3af" />
              <span style={{ color: "#6b7280", fontSize: "10px" }}>{client.phone}</span>
            </div>
          )}
          {(r.pax_email || client?.email) && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "1px" }}>
              <Mail size={10} color="#9ca3af" />
              <span style={{ color: "#6b7280", fontSize: "10px" }}>{r.pax_email || client?.email}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <div
            style={{
              backgroundColor: DARK_GREEN,
              color: "white",
              borderRadius: "6px",
              padding: "5px 10px",
              textAlign: "center",
              minWidth: "44px",
            }}
          >
            <div style={{ fontSize: "7px", letterSpacing: "1px", opacity: 0.75 }}>{l.adults}</div>
            <div style={{ fontWeight: "bold", fontSize: "14px", lineHeight: 1 }}>{r.pax_adults}</div>
          </div>
          <div
            style={{
              backgroundColor: ORANGE,
              color: "white",
              borderRadius: "6px",
              padding: "5px 10px",
              textAlign: "center",
              minWidth: "44px",
            }}
          >
            <div style={{ fontSize: "7px", letterSpacing: "1px", opacity: 0.75 }}>{l.minors}</div>
            <div style={{ fontWeight: "bold", fontSize: "14px", lineHeight: 1 }}>{r.pax_children}</div>
          </div>
          {r.tour_language && (
            <div
              style={{
                backgroundColor: PINK,
                color: "white",
                borderRadius: "6px",
                padding: "5px 10px",
                textAlign: "center",
                minWidth: "44px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
              }}
            >
              <Globe size={9} color="white" />
              <div style={{ fontSize: "7px", letterSpacing: "1px", color: "white" }}>{l.language}</div>
              <div style={{ fontWeight: "bold", fontSize: "9px", lineHeight: 1, color: "white" }}>{r.tour_language}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── TOUR SECTION ── */}
      <div
        style={{
          backgroundColor: LIGHT_GREEN,
          padding: "6px 12px",
          borderBottom: "1px solid #c8ead8",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "12px", color: DARK_GREEN, marginBottom: "4px" }}>
          {tour?.title ?? "—"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
          <div>
            <div style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "3px" }}>
              <Calendar size={9} />
              {l.tourDate}
            </div>
            <div style={{ fontWeight: "600", fontSize: "11px", marginTop: "2px" }}>
              {r.reservation_date}
            </div>
          </div>
          <div>
            <div style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "3px" }}>
              <Clock size={9} />
              {l.tourTime}
            </div>
            <div style={{ fontWeight: "600", fontSize: "11px", marginTop: "2px" }}>
              {r.reservation_time || "—"}
            </div>
          </div>
          <div>
            <div style={labelStyle}>{l.modality}</div>
            <div style={{ fontWeight: "600", fontSize: "11px", marginTop: "2px" }}>
              {r.modality === "shared" ? l.shared : l.private}
            </div>
          </div>
          <div>
            <div style={labelStyle}>{l.zone}</div>
            <div style={{ fontWeight: "600", fontSize: "11px", marginTop: "2px" }}>
              {r.zone || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ── HOTEL / PICKUP SECTION ── */}
      {(r.hotel_name || pickupDisplay) && (
        <div
          style={{
            backgroundColor: LIGHT_YELLOW,
            padding: "5px 12px",
            borderBottom: "1px solid #fde68a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div>
            {r.hotel_name && (
              <>
                <div style={{ ...labelStyle, color: "#92400e", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Building2 size={9} />
                  {l.hotel}
                </div>
                <div style={{ fontWeight: "600", fontSize: "12px", marginTop: "2px" }}>
                  {r.hotel_name}
                </div>
              </>
            )}
          </div>
          {pickupDisplay && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  ...labelStyle,
                  color: "#92400e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "3px",
                }}
              >
                <MapPin size={9} />
                {l.pickupPoint}
              </div>
              <div style={{ fontWeight: "600", fontSize: "12px", marginTop: "2px" }}>
                {pickupDisplay}
              </div>
              {r.reservation_time && (
                <div style={{ color: "#6b7280", fontSize: "10px" }}>{r.reservation_time}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── INCLUDES SECTION ── */}
      {tour?.includes && tour.includes.length > 0 && (
        <div style={{ padding: "5px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <div
            style={{
              ...labelStyle,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "3px",
            }}
          >
            <CheckCircle size={9} color={DARK_GREEN} />
            {l.includes}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 12px" }}>
            {tour.includes.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                <span style={{ color: DARK_GREEN, fontWeight: "bold", fontSize: "11px", lineHeight: 1 }}>+</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PAYMENT SECTION ── */}
      <div style={{ borderBottom: "1px solid #f3f4f6" }}>
        {r.unit_price_mxn !== undefined && r.unit_price_mxn > 0 && (
          <div style={{ padding: "4px 12px" }}>
            {r.pax_adults > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  padding: "2px 0",
                  borderBottom: r.pax_children > 0 ? "1px solid #f9fafb" : "none",
                  color: "#4b5563",
                }}
              >
                <span>{r.pax_adults} × {l.priceAdult}</span>
                <span style={{ fontFamily: "monospace" }}>
                  {fmtMXN(r.unit_price_mxn!)} × {r.pax_adults} ={" "}
                  <strong>{fmtMXN(r.pax_adults * r.unit_price_mxn!)}</strong>
                </span>
              </div>
            )}
            {r.pax_children > 0 &&
              r.unit_price_child_mxn !== undefined &&
              r.unit_price_child_mxn > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    padding: "2px 0",
                    color: "#4b5563",
                  }}
                >
                  <span>{r.pax_children} × {l.priceChild}</span>
                  <span style={{ fontFamily: "monospace" }}>
                    {fmtMXN(r.unit_price_child_mxn!)} × {r.pax_children} ={" "}
                    <strong>{fmtMXN(r.pax_children * r.unit_price_child_mxn!)}</strong>
                  </span>
                </div>
              )}
          </div>
        )}
        <div
          style={{
            backgroundColor: DARK_GREEN,
            padding: "6px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <CreditCard size={14} color="white" />
            <span style={{ color: "white", fontWeight: "bold", fontSize: "11px", letterSpacing: "1px" }}>
              {l.total}
            </span>
          </div>
          <span style={{ color: "white", fontWeight: "bold", fontSize: "15px" }}>
            {fmtMXN(r.total_mxn)}
          </span>
        </div>
      </div>

      {/* ── TAX / ON-SITE FEES SECTION ── */}
      {onSiteFees && (onSiteFees.amountPerAdult > 0 || onSiteFees.amountPerChild > 0) && (
        <div
          style={{
            backgroundColor: LIGHT_RED,
            padding: "5px 12px",
            borderBottom: "1px solid #fecaca",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
            <AlertTriangle size={11} color="#b91c1c" />
            <span style={{ color: "#b91c1c", fontWeight: "bold", fontSize: "10px" }}>{l.important}</span>
          </div>
          <p style={{ color: "#991b1b", fontSize: "10px", margin: 0 }}>
            {onSiteFees.amountPerAdult > 0 &&
              `$${onSiteFees.amountPerAdult.toFixed(2)} ${onSiteFees.currency} ${l.perAdult}`}
            {onSiteFees.amountPerAdult > 0 && onSiteFees.amountPerChild > 0 && " / "}
            {onSiteFees.amountPerChild > 0 &&
              `$${onSiteFees.amountPerChild.toFixed(2)} ${onSiteFees.currency} ${l.perChild}`}
            {" — "}
            {l.taxNote}.
          </p>
        </div>
      )}

      {/* ── NOTES ── */}
      {r.notes && (
        <div
          style={{
            backgroundColor: LIGHT_NOTES,
            padding: "5px 12px",
            borderBottom: "1px solid #fde68a",
          }}
        >
          <div style={{ ...labelStyle, color: "#92400e", marginBottom: "3px" }}>{l.notes}</div>
          <p style={{ fontSize: "10px", color: "#4b5563", whiteSpace: "pre-wrap", margin: 0 }}>
            {r.notes}
          </p>
        </div>
      )}

      {/* ── CANCELLATION POLICIES ── */}
      <div
        style={{
          backgroundColor: LIGHT_GRAY,
          padding: "5px 12px",
          borderTop: "1px solid #e5e7eb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ ...labelStyle, marginBottom: "3px" }}>{l.cancellation}</div>
        <p style={{ fontSize: "7px", color: "#6b7280", lineHeight: "1.35", margin: 0 }}>{policy}</p>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ backgroundColor: DARK_GREEN, padding: "5px 12px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "10px", fontWeight: "500", margin: 0 }}>
          {l.thanks}
        </p>
      </div>
    </div>
  );
}
