import { forwardRef } from "react";
import walkMeLogo from "@/assets/walkme-logo.png";

interface Props {
  quote: any;
  client: any;
  lang?: "es" | "en";
  items: Array<{
    tours?: { title: string; service_type?: string | null; tax_adult_usd?: number; tax_child_usd?: number } | null;
    tour_date: string;
    package_name?: string | null;
    qty_adults: number;
    qty_children: number;
    unit_price_mxn: number;
    unit_price_child_mxn: number;
  }>;
}

const QuoteImageCard = forwardRef<HTMLDivElement, Props>(({ quote, client, items, lang = "es" }, ref) => {
  const en = lang === "en";
  const fmt = (n: number, currency = "MXN") => `${n.toLocaleString(en ? "en-US" : "es-MX", { style: "currency", currency, minimumFractionDigits: 2 })} ${currency}`;
  const date = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString(en ? "en-US" : "es-MX", { day: "numeric", month: "short", year: "numeric" });
  const subtotal = items.reduce((sum, it) => sum + it.qty_adults * it.unit_price_mxn + it.qty_children * it.unit_price_child_mxn, 0);
  const discount = Number(quote?.discount_mxn ?? 0);
  const tax = items.reduce((sum, it) => sum + it.qty_adults * (it.tours?.tax_adult_usd ?? 0) + it.qty_children * (it.tours?.tax_child_usd ?? 0), 0);

  return (
    <div ref={ref} className="quote-mobile-coupon rounded-lg overflow-hidden border border-border text-sm leading-relaxed">
      <header className="bg-primary text-primary-foreground p-5">
        <div className="flex items-center gap-3">
          <img src={walkMeLogo} alt="WalkMe Tours" className="h-12 w-12 object-contain shrink-0" />
          <div className="min-w-0"><div className="text-xl font-bold">WALKME TOURS</div><div className="text-accent font-semibold">{en ? "QUOTE" : "COTIZACIÓN"}</div></div>
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
          <strong>{quote?.folio ?? "—"}</strong>
          {quote?.created_at && <span>{date(quote.created_at)}</span>}
        </div>
      </header>
      {(client?.name || quote?.client_name) && <section className="px-5 py-4 bg-muted border-b border-border"><div className="text-xs text-muted-foreground">{en ? "Prepared for" : "Para"}</div><div className="text-base font-semibold">{client?.name || quote?.client_name}</div></section>}
      <div className="px-5 divide-y divide-border">
        {items.map((it, idx) => {
          const sub = it.qty_adults * it.unit_price_mxn + it.qty_children * it.unit_price_child_mxn;
          return <section key={idx} className="py-5 space-y-3">
            <div><div className="text-xs text-muted-foreground mb-1">{en ? "TOUR" : "TOUR"} {idx + 1}</div><h3 className="text-lg leading-snug text-primary">{it.tours?.title ?? "Tour"}</h3>{it.package_name && <p className="font-medium">{it.package_name}</p>}</div>
            <div className="text-muted-foreground space-y-1">
              {it.tour_date && <p>{date(it.tour_date)}</p>}
              {it.tours?.service_type === "with_transport" && <p>{en ? "With transportation" : "Con transporte"}</p>}
              {it.tours?.service_type === "entry_only" && <p>{en ? "Without transportation" : "Sin transporte"}</p>}
            </div>
            <div className="space-y-2">
              {it.qty_adults > 0 && <div><p>{it.qty_adults} {en ? (it.qty_adults === 1 ? "adult" : "adults") : (it.qty_adults === 1 ? "adulto" : "adultos")}</p><div className="flex flex-wrap justify-between gap-x-2"><span className="text-xs text-muted-foreground">{fmt(it.unit_price_mxn)} {en ? "per person" : "por persona"}</span><span className="font-semibold">{fmt(it.qty_adults * it.unit_price_mxn)}</span></div></div>}
              {it.qty_children > 0 && <div><p>{it.qty_children} {en ? (it.qty_children === 1 ? "child" : "children") : (it.qty_children === 1 ? "menor" : "menores")}</p><div className="flex flex-wrap justify-between gap-x-2"><span className="text-xs text-muted-foreground">{fmt(it.unit_price_child_mxn)} {en ? "per person" : "por persona"}</span><span className="font-semibold">{fmt(it.qty_children * it.unit_price_child_mxn)}</span></div></div>}
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2 font-semibold"><span>Subtotal</span><span>{fmt(sub)}</span></div>
          </section>;
        })}
      </div>
      {discount > 0 && <div className="px-5 pb-4 space-y-1"><div className="flex flex-wrap justify-between gap-2"><span>Subtotal</span><span>{fmt(subtotal)}</span></div><div className="flex flex-wrap justify-between gap-2 text-destructive"><span>{en ? "Discount" : "Descuento"}{subtotal > 0 ? ` (${(discount / subtotal * 100).toLocaleString(en ? "en-US" : "es-MX", { maximumFractionDigits: 2 })}%)` : ""}</span><strong>−{fmt(discount)}</strong></div></div>}
      <div className="bg-primary text-primary-foreground px-5 py-4"><div className="text-xs font-semibold">TOTAL</div><div className="text-2xl font-bold text-accent">{fmt(Number(quote?.total_mxn ?? 0))}</div></div>
      {tax > 0 && <div className="px-5 py-4 border-b border-border text-warning"><strong>{en ? "Park taxes" : "Impuestos de parque"}: {fmt(tax, "USD")}</strong><p className="text-xs">{en ? "Paid separately on the tour. Not included in the MXN total." : "Se pagan por separado en el tour. No incluidos en el total MXN."}</p></div>}
      {quote?.notes && <section className="px-5 py-4"><div className="text-xs font-semibold text-muted-foreground mb-1">{en ? "Notes" : "Notas"}</div><p className="whitespace-pre-wrap">{quote.notes}</p></section>}
      <footer className="px-5 py-4 bg-muted border-t border-border space-y-2"><p className="text-xs text-muted-foreground">{en ? "Quote only · Not a reservation confirmation." : "Cotización · No es una confirmación de reserva."}</p><p className="text-xs text-muted-foreground">{en ? "Cancellations require 72 hours’ notice." : "Cancelaciones con al menos 72 horas de anticipación."}</p><div className="text-primary font-semibold">+52 56 3974 8122</div><div className="text-primary text-xs">@walkme_travel</div></footer>
    </div>
  );
});
QuoteImageCard.displayName = "QuoteImageCard";
export default QuoteImageCard;
