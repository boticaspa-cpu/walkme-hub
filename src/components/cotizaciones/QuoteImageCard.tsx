import { forwardRef } from "react";
import walkMeLogo from "@/assets/walkme-logo.png";

interface Props {
  quote: any;
  client: any;
  items: Array<{
    tours?: { title: string } | null;
    tour_date: string;
    qty_adults: number;
    qty_children: number;
    unit_price_mxn: number;
    unit_price_child_mxn: number;
  }>;
}

const GREEN = "#2d5a27";
const GOLD = "#d4a843";

const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;

const fmtDate = (d: string) => {
  if (!d) return "";
  const date = new Date(d + "T12:00:00");
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

const QuoteImageCard = forwardRef<HTMLDivElement, Props>(({ quote, client, items }, ref) => {
  const total = quote?.total_mxn ?? 0;
  const discount = quote?.discount_mxn ?? 0;

  return (
    <div
      ref={ref}
      style={{
        width: 600,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: GREEN,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src={walkMeLogo}
            alt="WalkMe Tours"
            style={{ height: 48, width: "auto", objectFit: "contain" }}
          />
          <div>
            <div style={{ color: "#ffffff", fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
              WALKME TOURS
            </div>
            <div style={{ color: GOLD, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
              COTIZACIÓN
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {quote?.folio && (
            <div style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>
              #{quote.folio}
            </div>
          )}
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 }}>
            {new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Client section */}
      {(client?.name || quote?.client_name) && (
        <div style={{ backgroundColor: "#f8faf7", padding: "14px 24px", borderBottom: "1px solid #e8f0e6" }}>
          <div style={{ color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Para
          </div>
          <div style={{ color: "#1a1a1a", fontSize: 15, fontWeight: 600 }}>
            {client?.name || quote?.client_name}
          </div>
          {client?.phone && (
            <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>📲 {client.phone}</div>
          )}
        </div>
      )}

      {/* Tours list */}
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, idx) => {
          const sub = it.qty_adults * it.unit_price_mxn + it.qty_children * it.unit_price_child_mxn;
          const paxParts = [
            `${it.qty_adults} adulto${it.qty_adults !== 1 ? "s" : ""}`,
            it.qty_children ? `${it.qty_children} menor${it.qty_children !== 1 ? "es" : ""}` : null,
          ].filter(Boolean);

          return (
            <div
              key={idx}
              style={{
                border: `1px solid #e0ead9`,
                borderRadius: 8,
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                backgroundColor: "#fafcf9",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ color: GREEN, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                  {it.tours?.title ?? "Tour"}
                </div>
                {it.tour_date && (
                  <div style={{ color: "#555", fontSize: 12, marginBottom: 2 }}>
                    📅 {fmtDate(it.tour_date)}
                  </div>
                )}
                <div style={{ color: "#555", fontSize: 12 }}>
                  👥 {paxParts.join(", ")}
                </div>
              </div>
              <div style={{ color: GREEN, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 16 }}>
                {fmt(sub)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Discount */}
      {discount > 0 && (
        <div style={{ padding: "0 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#888", fontSize: 13 }}>Descuento</span>
          <span style={{ color: "#c0392b", fontSize: 13, fontWeight: 600 }}>-{fmt(discount)}</span>
        </div>
      )}

      {/* Total bar */}
      <div
        style={{
          backgroundColor: GREEN,
          margin: "0 24px 20px",
          borderRadius: 8,
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#ffffff", fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}>
          TOTAL
        </span>
        <span style={{ color: GOLD, fontSize: 22, fontWeight: 800 }}>
          {fmt(total)}
        </span>
      </div>

      {/* Notes */}
      {quote?.notes && (
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{ color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Notas
          </div>
          <div style={{ color: "#444", fontSize: 12, lineHeight: 1.5 }}>{quote.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          backgroundColor: "#f0f4ee",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "center",
          gap: 24,
          borderTop: `3px solid ${GOLD}`,
        }}
      >
        <span style={{ color: GREEN, fontSize: 12, fontWeight: 600 }}>📲 +52 56 3974 8122</span>
        <span style={{ color: GREEN, fontSize: 12, fontWeight: 600 }}>📷 @walkme_travel</span>
      </div>
    </div>
  );
});

QuoteImageCard.displayName = "QuoteImageCard";

export default QuoteImageCard;
