import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import walkMeLogo from "@/assets/walkme-logo.png";

interface OnSiteFees {
  amountPerAdult: number;
  amountPerChild: number;
  currency: string;
}

interface VoucherProps {
  reservation: {
    id: string;
    folio: string | null;
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
    purchaseDate: "Fecha de compra",
    client: "Cliente",
    name: "Nombre",
    adults: "Adultos",
    children: "Menores",
    tour: "Tour",
    departure: "Lugar y hora de salida",
    tourDate: "Fecha del tour",
    includes: "Incluye",
    priceAdult: "Precio adulto",
    priceChild: "Precio menor",
    subtotal: "Subtotal",
    total: "Total a pagar",
    notes: "Notas",
    cancellation: "Políticas de cancelación",
    modality: "Modalidad",
    shared: "Compartido",
    private: "Privado",
    zone: "Zona",
    thanks: "¡Gracias por elegir WalkMe Tours!",
  },
  en: {
    title: "RESERVATION VOUCHER",
    folio: "Folio",
    purchaseDate: "Purchase date",
    client: "Client",
    name: "Name",
    adults: "Adults",
    children: "Minors",
    tour: "Tour",
    departure: "Departure place & time",
    tourDate: "Tour date",
    includes: "Includes",
    priceAdult: "Adult price",
    priceChild: "Minor price",
    subtotal: "Subtotal",
    total: "Amount to pay",
    notes: "Notes",
    cancellation: "Cancellation policies",
    modality: "Modality",
    shared: "Shared",
    private: "Private",
    zone: "Zone",
    thanks: "Thank you for choosing WalkMe Tours!",
  },
};

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

  return (
    <div className="voucher-print-root bg-white text-black" id="voucher-content">
      {/* Language toggle — hidden on print */}
      <div className="flex justify-end gap-1 mb-3 print:hidden">
        <button
          onClick={() => setLang("es")}
          className={`px-3 py-1 text-xs rounded border ${lang === "es" ? "bg-primary text-white border-primary" : "border-gray-300"}`}
        >
          ES
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-3 py-1 text-xs rounded border ${lang === "en" ? "bg-primary text-white border-primary" : "border-gray-300"}`}
        >
          EN
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-green-800 pb-3 mb-4">
        <img src={walkMeLogo} alt="WalkMe Tours" className="h-14 w-auto" />
        <div>
          <h1 className="text-xl font-bold tracking-wide" style={{ color: "#2d5a27" }}>WALKME TOURS</h1>
          <p className="text-xs text-gray-500">{l.title}</p>
        </div>
      </div>

      {/* Ticket data */}
      <div className="grid grid-cols-3 gap-2 text-sm mb-4">
        <div>
          <span className="font-semibold">{l.folio}:</span>{" "}
          <span className="font-mono">{r.folio ?? "—"}</span>
        </div>
        <div>
          <span className="font-semibold">{l.purchaseDate}:</span>{" "}
          {new Date(r.created_at).toLocaleDateString(lang === "es" ? "es-MX" : "en-US")}
        </div>
        <div>
          <span className="font-semibold">{l.client}:</span> {client?.name ?? "—"}
        </div>
      </div>

      {/* Pax summary table */}
      <table className="w-full text-sm border border-gray-300 mb-4">
        <thead>
          <tr className="text-white text-xs" style={{ backgroundColor: "#2d5a27" }}>
            <th className="py-1.5 px-3 text-left">{l.name}</th>
            <th className="py-1.5 px-3 text-center">{l.adults}</th>
            <th className="py-1.5 px-3 text-center">{l.children}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-200">
            <td className="py-1.5 px-3">{client?.name ?? "—"}</td>
            <td className="py-1.5 px-3 text-center">{r.pax_adults}</td>
            <td className="py-1.5 px-3 text-center">{r.pax_children}</td>
          </tr>
        </tbody>
      </table>

      {/* Tour info table */}
      <table className="w-full text-sm border border-gray-300 mb-4">
        <thead>
          <tr className="text-white text-xs" style={{ backgroundColor: "#2d5a27" }}>
            <th className="py-1.5 px-3 text-left">{l.tour}</th>
            <th className="py-1.5 px-3 text-left">{l.departure}</th>
            <th className="py-1.5 px-3 text-left">{l.tourDate}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-200">
            <td className="py-1.5 px-3 font-medium">{tour?.title ?? "—"}</td>
            <td className="py-1.5 px-3">
              {tour?.meeting_point ? `${tour.meeting_point} — ` : ""}{r.reservation_time || "—"}
            </td>
            <td className="py-1.5 px-3">{r.reservation_date}</td>
          </tr>
        </tbody>
      </table>

      {/* Zone & Modality */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div><span className="font-semibold">{l.zone}:</span> {r.zone || "—"}</div>
        <div><span className="font-semibold">{l.modality}:</span> {r.modality === "shared" ? l.shared : l.private}</div>
      </div>

      {/* Includes */}
      {tour?.includes && tour.includes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-1" style={{ color: "#2d5a27" }}>{l.includes}</h3>
          <ul className="text-xs list-disc list-inside space-y-0.5">
            {tour.includes.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Price breakdown + Total */}
      <div className="mb-4 border border-gray-300">
        {r.unit_price_mxn !== undefined && r.unit_price_mxn > 0 && (
          <table className="w-full text-sm">
            <tbody>
              {r.pax_adults > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 px-3">{r.pax_adults} × {l.priceAdult}</td>
                  <td className="py-1.5 px-3 text-right">
                    ${r.unit_price_mxn!.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </td>
                  <td className="py-1.5 px-3 text-right font-medium">
                    ${(r.pax_adults * r.unit_price_mxn!).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </td>
                </tr>
              )}
              {r.pax_children > 0 && r.unit_price_child_mxn !== undefined && (
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 px-3">{r.pax_children} × {l.priceChild}</td>
                  <td className="py-1.5 px-3 text-right">
                    ${r.unit_price_child_mxn!.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </td>
                  <td className="py-1.5 px-3 text-right font-medium">
                    ${(r.pax_children * r.unit_price_child_mxn!).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <div className="flex justify-between items-center border-t-2 py-2 px-3" style={{ borderColor: "#2d5a27" }}>
          <span className="text-sm font-bold">{l.total}</span>
          <span className="text-lg font-bold" style={{ color: "#2d5a27" }}>
            ${r.total_mxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
          </span>
        </div>
      </div>

      {/* Notes */}
      {r.notes && (
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-1">{l.notes}</h3>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{r.notes}</p>
        </div>
      )}

      {/* Cancellation policy */}
      <div className="mb-4">
        <h3 className="text-xs font-bold mb-1 uppercase" style={{ color: "#2d5a27" }}>{l.cancellation}</h3>
        <p className="text-[10px] text-gray-600 leading-tight whitespace-pre-wrap">{policy}</p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-200">
        {l.thanks}
      </div>
    </div>
  );
}
