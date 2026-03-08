import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import walkMeLogo from "@/assets/walkme-logo.png";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function CotizacionPDF() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quote-pdf", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(name, phone, email)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["quote-items-pdf", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_items")
        .select("*, tours(title)")
        .eq("quote_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  if (isLoading) return <div className="flex items-center justify-center h-screen text-sm">Cargando…</div>;
  if (!quote) return <div className="flex items-center justify-center h-screen text-sm">Cotización no encontrada</div>;

  const client = quote.clients as any;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Action bar — hidden on print */}
      <div className="print:hidden flex items-center justify-end gap-2 p-4 bg-white border-b shadow-sm">
        <Button variant="outline" size="sm" onClick={() => window.close()}>
          <X className="mr-1 h-4 w-4" /> Cerrar
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> Imprimir / PDF
        </Button>
      </div>

      {/* Printable content */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 print:p-6 print:shadow-none shadow-lg my-6 print:my-0 text-black">
        {/* Header */}
        <div className="flex items-center gap-3 border-b-2 pb-3 mb-6" style={{ borderColor: "#2d5a27" }}>
          <img src={walkMeLogo} alt="WalkMe Tours" className="h-14 w-auto" />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-wide" style={{ color: "#2d5a27" }}>WALKME TOURS</h1>
            <p className="text-xs text-gray-500">COTIZACIÓN</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-bold text-base">{quote.folio ?? "—"}</p>
            <p className="text-xs text-gray-500">
              {new Date(quote.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Client info */}
        <div className="grid grid-cols-3 gap-4 text-sm mb-6">
          <div>
            <span className="font-semibold text-gray-600">Cliente:</span>{" "}
            <span className="font-medium">{client?.name ?? quote.client_name ?? "—"}</span>
          </div>
          {client?.phone && (
            <div>
              <span className="font-semibold text-gray-600">Tel:</span> {client.phone}
            </div>
          )}
          {client?.email && (
            <div>
              <span className="font-semibold text-gray-600">Email:</span> {client.email}
            </div>
          )}
        </div>

        {/* Items table */}
        <table className="w-full text-sm border border-gray-300 mb-6">
          <thead>
            <tr className="text-white text-xs" style={{ backgroundColor: "#2d5a27" }}>
              <th className="py-2 px-3 text-left">Tour</th>
              <th className="py-2 px-3 text-center">Fecha</th>
              <th className="py-2 px-3 text-center">Zona</th>
              <th className="py-2 px-3 text-center">Nac.</th>
              <th className="py-2 px-3 text-center">Adultos</th>
              <th className="py-2 px-3 text-right">P/U Adulto</th>
              <th className="py-2 px-3 text-center">Niños</th>
              <th className="py-2 px-3 text-right">P/U Niño</th>
              <th className="py-2 px-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => {
              const sub = item.qty_adults * item.unit_price_mxn + item.qty_children * item.unit_price_child_mxn;
              return (
                <tr key={idx} className="border-t border-gray-200">
                  <td className="py-2 px-3 font-medium">{item.tours?.title ?? "—"}</td>
                  <td className="py-2 px-3 text-center text-xs">{item.tour_date ? new Date(item.tour_date + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                  <td className="py-2 px-3 text-center text-xs">{item.zone || "—"}</td>
                  <td className="py-2 px-3 text-center text-xs">{item.nationality || "—"}</td>
                  <td className="py-2 px-3 text-center">{item.qty_adults}</td>
                  <td className="py-2 px-3 text-right">{fmt(item.unit_price_mxn)}</td>
                  <td className="py-2 px-3 text-center">{item.qty_children}</td>
                  <td className="py-2 px-3 text-right">{fmt(item.unit_price_child_mxn)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{fmt(sub)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex flex-col items-end mb-6 space-y-1">
          {(quote as any).discount_mxn > 0 && (
            <>
              <div className="text-sm text-gray-500">
                Subtotal: {fmt(items.reduce((s: number, i: any) => s + i.qty_adults * i.unit_price_mxn + i.qty_children * i.unit_price_child_mxn, 0))}
              </div>
              <div className="text-sm text-green-700">
                Descuento: -{fmt((quote as any).discount_mxn)}
              </div>
            </>
          )}
          <div className="border-t-2 border-b-2 py-2 px-6 inline-flex items-center gap-4" style={{ borderColor: "#2d5a27" }}>
            <span className="text-sm font-bold">TOTAL</span>
            <span className="text-xl font-bold" style={{ color: "#2d5a27" }}>
              {fmt(quote.total_mxn)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-1">Notas</h3>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Terms */}
        <div className="mb-4">
          <h3 className="text-xs font-bold mb-1 uppercase" style={{ color: "#2d5a27" }}>Términos y condiciones</h3>
          <p className="text-[10px] text-gray-600 leading-tight">
            Esta cotización tiene una vigencia de 7 días naturales a partir de la fecha de emisión. Los precios están sujetos a disponibilidad y pueden variar sin previo aviso. Para confirmar su reserva, es necesario realizar el pago correspondiente.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-200">
          ¡Gracias por elegir WalkMe Tours! 🌴
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
