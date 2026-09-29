import walkMeLogo from "@/assets/walkme-logo.png";
import { Phone, Mail, Building2, MapPin, Calendar, Clock, Globe, Send } from "lucide-react";
import { ageNotes, groupPax, infantsAreFree, isDatePending, paxSummary, type VoucherLine } from "@/lib/voucher-lines";

export interface OperatorVoucherData {
  clientName: string;
  phone: string;
  email: string;
  hotel: string;
  room: string;
  pickupPoint: string;
  notes: string;
  language: string;
  sendTo: string;
  showPhone: boolean;
  showEmail: boolean;
  showHotel: boolean;
  showPickup: boolean;
  showNotes: boolean;
  showLanguage: boolean;
  payAmount: string;
  payCurrency: string;
  payMethod: string;
  payReference: string;
}

interface Props {
  reservation: any;
  data: OperatorVoucherData;
  /** Tours of this booking that belong to the operator receiving the request. */
  lines: VoucherLine[];
}

const DARK_GREEN = "#1B3D2F";
const LIGHT_GRAY = "#f7f6f3";
const LIGHT_GREEN = "#E1F5EE";
const ORANGE = "#E8943A";

const labelStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "8px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const valueStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "11px",
  marginTop: "2px",
  color: "#111827",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  credit: "Crédito (pago posterior)",
  prepaid: "Prepagado",
};

const LINE_COLS = "2fr 1fr 0.8fr 2fr";

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value || "—"}</div>
    </div>
  );
}

