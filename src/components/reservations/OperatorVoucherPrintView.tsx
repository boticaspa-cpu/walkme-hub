import walkMeLogo from "@/assets/walkme-logo.png";
import { Phone, Mail, Building2, MapPin, Users, Calendar, Clock, Globe } from "lucide-react";

export interface OperatorVoucherData {
  clientName: string;
  phone: string;
  email: string;
  hotel: string;
  room: string;
  pickupPoint: string;
  notes: string;
  language: string;
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
}

const DARK_GREEN = "#1B3D2F";
const LIGHT_GRAY = "#f7f6f3";
const LIGHT_GREEN = "#E1F5EE";

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

export default function OperatorVoucherPrintView({ reservation: r, data }: Props) {
  const tourTitle = r?.tours?.title ?? "—";
  const operatorName = r?.tours?.operators?.name ?? r?.operator_name ?? "—";
  const amount = Number(data.payAmount || 0);

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value || "—"}</div>
    </div>
  );

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
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "8px", letterSpacing: "2px" }}>CUPÓN PARA EL OPERADOR</div>
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
          <div style={{ color: DARK_GREEN, fontWeight: "bold", fontSize: "13px", fontFamily: "monospace", marginTop: "2px" }}>{r?.folio ?? "—"}</div>
        </div>
        <Field label="Folio operador" value={r?.operator_folio ?? ""} />
        <Field label="Confirmación" value={r?.operator_confirmation_code ?? ""} />
      </div>

      {/* OPERADOR + TOUR */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Building2 size={12} color="#6b7280" />
          <span style={{ fontSize: "11px", color: "#6b7280" }}>{operatorName}</span>
        </div>
        <div style={{ fontWeight: "bold", fontSize: "15px", color: DARK_GREEN, marginTop: "3px" }}>{tourTitle}</div>
        {r?.package_name ? (
          <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "1px" }}>Paquete: {r.package_name}</div>
        ) : null}
      </div>

      {/* SERVICIO */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
        <div>
          <div style={labelStyle}><Calendar size={9} style={{ display: "inline", marginRight: 3 }} />Fecha</div>
          <div style={valueStyle}>{r?.reservation_date ? new Date(`${r.reservation_date}T12:00:00`).toLocaleDateString("es-MX") : "—"}</div>
        </div>
        <div>
          <div style={labelStyle}><Clock size={9} style={{ display: "inline", marginRight: 3 }} />Hora</div>
          <div style={valueStyle}>{r?.reservation_time || "—"}</div>
        </div>
        <div>
          <div style={labelStyle}><Users size={9} style={{ display: "inline", marginRight: 3 }} />Pax</div>
          <div style={valueStyle}>{r?.pax_adults ?? 0} adultos · {r?.pax_children ?? 0} menores</div>
        </div>
        <div>
          <div style={labelStyle}>Modalidad</div>
          <div style={valueStyle}>{r?.modality === "private" ? "Privado" : "Compartido"}</div>
        </div>
      </div>

      {/* PAX + LOGISTICA */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
        <Field label="Pasajero" value={data.clientName} />
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
