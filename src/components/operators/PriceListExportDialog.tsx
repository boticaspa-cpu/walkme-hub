import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  operator: { id: string; name: string; exchange_rate?: number; base_currency?: string };
}

interface VariantRow {
  tour_title: string;
  zone: string;
  nationality: string;
  package_name: string | null;
  sale_price_adult: number;
  sale_price_child: number;
  net_cost_adult: number;
  net_cost_child: number;
  tax_adult: number;
  tax_child: number;
}

async function fetchData(operatorId: string): Promise<VariantRow[]> {
  // Get tours for this operator
  const { data: tours, error: tErr } = await supabase
    .from("tours")
    .select("id, title, price_mxn, suggested_price_mxn, public_price_adult_usd, public_price_child_usd, tax_adult_usd, tax_child_usd, exchange_rate_tour, price_adult_usd, price_child_usd")
    .eq("operator_id", operatorId)
    .eq("active", true)
    .order("title");
  if (tErr) throw tErr;
  if (!tours?.length) return [];

  const tourIds = tours.map((t) => t.id);
  const tourMap = Object.fromEntries(tours.map((t) => [t.id, t]));

  // Get price variants (matrix) and tour_packages in parallel
  const [variantsRes, packagesRes] = await Promise.all([
    supabase.from("tour_price_variants").select("*").in("tour_id", tourIds).eq("active", true),
    supabase.from("tour_packages").select("*").in("tour_id", tourIds).eq("active", true),
  ]);
  if (variantsRes.error) throw variantsRes.error;
  if (packagesRes.error) throw packagesRes.error;

  const variants = variantsRes.data ?? [];
  const packages = packagesRes.data ?? [];

  const rows: VariantRow[] = [];
  const toursWithVariants = new Set<string>();
  const toursWithPackages = new Set<string>();

  // --- 1) Matrix variants ---
  const grouped = new Map<string, { adult?: typeof variants[0]; child?: typeof variants[0] }>();
  for (const v of variants) {
    toursWithVariants.add(v.tour_id);
    const key = `${v.tour_id}|${v.zone}|${v.nationality}|${v.package_name ?? ""}`;
    if (!grouped.has(key)) grouped.set(key, {});
    const g = grouped.get(key)!;
    if (v.pax_type === "Adulto") g.adult = v;
    else g.child = v;
  }

  for (const [key, g] of grouped) {
    const [tourId, zone, nationality, pkg] = key.split("|");
    rows.push({
      tour_title: tourMap[tourId]?.title ?? "—",
      zone,
      nationality,
      package_name: pkg || null,
      sale_price_adult: g.adult?.sale_price ?? 0,
      sale_price_child: g.child?.sale_price ?? 0,
      net_cost_adult: g.adult?.net_cost ?? 0,
      net_cost_child: g.child?.net_cost ?? 0,
      tax_adult: g.adult?.tax_fee ?? 0,
      tax_child: g.child?.tax_fee ?? 0,
    });
  }

  // --- 2) Tour packages (for tours WITHOUT matrix variants) ---
  for (const pkg of packages) {
    toursWithPackages.add(pkg.tour_id);
    if (toursWithVariants.has(pkg.tour_id)) continue; // already covered by matrix
    rows.push({
      tour_title: tourMap[pkg.tour_id]?.title ?? "—",
      zone: "General",
      nationality: "General",
      package_name: pkg.name,
      sale_price_adult: pkg.price_adult_mxn ?? 0,
      sale_price_child: pkg.price_child_mxn ?? 0,
      net_cost_adult: pkg.cost_adult_usd ?? 0,
      net_cost_child: pkg.cost_child_usd ?? 0,
      tax_adult: pkg.tax_adult_usd ?? 0,
      tax_child: pkg.tax_child_usd ?? 0,
    });
  }

  // --- 3) Fallback: tours without variants AND without packages ---
  for (const tour of tours) {
    if (toursWithVariants.has(tour.id) || toursWithPackages.has(tour.id)) continue;
    const priceMxn = tour.price_mxn ?? 0;
    const childMxn = tour.suggested_price_mxn ?? 0;
    const adultUsd = tour.public_price_adult_usd ?? 0;
    const tc = tour.exchange_rate_tour && tour.exchange_rate_tour > 0 ? tour.exchange_rate_tour : 1;

    rows.push({
      tour_title: tour.title,
      zone: "General",
      nationality: "General",
      package_name: null,
      sale_price_adult: priceMxn > 0 ? priceMxn : Math.round(adultUsd * tc * 100) / 100,
      sale_price_child: childMxn > 0 ? childMxn : Math.round((tour.public_price_child_usd ?? 0) * tc * 100) / 100,
      net_cost_adult: tour.price_adult_usd ?? 0,
      net_cost_child: tour.price_child_usd ?? 0,
      tax_adult: tour.tax_adult_usd ?? 0,
      tax_child: tour.tax_child_usd ?? 0,
    });
  }

  rows.sort((a, b) => a.tour_title.localeCompare(b.tour_title));
  return rows;
}

