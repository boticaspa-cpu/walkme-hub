import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import walkMeLogo from "@/assets/walkme-logo.png";
import {
  CheckCircle, MapPin, Users, Calendar, Clock, CreditCard,
  AlertTriangle, Phone, Mail, Globe, Building2,
} from "lucide-react";
import {
  ageNotes, freeInfantNote, groupPax, hasConsistentUnitPrices, hasMinors,
  isDatePending, paxSummary, totalsOf,
  type VoucherGroup, type VoucherLine,
} from "@/lib/voucher-lines";

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
    deposit_mxn?: number;
    balance_mxn?: number;
    balance_currency?: string;
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
    /** Every tour of the booking; built by loadVoucherGroup. */
    voucher_group?: VoucherGroup | null;
    /** Amount already taken off total_mxn for on-site fees. */
    _total_adjust_mxn?: number;
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
    copy: "COPIA CLIENTE",
    passengers: "PASAJEROS",
    breakdown: "DESGLOSE DE COMPRA",
    experience: "EXPERIENCIA",
    pickup: "PICK-UP",
    pricePerson: "PRECIO / PERSONA",
    amount: "IMPORTE",
    datePending: "FECHA POR CONFIRMAR",
    regularAmount: "Importe regular",
    promoDiscount: "Descuento promocional",
    importantInfo: "INFORMACIÓN IMPORTANTE",
    childIncluded: "INFANTE INCLUIDO",
    dateTitle: "Fecha por confirmar",
    dateText: "El horario de pick-up se confirmará al definir la fecha.",
    pickupTitle: "Pick-up",
    pickupText: "Presentarse 10-15 minutos antes de la salida en el punto de pick-up del hotel.",
    childVerifTitle: "Verificación de menores",
    childVerifText: "Lleve el pasaporte original del menor o un comprobante de edad válido.",
    infantWord: "Infante",
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
    copy: "CLIENT COPY",
    passengers: "PASSENGERS",
    breakdown: "PURCHASE BREAKDOWN",
    experience: "EXPERIENCE",
    pickup: "PICK-UP",
    pricePerson: "PRICE / PERSON",
    amount: "AMOUNT",
    datePending: "DATE PENDING",
    regularAmount: "Regular amount",
    promoDiscount: "Promotional discount",
    importantInfo: "IMPORTANT INFORMATION",
    childIncluded: "CHILD INCLUDED",
    dateTitle: "Date pending",
    dateText: "The pick-up time will be confirmed once the date is set.",
    pickupTitle: "Pick-up",
    pickupText: "Please be ready 10-15 minutes before departure at the hotel pick-up point.",
    childVerifTitle: "Child verification",
    childVerifText: "Please carry the child's original passport or valid proof of age.",
    infantWord: "Infant",
  },
};

const fmtMXN = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;

const formatDate = (date: string, lang: "es" | "en") =>
  new Date(`${date}T12:00:00`).toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
    day: "2-digit", month: "short", year: "numeric",
  });