export default function OperatorVoucherPrintView({ reservation: r, data, lines }: Props) {
  const operatorName = lines[0]?.operatorName ?? r?.tours?.operators?.name ?? r?.operator_name ?? "—";
  const amount = Number(data.payAmount || 0);
  const folios = lines.map((l) => l.folio).filter((f): f is string => !!f);
  const uniqueFolios = [...new Set(folios.length > 0 ? folios : [r?.folio ?? "—"])];

  return (
    <div
      className="bg-white text-black"
      id="operator-voucher-content"
      style={{ fontFamily: "Arial, sans-serif", maxWidth: "680px", margin: "0 auto" }}
    >
      {/* HEADER */}
      <div style={{ backgroundColor: DARK_GREEN, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={walkMeLogo} alt="WalkMe Tours" style={{ height: "36px", width: "auto", background: "white", borderRadius: "6px", padding: "3px" }} />
          <div>
            <div style={{ color: "white", fontWeight: "bold", fontSize: "15px", letterSpacing: "1px" }}>WALKME TOURS</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "8px", letterSpacing: "2px" }}>SOLICITUD DE RESERVA · PROVEEDOR</div>
          </div>
        </div>
        <span style={{ backgroundColor: "#0f766e", color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "9px", fontWeight: "bold", letterSpacing: "1px" }}>
          USO INTERNO / OPERADOR
        </span>
      </div>

      {/* FOLIOS */}
      <div style={{ backgroundColor: LIGHT_GRAY, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "6px 12px", gap: "6px", borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <div style={labelStyle}>FOLIO WALKME</div>
          <div style={{ color: DARK_GREEN, fontWeight: "bold", fontSize: "13px", fontFamily: "monospace", marginTop: "2px" }}>
            {uniqueFolios.join(" · ")}
          </div>
        </div>
        <Field label="Folio operador" value={r?.operator_folio ?? ""} />
        <Field label="Confirmación" value={r?.operator_confirmation_code ?? ""} />
      </div>

      {/* OPERADOR + PEDIDO */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Building2 size={12} color="#6b7280" />
          <span style={{ fontSize: "11px", color: "#6b7280" }}>{operatorName}</span>
        </div>
        <div style={{ fontWeight: "bold", fontSize: "13px", color: DARK_GREEN, marginTop: "3px" }}>
          Favor de confirmar esta reserva y enviarnos nuestro cupón.
        </div>
        {data.sendTo && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px", fontSize: "11px", color: "#374151" }}>
            <Send size={11} color="#6b7280" />
            Enviar cupón a: <strong>{data.sendTo}</strong>
          </div>
        )}
      </div>

      {/* PASAJERO + LOGISTICA */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
        <Field label="Pasajero titular" value={data.clientName} />
        <Field label="Pasajeros" value={paxSummary(groupPax(lines), "es")} />
        <Field label="Zona / Nacionalidad" value={`${r?.zone ?? "—"} · ${r?.nationality ?? "—"}`} />
        {data.showHotel && <Field label="Hotel" value={[data.hotel, data.room ? `Hab. ${data.room}` : ""].filter(Boolean).join(" · ")} />}
        {data.showPickup && (
          <div>
            <div style={labelStyle}><MapPin size={9} style={{ display: "inline", marginRight: 3 }} />Punto de pickup</div>
            <div style={valueStyle}>{data.pickupPoint || "—"}</div>
          </div>
        )}
        {data.showLanguage && (
          <div>
            <div style={labelStyle}><Globe size={9} style={{ display: "inline", marginRight: 3 }} />Idioma</div>
            <div style={valueStyle}>{data.language || "—"}</div>
          </div>
        )}
        {data.showPhone && (
          <div>
            <div style={labelStyle}><Phone size={9} style={{ display: "inline", marginRight: 3 }} />Teléfono pax</div>
            <div style={valueStyle}>{data.phone || "—"}</div>
          </div>
        )}
        {data.showEmail && (
          <div>
            <div style={labelStyle}><Mail size={9} style={{ display: "inline", marginRight: 3 }} />Email pax</div>
            <div style={valueStyle}>{data.email || "—"}</div>
          </div>
        )}
      </div>

      {/* SERVICIOS A RESERVAR */}
      <div style={{ borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ ...labelStyle, backgroundColor: LIGHT_GREEN, color: DARK_GREEN, fontWeight: "bold", padding: "5px 12px" }}>
          Servicios a reservar
        </div>
        <div style={{ display: "grid", gridTemplateColumns: LINE_COLS, gap: "8px", padding: "4px 12px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={labelStyle}>Servicio</div>
          <div style={labelStyle}><Calendar size={9} style={{ display: "inline", marginRight: 3 }} />Fecha</div>
          <div style={labelStyle}><Clock size={9} style={{ display: "inline", marginRight: 3 }} />Hora</div>
          <div style={labelStyle}>Pasajeros</div>
        </div>
        {lines.map((line) => {
          const notes = ageNotes(line, "es");
          return (
            <div
              key={line.id}
              style={{ display: "grid", gridTemplateColumns: LINE_COLS, gap: "8px", padding: "6px 12px", borderBottom: "1px solid #f3f4f6", alignItems: "start", breakInside: "avoid" }}
            >
              <div>
                <div style={{ fontWeight: "bold", fontSize: "11px", color: DARK_GREEN }}>{line.title}</div>
                {line.packageName && <div style={{ fontSize: "9px", color: "#6b7280" }}>Paquete: {line.packageName}</div>}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: isDatePending(line) ? "#b45309" : "inherit" }}>
                {isDatePending(line) ? "POR CONFIRMAR" : formatDate(line.date)}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 600 }}>{line.time || "—"}</div>
              <div style={{ fontSize: "11px" }}>
                <div style={{ fontWeight: 600 }}>{paxSummary({ adults: line.adults, children: line.children, infants: line.infants }, "es")}</div>
                {notes.map((note) => (
                  <div key={note} style={{ fontSize: "9px", color: ORANGE }}>{note}</div>
                ))}
                {line.infants > 0 && infantsAreFree(line) && (
                  <div style={{ fontSize: "8px", color: "#6b7280" }}>Infante sin costo; debe ir en el manifiesto.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGO AL OPERADOR */}
      <div style={{ backgroundColor: LIGHT_GREEN, padding: "8px 12px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ ...labelStyle, color: DARK_GREEN }}>Pago al operador</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "4px", alignItems: "flex-end" }}>
          <div>
            <div style={labelStyle}>Monto</div>
            <div style={{ color: DARK_GREEN, fontWeight: "bold", fontSize: "18px" }}>
              ${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {data.payCurrency}
            </div>
          </div>
          <Field label="Forma de pago" value={METHOD_LABELS[data.payMethod] ?? data.payMethod} />
          <Field label="Referencia" value={data.payReference} />
        </div>
      </div>

      {/* NOTAS */}
      {data.showNotes && data.notes ? (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={labelStyle}>Notas operativas</div>
          <div style={{ fontSize: "10px", color: "#374151", marginTop: "3px", whiteSpace: "pre-wrap" }}>{data.notes}</div>
        </div>
      ) : null}

      <div style={{ padding: "6px 12px", textAlign: "center", fontSize: "8px", color: "#9ca3af" }}>
        Documento operativo — no válido como comprobante de venta al pasajero.
      </div>
    </div>
  );
}
