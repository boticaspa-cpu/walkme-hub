import { useState, useMemo, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface PriceVariant {
  id: string;
  tour_id: string;
  tour_package_id: string | null;
  is_mexican: boolean;
  zone: string;
  price_adult_mxn: number;
  price_child_mxn: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourTitle: string;
  childAgeMin: number;
  childAgeMax: number;
  variants: PriceVariant[];
  packageNames: Record<string, string>; // id -> name
  onAdd: (variant: PriceVariant, qtyAdults: number, qtyChildren: number) => void;
}

export default function VariantSelectDialog({
  open, onOpenChange, tourTitle, childAgeMin, childAgeMax,
  variants, packageNames, onAdd,
}: Props) {
  const [nationality, setNationality] = useState<string>("");
  const [zone, setZone] = useState<string>("");
  const [packageId, setPackageId] = useState<string>("");
  const [qtyAdults, setQtyAdults] = useState(1);
  const [qtyChildren, setQtyChildren] = useState(0);

  // Reset on open
  useEffect(() => {
    if (open) {
      setNationality("");
      setZone("");
      setPackageId("");
      setQtyAdults(1);
      setQtyChildren(0);
    }
  }, [open]);

  // Available nationalities
  const nationalities = useMemo(() => {
    const hasMex = variants.some(v => v.is_mexican);
    const hasForeign = variants.some(v => !v.is_mexican);
    const opts: { value: string; label: string }[] = [];
    if (hasMex) opts.push({ value: "mexican", label: "Mexicano" });
    if (hasForeign) opts.push({ value: "foreign", label: "Extranjero" });
    return opts;
  }, [variants]);

  // Auto-select if only one nationality
  useEffect(() => {
    if (nationalities.length === 1 && !nationality) {
      setNationality(nationalities[0].value);
    }
  }, [nationalities, nationality]);

  // Filtered by nationality
  const afterNat = useMemo(() => {
    if (!nationality) return [];
    const isMex = nationality === "mexican";
    return variants.filter(v => v.is_mexican === isMex);
  }, [variants, nationality]);

  // Available zones
  const zones = useMemo(() => [...new Set(afterNat.map(v => v.zone))], [afterNat]);

  // Auto-select if only one zone
  useEffect(() => {
    if (zones.length === 1 && !zone) setZone(zones[0]);
    if (zone && !zones.includes(zone)) setZone("");
  }, [zones, zone]);

  // Filtered by zone
  const afterZone = useMemo(() => {
    if (!zone) return [];
    return afterNat.filter(v => v.zone === zone);
  }, [afterNat, zone]);

  // Available packages
  const hasPackages = useMemo(() => afterZone.some(v => v.tour_package_id), [afterZone]);
  const pkgOptions = useMemo(() => {
    if (!hasPackages) return [];
    const ids = [...new Set(afterZone.filter(v => v.tour_package_id).map(v => v.tour_package_id!))];
    return ids.map(id => ({ value: id, label: packageNames[id] || id }));
  }, [afterZone, hasPackages, packageNames]);

  // Auto-select if only one package or no packages
  useEffect(() => {
    if (!hasPackages && afterZone.length > 0) {
      setPackageId("none");
    } else if (pkgOptions.length === 1 && !packageId) {
      setPackageId(pkgOptions[0].value);
    }
    if (packageId && packageId !== "none" && !pkgOptions.find(p => p.value === packageId)) {
      setPackageId("");
    }
  }, [pkgOptions, hasPackages, packageId, afterZone]);

  // Final match
  const matched = useMemo(() => {
    if (!nationality || !zone || !packageId) return null;
    const isMex = nationality === "mexican";
    const pkgId = packageId === "none" ? null : packageId;
    return variants.find(v =>
      v.is_mexican === isMex &&
      v.zone === zone &&
      (v.tour_package_id || null) === pkgId
    ) || null;
  }, [variants, nationality, zone, packageId]);

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const totalAdults = matched ? matched.price_adult_mxn * qtyAdults : 0;
  const totalChildren = matched ? matched.price_child_mxn * qtyChildren : 0;
  const grandTotal = totalAdults + totalChildren;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{tourTitle}</DialogTitle>
          <DialogDescription>Selecciona las opciones para obtener el precio</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Nationality */}
          {nationalities.length > 1 && (
            <div className="space-y-1">
              <Label className="text-xs">Nacionalidad</Label>
              <Select value={nationality} onValueChange={(v) => { setNationality(v); setZone(""); setPackageId(""); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {nationalities.map(n => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Zone */}
          {nationality && zones.length > 1 && (
            <div className="space-y-1">
              <Label className="text-xs">Zona</Label>
              <Select value={zone} onValueChange={(v) => { setZone(v); setPackageId(""); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar zona" /></SelectTrigger>
                <SelectContent>
                  {zones.map(z => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Package */}
          {zone && hasPackages && pkgOptions.length > 1 && (
            <div className="space-y-1">
              <Label className="text-xs">Paquete</Label>
              <Select value={packageId} onValueChange={setPackageId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar paquete" /></SelectTrigger>
                <SelectContent>
                  {pkgOptions.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price result */}
          {matched && (
            <>
              <Separator />
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Precio Adulto</span>
                  <span className="font-bold text-primary">{fmt(matched.price_adult_mxn)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Precio Niño ({childAgeMin}–{childAgeMax} años)</span>
                  <span className="font-bold text-primary">{fmt(matched.price_child_mxn)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Adultos</Label>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQtyAdults(Math.max(0, qtyAdults - 1))}><Minus className="h-3 w-3" /></Button>
                    <Input className="h-8 text-center w-14" value={qtyAdults} readOnly />
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQtyAdults(qtyAdults + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Niños</Label>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQtyChildren(Math.max(0, qtyChildren - 1))}><Minus className="h-3 w-3" /></Button>
                    <Input className="h-8 text-center w-14" value={qtyChildren} readOnly />
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQtyChildren(qtyChildren + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>

              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{fmt(grandTotal)}</span>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!matched || (qtyAdults === 0 && qtyChildren === 0)}
            onClick={() => { if (matched) { onAdd(matched, qtyAdults, qtyChildren); onOpenChange(false); } }}
          >
            Agregar al Carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
