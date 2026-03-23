import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Package, Info } from "lucide-react";
import MappingCards from "./MappingCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

export interface PackageForm {
  id?: string;
  name: string;
  service_type: string;
  public_price_adult_usd: string;
  public_price_child_usd: string;
  cost_adult_usd: string;
  cost_child_usd: string;
  tax_adult_usd: string;
  tax_child_usd: string;
  mandatory_fees_usd: string;
  exchange_rate_tour: string;
  price_adult_mxn: string;
  price_child_mxn: string;
  includes: string;
  excludes: string;
  active: boolean;
}

export const emptyPackage: PackageForm = {
  name: "",
  service_type: "with_transport",
  public_price_adult_usd: "",
  public_price_child_usd: "",
  cost_adult_usd: "",
  cost_child_usd: "",
  tax_adult_usd: "",
  tax_child_usd: "",
  mandatory_fees_usd: "",
  exchange_rate_tour: "",
  price_adult_mxn: "0",
  price_child_mxn: "0",
  includes: "",
  excludes: "",
  active: true,
};

interface Props {
  packages: PackageForm[];
  onChange: (packages: PackageForm[]) => void;
  tourExchangeRate: number;
  tourTaxAdultUsd: number;
  tourTaxChildUsd: number;
  onDocUpload?: (file: File) => Promise<void>;
  isMapping?: boolean;
  onSheetImport?: () => void;
}

function calcMxn(pubUsd: string, taxUsd: number, tc: number): string {
  const pub = parseFloat(pubUsd) || 0;
  const result = (pub + taxUsd) * tc;
  return result > 0 ? result.toFixed(2) : "0";
}

export default function PackageEditor({ packages, onChange, tourExchangeRate, tourTaxAdultUsd, tourTaxChildUsd, onDocUpload, isMapping, onSheetImport }: Props) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setOpenIndexes(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const update = (index: number, field: keyof PackageForm, value: string | boolean) => {
    const next = [...packages];
    const pkg = { ...next[index], [field]: value };

    // Auto-calc MXN using parent's TC and taxes
    pkg.price_adult_mxn = calcMxn(pkg.public_price_adult_usd, tourTaxAdultUsd, tourExchangeRate);
    pkg.price_child_mxn = calcMxn(pkg.public_price_child_usd, tourTaxChildUsd, tourExchangeRate);

    next[index] = pkg;
    onChange(next);
  };

  const add = () => {
    if (packages.length >= 6) return;
    const next = [...packages, { ...emptyPackage }];
    onChange(next);
    setOpenIndexes(prev => new Set(prev).add(next.length - 1));
  };

  const remove = (index: number) => {
    onChange(packages.filter((_, i) => i !== index));
    setOpenIndexes(prev => {
      const next = new Set<number>();
      prev.forEach(i => { if (i < index) next.add(i); else if (i > index) next.add(i - 1); });
      return next;
    });
  };

  const fmt = (n: string) => {
    const v = parseFloat(n) || 0;
    return `$${v.toLocaleString("es-MX")} MXN`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Package className="h-4 w-4" /> Paquetes del Tour
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={add} disabled={packages.length >= 6}>
            <Plus className="mr-1 h-3 w-3" /> Agregar Paquete
          </Button>
        </div>
        </div>
      </div>

      {packages.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
          Sin paquetes. El tour usará sus precios generales.
        </p>
      )}

      {packages.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            Valores heredados del tour: T.C. <strong>${tourExchangeRate}</strong> · Tax Adulto <strong>${tourTaxAdultUsd} USD</strong> · Tax Menor <strong>${tourTaxChildUsd} USD</strong>
          </span>
        </div>
      )}

      {packages.map((pkg, i) => {
        const isOpen = openIndexes.has(i);
        const isEntryOnly = pkg.service_type === "entry_only";

        return (
          <Collapsible key={i} open={isOpen} onOpenChange={() => toggle(i)}>
            <div className="border rounded-lg">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors gap-2"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  <span className="text-sm font-medium flex-1">
                    {pkg.name || `Paquete ${i + 1}`}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {isEntryOnly ? "Solo Entrada" : "Con Transporte"}
                  </Badge>
                  <span className="text-xs font-semibold text-primary">{fmt(pkg.price_adult_mxn)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive shrink-0"
                    onClick={(e) => { e.stopPropagation(); remove(i); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-3 border-t pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nombre del Paquete *</Label>
                      <Input
                        value={pkg.name}
                        onChange={(e) => update(i, "name", e.target.value)}
                        placeholder="Ej: Clásico, Plus, Premium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo de Servicio</Label>
                      <Select value={pkg.service_type} onValueChange={(v) => update(i, "service_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="with_transport">Con Transporte</SelectItem>
                          <SelectItem value="entry_only">Solo Entrada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground">Precios USD</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Precio Púb. Adulto USD</Label>
                      <Input type="number" value={pkg.public_price_adult_usd} onChange={(e) => update(i, "public_price_adult_usd", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Precio Púb. Menor USD</Label>
                      <Input type="number" value={pkg.public_price_child_usd} onChange={(e) => update(i, "public_price_child_usd", e.target.value)} placeholder="0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Costo Neto Adulto USD</Label>
                      <Input type="number" value={pkg.cost_adult_usd} onChange={(e) => update(i, "cost_adult_usd", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Costo Neto Menor USD</Label>
                      <Input type="number" value={pkg.cost_child_usd} onChange={(e) => update(i, "cost_child_usd", e.target.value)} placeholder="0" />
                    </div>
                  </div>

                  {!isEntryOnly && (
                    <div className="space-y-1">
                      <Label className="text-xs">Fees al Abordar USD (muelle/parques)</Label>
                      <Input type="number" value={pkg.mandatory_fees_usd} onChange={(e) => update(i, "mandatory_fees_usd", e.target.value)} placeholder="0" />
                    </div>
                  )}

                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground">Precio Final MXN (calculado)</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Precio Adulto MXN</Label>
                      <Input type="number" value={pkg.price_adult_mxn} disabled className="bg-muted" />
                      <p className="text-[10px] text-muted-foreground">= (Púb {parseFloat(pkg.public_price_adult_usd) || 0} + Tax {tourTaxAdultUsd}) × {tourExchangeRate}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Precio Menor MXN</Label>
                      <Input type="number" value={pkg.price_child_mxn} disabled className="bg-muted" />
                      <p className="text-[10px] text-muted-foreground">= (Púb {parseFloat(pkg.public_price_child_usd) || 0} + Tax {tourTaxChildUsd}) × {tourExchangeRate}</p>
                    </div>
                  </div>

                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Incluye (separado por coma)</Label>
                      <Input value={pkg.includes} onChange={(e) => update(i, "includes", e.target.value)} placeholder="Entrada, Guía, Comida" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">No incluye (separado por coma)</Label>
                      <Input value={pkg.excludes} onChange={(e) => update(i, "excludes", e.target.value)} placeholder="Propinas, Souvenirs" />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
