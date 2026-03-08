import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export interface TourPackage {
  id: string;
  tour_id: string;
  name: string;
  service_type: string;
  public_price_adult_usd: number;
  tax_adult_usd: number;
  tax_child_usd: number;
  mandatory_fees_usd: number;
  price_adult_mxn: number;
  price_child_mxn: number;
  includes: string[];
  excludes: string[];
  exchange_rate_tour: number;
  cost_adult_usd: number;
  public_price_child_usd: number;
  cost_child_usd: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourTitle: string;
  packages: TourPackage[];
  onSelect: (pkg: TourPackage) => void;
}

export default function PackageSelectDialog({ open, onOpenChange, tourTitle, packages, onSelect }: Props) {
  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{tourTitle}</DialogTitle>
          <DialogDescription>Selecciona un paquete para agregar al carrito</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelect(pkg)}
              className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{pkg.name}</span>
                <span className="text-sm font-bold text-primary">{fmt(pkg.price_adult_mxn)}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {pkg.service_type === "entry_only" ? "Solo Entrada" : "Con Transporte"}
              </Badge>
              {pkg.includes.length > 0 && (
                <div className="space-y-0.5">
                  {pkg.includes.map((inc, j) => (
                    <div key={j} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
