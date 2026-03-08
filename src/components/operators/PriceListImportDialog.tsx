import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/compress-image";

interface PriceVariant {
  zone: string;
  pax_type: string;
  nationality: string;
  sale_price: number;
  net_cost: number;
  tax_fee: number;
}

interface DetectedTour {
  tour_name: string;
  price_variants: PriceVariant[];
  public_price_adult_usd?: number;
  public_price_child_usd?: number;
  tax_adult_usd?: number;
  tax_child_usd?: number;
  child_age_range?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operator: { id: string; name: string; exchange_rate?: number };
}

function parseAgeRange(text: string): { min: number; max: number } | null {
  if (!text) return null;
  const match = text.match(/(\d+)\s*[-–aA]\s*(\d+)/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
  return null;
}

export default function PriceListImportDialog({ open, onOpenChange, operator }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [tours, setTours] = useState<DetectedTour[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [costMode, setCostMode] = useState<"fixed" | "percentage">("fixed");
  const [commissionPct, setCommissionPct] = useState("");
  const [detectedPct, setDetectedPct] = useState<number | null>(null);
  const [detectedExchangeRate, setDetectedExchangeRate] = useState<number>(0);

  const reset = () => {
    setTours([]);
    setSelected(new Set());
    setCostMode("fixed");
    setCommissionPct("");
    setDetectedPct(null);
    setDetectedExchangeRate(0);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    reset();
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("operator_id", operator.id);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-operator-pricelist`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: formData,
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al analizar");
      }
      const data = await res.json();
      const extractedTours: DetectedTour[] = data.tours || [];
      setTours(extractedTours);
      setSelected(new Set(extractedTours.map((_, i) => i)));

      if (data.detected_exchange_rate && data.detected_exchange_rate > 0) {
        setDetectedExchangeRate(data.detected_exchange_rate);
      }

      if (data.detected_commission_percent) {
        setDetectedPct(data.detected_commission_percent);
        setCostMode("percentage");
        setCommissionPct(String(data.detected_commission_percent));
      }
      toast.success(`${extractedTours.length} tour(s) detectados`);
    } catch (err: any) {
      toast.error(err.message || "Error al procesar");
    } finally {
      setParsing(false);
      if (e.target) e.target.value = "";
    }
  };

  // Apply cost rule to variants
  const getProcessedVariants = (variants: PriceVariant[]): PriceVariant[] => {
    if (costMode === "fixed") return variants;
    const pct = parseFloat(commissionPct) || 0;
    return variants.map((v) => ({
      ...v,
      net_cost: Math.round(v.sale_price * (1 - pct / 100) * 100) / 100,
    }));
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === tours.length) setSelected(new Set());
    else setSelected(new Set(tours.map((_, i) => i)));
  };

  const handleImport = async () => {
    const toImport = tours.filter((_, i) => selected.has(i));
    if (toImport.length === 0) {
      toast.error("Selecciona al menos un tour");
      return;
    }
    setImporting(true);
    let created = 0, updated = 0, errors = 0;

    // Determine exchange rate: detected from doc > operator > fallback 17.5
    const exchangeRate = detectedExchangeRate > 0
      ? detectedExchangeRate
      : (operator.exchange_rate && operator.exchange_rate > 0 ? operator.exchange_rate : 17.5);

    const pct = parseFloat(commissionPct) || 0;
    const useCommission = costMode === "percentage" && pct > 0;

    try {
      for (const tour of toImport) {
        const processedVariants = getProcessedVariants(tour.price_variants);

        // Derive net cost from first adult variant if available
        const firstAdultVariant = processedVariants.find(v => v.pax_type === "Adulto");
        const firstChildVariant = processedVariants.find(v => v.pax_type === "Menor");

        // Fallback: derive general fields from variants if AI didn't extract them at tour level
        const rawPubAdult = tour.public_price_adult_usd ?? 0;
        const rawPubChild = tour.public_price_child_usd ?? 0;
        const rawTaxAdult = tour.tax_adult_usd ?? 0;
        const rawTaxChild = tour.tax_child_usd ?? 0;

        const pubAdultFinal = rawPubAdult > 0 ? rawPubAdult : (firstAdultVariant?.sale_price ?? 0);
        const pubChildFinal = rawPubChild > 0 ? rawPubChild : (firstChildVariant?.sale_price ?? 0);
        const taxAdultFinal = rawTaxAdult > 0 ? rawTaxAdult : (firstAdultVariant?.tax_fee ?? 0);
        const taxChildFinal = rawTaxChild > 0 ? rawTaxChild : (firstChildVariant?.tax_fee ?? 0);

        const netAdult = useCommission
          ? Math.round(pubAdultFinal * (1 - pct / 100) * 100) / 100
          : (firstAdultVariant?.net_cost ?? 0);
        const netChild = useCommission
          ? Math.round(pubChildFinal * (1 - pct / 100) * 100) / 100
          : (firstChildVariant?.net_cost ?? 0);

        const ages = parseAgeRange(tour.child_age_range ?? "");

        const tourPayload: Record<string, any> = {
          title: tour.tour_name,
          operator_id: operator.id,
          public_price_adult_usd: pubAdultFinal,
          public_price_child_usd: pubChildFinal,
          tax_adult_usd: taxAdultFinal,
          tax_child_usd: taxChildFinal,
          exchange_rate_tour: exchangeRate,
          price_mxn: Math.round((pubAdultFinal + taxAdultFinal) * exchangeRate * 100) / 100,
          suggested_price_mxn: Math.round((pubChildFinal + taxChildFinal) * exchangeRate * 100) / 100,
          price_adult_usd: netAdult,
          price_child_usd: netChild,
        };

        if (ages) {
          tourPayload.child_age_min = ages.min;
          tourPayload.child_age_max = ages.max;
        }

        if (useCommission) {
          tourPayload.calculation_mode = "commission";
          tourPayload.commission_percentage = pct;
        } else {
          tourPayload.calculation_mode = "net_cost";
        }

        // Check if tour already exists for this operator
        const { data: existing } = await supabase
          .from("tours")
          .select("id")
          .eq("operator_id", operator.id)
          .ilike("title", tour.tour_name)
          .limit(1);

        let tourId: string;

        if (existing && existing.length > 0) {
          tourId = existing[0].id;
          // Update existing tour with general fields
          const { error: updErr } = await supabase
            .from("tours")
            .update(tourPayload)
            .eq("id", tourId);
          if (updErr) {
            console.error("Error updating tour:", updErr);
            errors++;
            continue;
          }
          updated++;
        } else {
          // Create tour with all general fields
          const { data: newTour, error: insertErr } = await supabase
            .from("tours")
            .insert(tourPayload as any)
            .select("id")
            .single();
          if (insertErr) {
            console.error("Error creating tour:", insertErr);
            errors++;
            continue;
          }
          tourId = newTour.id;
          created++;
        }

        // Delete existing variants for this tour+operator, then insert new ones
        await supabase
          .from("tour_price_variants")
          .delete()
          .eq("tour_id", tourId)
          .eq("operator_id", operator.id);

        const variantRows = processedVariants.map((v) => ({
          tour_id: tourId,
          operator_id: operator.id,
          zone: v.zone,
          pax_type: v.pax_type,
          nationality: v.nationality,
          sale_price: v.sale_price,
          net_cost: v.net_cost,
          tax_fee: v.tax_fee,
        }));

        if (variantRows.length > 0) {
          const { error: varErr } = await supabase.from("tour_price_variants").insert(variantRows);
          if (varErr) {
            console.error("Error inserting variants:", varErr);
            errors++;
          }
        }
      }

      toast.success(`Importación completada: ${created} creados, ${updated} actualizados${errors > 0 ? `, ${errors} errores` : ""}`);
      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast.error(err.message || "Error al importar");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mapear Lista de Precios — {operator.name}</DialogTitle>
          <DialogDescription>
            Sube un documento (PDF o imagen) con la lista de precios del operador.
          </DialogDescription>
        </DialogHeader>

        {/* File upload */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {parsing ? "Analizando…" : "Seleccionar archivo"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Cost rule selector */}
        {tours.length > 0 && (
          <div className="space-y-3 rounded-lg border p-4">
            <Label className="text-sm font-medium">Regla de Costo Neto</Label>
            {detectedPct !== null && (
              <p className="text-xs text-muted-foreground">
                IA detectó comisión: <span className="font-semibold">{detectedPct}%</span>
              </p>
            )}
            {detectedExchangeRate > 0 && (
              <p className="text-xs text-muted-foreground">
                TC detectado: <span className="font-semibold">${detectedExchangeRate}</span>
              </p>
            )}
            <RadioGroup
              value={costMode}
              onValueChange={(v) => setCostMode(v as "fixed" | "percentage")}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fixed" id="cost-fixed" />
                <Label htmlFor="cost-fixed" className="cursor-pointer text-sm">Monto Fijo</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percentage" id="cost-pct" />
                <Label htmlFor="cost-pct" className="cursor-pointer text-sm">Porcentaje de Descuento</Label>
              </div>
            </RadioGroup>

            {costMode === "percentage" && (
              <div className="flex items-center gap-2 max-w-xs">
                <Label className="text-sm whitespace-nowrap">Descuento %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">
                  net_cost = sale_price × (1 − {commissionPct || "0"}%)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Preview table */}
        {tours.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Tours detectados ({tours.length})</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selected.size === tours.length ? "Deseleccionar todos" : "Seleccionar todos"}
              </Button>
            </div>
            <div className="rounded-md border max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Tour</TableHead>
                    <TableHead className="text-right">Pub. Adulto</TableHead>
                    <TableHead className="text-right">Pub. Menor</TableHead>
                    <TableHead className="text-right">Tax Ad.</TableHead>
                    <TableHead className="text-right">Variantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tours.map((t, i) => {
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(i)}
                            onCheckedChange={() => toggleSelect(i)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-sm">{t.tour_name}</TableCell>
                        <TableCell className="text-right text-sm">
                          {t.public_price_adult_usd ? `$${t.public_price_adult_usd}` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {t.public_price_child_usd ? `$${t.public_price_child_usd}` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {t.tax_adult_usd ? `$${t.tax_adult_usd}` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm">{t.price_variants.length}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {tours.length > 0 && (
            <Button onClick={handleImport} disabled={importing || selected.size === 0}>
              {importing ? "Importando…" : `Importar ${selected.size} tour(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