function fmtNum(n: number) {
  return n ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}

function generateExcel(rows: VariantRow[], opName: string, currency: string, tc: number) {
  const now = new Date().toLocaleDateString("es-MX");
  const header = [
    ["Lista de Precios —", opName],
    ["Moneda base:", currency, "T.C.:", tc, "Fecha:", now],
    [],
    [
      "Tour", "Zona", "Nacionalidad", "Paquete",
      "Precio Venta Adulto (MXN)", "Precio Venta Menor (MXN)",
      "Costo Neto Adulto", "Costo Neto Menor",
      "Tax Adulto (USD)", "Tax Menor (USD)",
    ],
  ];
  const data = rows.map((r) => [
    r.tour_title, r.zone, r.nationality, r.package_name ?? "—",
    r.sale_price_adult, r.sale_price_child,
    r.net_cost_adult, r.net_cost_child,
    r.tax_adult, r.tax_child,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([...header, ...data]);
  ws["!cols"] = [
    { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Precios");
  XLSX.writeFile(wb, `Precios_${opName.replace(/\s+/g, "_")}.xlsx`);
}

function generatePDF(rows: VariantRow[], opName: string, currency: string, tc: number) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const now = new Date().toLocaleDateString("es-MX");

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Lista de Precios al Público", 14, 18);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Operador: ${opName}`, 14, 26);
  doc.setFontSize(9);
  doc.text(`Moneda base: ${currency}  |  T.C.: ${tc}  |  Generado: ${now}`, 14, 32);

  const head = [[
    "Tour", "Zona", "Nac.", "Paquete",
    "Venta Adulto\n(MXN)", "Venta Menor\n(MXN)",
    "Costo Adulto", "Costo Menor",
    "Tax Adulto\n(USD)", "Tax Menor\n(USD)",
  ]];
  const body = rows.map((r) => [
    r.tour_title, r.zone, r.nationality, r.package_name ?? "—",
    fmtNum(r.sale_price_adult), fmtNum(r.sale_price_child),
    fmtNum(r.net_cost_adult), fmtNum(r.net_cost_child),
    fmtNum(r.tax_adult), fmtNum(r.tax_child),
  ]);

  autoTable(doc, {
    startY: 36,
    head,
    body,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 7.5, halign: "center" },
    columnStyles: {
      0: { cellWidth: 45 },
      4: { halign: "right" }, 5: { halign: "right" },
      6: { halign: "right" }, 7: { halign: "right" },
      8: { halign: "right" }, 9: { halign: "right" },
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didDrawPage: (data) => {
      doc.setFontSize(7);
      doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 8);
    },
  });

  doc.save(`Precios_${opName.replace(/\s+/g, "_")}.pdf`);
}

export default function PriceListExportDialog({ open, onOpenChange, operator }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: "xlsx" | "pdf") => {
    setLoading(true);
    try {
      const rows = await fetchData(operator.id);
      if (!rows.length) {
        toast.warning("Este operador no tiene tours con variantes de precio activas");
        return;
      }
      const tc = operator.exchange_rate ?? 1;
      const cur = operator.base_currency ?? "USD";

      if (format === "xlsx") {
        generateExcel(rows, operator.name, cur, tc);
        toast.success("Excel descargado");
      } else {
        generatePDF(rows, operator.name, cur, tc);
        toast.success("PDF descargado");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Error al generar archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Exportar Lista de Precios</DialogTitle>
          <DialogDescription>{operator.name}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => handleExport("xlsx")}
            disabled={loading}
          >
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <span className="text-xs font-medium">Excel (.xlsx)</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => handleExport("pdf")}
            disabled={loading}
          >
            <FileText className="h-8 w-8 text-red-600" />
            <span className="text-xs font-medium">PDF</span>
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