const BREAKDOWN_COLS = "2.3fr 1fr 0.8fr 1.2fr 1fr";

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

  // Older callers may not have loaded the group; fall back to this reservation alone.
  const lines: VoucherLine[] = r.voucher_group?.lines?.length
    ? r.voucher_group.lines
    : [{
        id: r.id,
        reservationId: r.id,
        tourId: null,
        folio: r.folio,
        title: tour?.title ?? "—",
        packageName: null,
        includes: tour?.includes ?? [],
        date: r.reservation_date,
        time: r.reservation_time,
        adults: r.pax_adults,
        children: r.pax_children,
        infants: 0,
        childAges: [],
        infantAges: [],
        unitAdult: r.unit_price_mxn ?? 0,
        unitChild: r.unit_price_child_mxn ?? 0,
        unitInfant: 0,
        amount: r.total_mxn,
        discount: 0,
        operatorId: null,
        operatorName: r.operator_name ?? null,
      }];
  const totals = totalsOf(lines);
  const displayTotal = Math.max(0, totals.total - (r._total_adjust_mxn ?? 0));
  const pax = groupPax(lines);
  const folios = r.voucher_group?.folios?.length ? r.voucher_group.folios : [r.folio ?? "—"];
  const operatorNames = [...new Set(lines.map((x) => x.operatorName).filter((n): n is string => !!n))];
  const deposit = r.voucher_group ? r.voucher_group.deposit : r.deposit_mxn ?? 0;
  const balance = r.voucher_group ? r.voucher_group.balance : r.balance_mxn ?? 0;
  const freeInfants = freeInfantNote(lines, lang);
  const pendingTours = lines.filter(isDatePending).map((x) => x.title);

  const importantItems: { title: string; text: string }[] = [];
  if (freeInfants) importantItems.push({ title: l.childIncluded, text: freeInfants });
  if (pendingTours.length > 0) {
    importantItems.push({ title: `${pendingTours.join(", ")}:`, text: l.dateText });
  }
  importantItems.push({ title: `${l.pickupTitle}:`, text: l.pickupText });
  if (hasMinors(lines)) importantItems.push({ title: `${l.childVerifTitle}:`, text: l.childVerifText });

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
              {l.title} · {l.copy}
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
            {folios[0]}
          </div>
          {folios.length > 1 && (
            <div style={{ color: "#6b7280", fontSize: "8px", fontFamily: "monospace" }}>
              + {folios.slice(1).join(", ")}
            </div>
          )}
        </div>
        <div>
          <div style={labelStyle}>{l.operator}</div>
          <div style={{ fontWeight: "600", fontSize: "11px", marginTop: "2px" }}>
            {operatorNames.length > 0 ? operatorNames.join(", ") : r.operator_name ?? "—"}
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
          <div style={{ marginTop: "3px", fontSize: "10px", color: DARK_GREEN }}>
            <span style={{ ...labelStyle, marginRight: "4px" }}>{l.passengers}</span>
            {paxSummary(pax, lang)}
          </div>
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
            <div style={{ fontWeight: "bold", fontSize: "14px", lineHeight: 1 }}>{pax.adults}</div>
          </div>
          {(pax.children > 0 || pax.infants === 0) && (
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
            <div style={{ fontWeight: "bold", fontSize: "14px", lineHeight: 1 }}>{pax.children}</div>
          </div>
          )}
          {pax.infants > 0 && (
            <div
              style={{
                backgroundColor: "#6b7280",
                color: "white",
                borderRadius: "6px",
                padding: "5px 10px",
                textAlign: "center",
                minWidth: "44px",
              }}
            >
              <div style={{ fontSize: "7px", letterSpacing: "1px", opacity: 0.75 }}>{l.infantWord.toUpperCase()}</div>
              <div style={{ fontWeight: "bold", fontSize: "14px", lineHeight: 1 }}>{pax.infants}</div>
            </div>
          )}
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

      {/* ── PURCHASE BREAKDOWN ── */}
      <div style={{ borderBottom: "1px solid #f3f4f6" }}>
        <div
          style={{
            ...labelStyle,
            backgroundColor: LIGHT_GREEN,
            color: DARK_GREEN,
            fontWeight: "bold",
            padding: "5px 12px",
          }}
        >
          {l.breakdown}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: BREAKDOWN_COLS,
            gap: "8px",
            padding: "4px 12px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div style={labelStyle}>{l.experience}</div>
          <div style={labelStyle}>{l.tourDate}</div>
          <div style={labelStyle}>{l.pickup}</div>
          <div style={labelStyle}>{l.pricePerson}</div>
          <div style={{ ...labelStyle, textAlign: "right" }}>{l.amount}</div>
        </div>

        {lines.map((line) => {
          const notes = ageNotes(line, lang);
          const showUnits = hasConsistentUnitPrices(line);
          return (
            <div
              key={line.id}
              style={{
                display: "grid",
                gridTemplateColumns: BREAKDOWN_COLS,
                gap: "8px",
                padding: "6px 12px",
                borderBottom: "1px solid #f3f4f6",
                alignItems: "start",
                breakInside: "avoid",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: "bold", fontSize: "11px", color: DARK_GREEN }}>{line.title}</div>
                {line.packageName && (
                  <div style={{ fontSize: "9px", color: "#6b7280" }}>{line.packageName}</div>
                )}
                {line.includes.length > 0 && (
                  <div style={{ fontSize: "8px", color: "#9ca3af", marginTop: "1px" }}>
                    {line.includes.join(" · ")}
                  </div>
                )}
                {notes.map((note) => (
                  <div key={note} style={{ fontSize: "9px", color: ORANGE, marginTop: "1px" }}>{note}</div>
                ))}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: isDatePending(line) ? "#b45309" : "inherit",
                }}
              >
                {isDatePending(line) ? l.datePending : formatDate(line.date, lang)}
              </div>
              <div style={{ fontSize: "11px", fontWeight: "600" }}>{line.time || "—"}</div>
              <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#4b5563" }}>
                {showUnits ? (
                  <>
                    {line.adults > 0 && <div>{fmtMXN(line.unitAdult)}</div>}
                    {line.children > 0 && (
                      <div>{l.priceChild} {fmtMXN(line.unitChild)}</div>
                    )}
                    {line.infants > 0 && (
                      <div>{l.infantWord} {fmtMXN(line.unitInfant)}</div>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </div>
              <div style={{ fontSize: "11px", fontWeight: "bold", fontFamily: "monospace", textAlign: "right" }}>
                {fmtMXN(line.amount)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PAYMENT SECTION ── */}
      <div style={{ borderBottom: "1px solid #f3f4f6" }}>
        {totals.discount > 0 && (
          <div style={{ padding: "4px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0", color: "#4b5563" }}>
              <span>{l.regularAmount}</span>
              <span style={{ fontFamily: "monospace" }}>{fmtMXN(totals.regular)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0", color: "#b91c1c" }}>
              <span>{l.promoDiscount}</span>
              <span style={{ fontFamily: "monospace" }}>-{fmtMXN(totals.discount)}</span>
            </div>
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
            {fmtMXN(displayTotal)}
          </span>
        </div>

        {/* ── DEPOSIT / BALANCE BREAKDOWN ── */}
        {deposit > 0 && balance > 0 && (
          <div style={{ padding: "0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px 12px",
                backgroundColor: "#ECFDF5",
                borderBottom: "1px solid #a7f3d0",
                fontSize: "11px",
              }}
            >
              <span style={{ color: "#065f46", fontWeight: "600" }}>✓ {l.deposit}</span>
              <span style={{ color: "#065f46", fontWeight: "bold", fontFamily: "monospace" }}>
                {fmtMXN(deposit)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px 12px",
                backgroundColor: LIGHT_RED,
                borderBottom: "1px solid #fecaca",
                fontSize: "11px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertTriangle size={10} color="#b91c1c" />
                <span style={{ color: "#991b1b", fontWeight: "600" }}>{l.balanceDue}</span>
              </div>
              <span style={{ color: "#991b1b", fontWeight: "bold", fontFamily: "monospace" }}>
                {r.balance_currency && r.balance_currency !== "MXN"
                  ? `$${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${r.balance_currency}`
                  : fmtMXN(balance)
                }
              </span>
            </div>
          </div>
        )}
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

      {/* ── IMPORTANT INFORMATION ── */}
      <div style={{ padding: "5px 12px", borderBottom: "1px solid #f3f4f6", breakInside: "avoid" }}>
        <div style={{ ...labelStyle, color: DARK_GREEN, fontWeight: "bold", marginBottom: "3px" }}>
          {l.importantInfo}
        </div>
        {importantItems.map((item) => (
          <p key={item.title} style={{ fontSize: "9px", color: "#4b5563", margin: "0 0 2px 0", lineHeight: 1.35 }}>
            <strong style={{ color: "#111827" }}>{item.title}</strong> {item.text}
          </p>
        ))}
      </div>

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
