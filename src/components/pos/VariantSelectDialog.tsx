import { useState, useMemo, useEffect } from "react";
import { Minus, Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface PriceVariant {
  id: string;
  tour_id: string;
  operator_id: string;
  zone: string;
  pax_type: string; // "Adulto" | "Menor"
  nationality: string; // "Nacional" | "Extranjero"
  sale_price: number;
  tax_fee: number;
  net_cost?: number; // only for admins
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourTitle: string;
  packageName?: string;
  childAgeMin: number;
  childAgeMax: number;
  variants: PriceVariant[];
  onAdd: (adultVariant: PriceVariant, childVariant: PriceVariant | null, qtyAdults: number, qtyChildren: number, tourDate: string) => void;
}

export default function VariantSelectDialog({
  open, onOpenChange, tourTitle, packageName, childAgeMin, childAgeMax,
  variants, onAdd,
}: Props) {
  const [zone, setZone] = useState<string>("");
  const [nationality, setNationality] = useState<string>("");
  const [qtyAdults, setQtyAdults] = useState(1);
  const [qtyChildren, setQtyChildren] = useState(0);
  const [tourDate, setTourDate] = useState<Date>();

  useEffect(() => {
    if (open) {
      setZone("");
      setNationality("");
      setQtyAdults(1);
      setQtyChildren(0);
      setTourDate(undefined);
    }
  }, [open]);

  const zones = useMemo(() => [...new Set(variants.map(v => v.zone))], [variants]);

  useEffect(() => {
    if (zones.length === 1 && !zone) setZone(zones[0]);
    if (zone && !zones.includes(zone)) setZone("");
  }, [zones, zone]);

  const afterZone = useMemo(() => {
    if (!zone) return [];
    return variants.filter(v => v.zone === zone);
  }, [variants, zone]);

  const nationalities = useMemo(() => [...new Set(afterZone.map(v => v.nationality))], [afterZone]);

  useEffect(() => {
    if (nationalities.length === 1 && !nationality) setNationality(nationalities[0]);
    if (nationality && !nationalities.includes(nationality)) setNationality("");
  }, [nationalities, nationality]);

  const adultVariant = useMemo(() => {
    if (!zone || !nationality) return null;
    return variants.find(v => v.zone === zone && v.nationality === nationality && v.pax_type === "Adulto") || null;
  }, [variants, zone, nationality]);

  const childVariant = useMemo(() => {
    if (!zone || !nationality) return null;
    return variants.find(v => v.zone === zone && v.nationality === nationality && v.pax_type === "Menor") || null;
  }, [variants, zone, nationality]);

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const adultPrice = adultVariant?.sale_price ?? 0;
  const childPrice = childVariant?.sale_price ?? 0;
  const totalAdults = adultPrice * qtyAdults;
  const totalChildren = childPrice * qtyChildren;
  const grandTotal = totalAdults + totalChildren;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{packageName ? `${tourTitle} — ${packageName}` : tourTitle}</DialogTitle>
          <DialogDescription>Selecciona fecha, zona y nacionalidad</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Tour Date */}
          <div className="space-y-1">
            <Label className="text-xs">Fecha del Tour</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !tourDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tourDate ? format(tourDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tourDate}
                  onSelect={setTourDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Zone — always visible */}
          <div className="space-y-1">
            <Label className="text-xs">Zona de Pickup</Label>
            <Select value={zone} onValueChange={(v) => { setZone(v); setNationality(""); }}>
              <SelectTrigger><SelectValue placeholder="Seleccionar zona" /></SelectTrigger>
              <SelectContent>
                {zones.map(z => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nationality — always visible when zone selected */}
          {zone && (
            <div className="space-y-1">
              <Label className="text-xs">Nacionalidad</Label>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {nationalities.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price result */}
          {adultVariant && (
            <>
              <Separator />
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Precio Adulto</span>
                  <span className="font-bold text-primary">{fmt(adultPrice)}</span>
                </div>
                {childVariant && (
                  <div className="flex justify-between text-sm">
                    <span>Precio Menor ({childAgeMin}–{childAgeMax} años)</span>
                    <span className="font-bold text-primary">{fmt(childPrice)}</span>
                  </div>
                )}
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
                {childVariant && (
                  <div className="space-y-1">
                    <Label className="text-xs">Niños</Label>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQtyChildren(Math.max(0, qtyChildren - 1))}><Minus className="h-3 w-3" /></Button>
                      <Input className="h-8 text-center w-14" value={qtyChildren} readOnly />
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQtyChildren(qtyChildren + 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                )}
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
            disabled={!adultVariant || !tourDate || (qtyAdults === 0 && qtyChildren === 0)}
            onClick={() => {
              if (adultVariant && tourDate) {
                const dateStr = format(tourDate, "yyyy-MM-dd");
                onAdd(adultVariant, childVariant, qtyAdults, qtyChildren, dateStr);
                onOpenChange(false);
              }
            }}
          >
            Agregar al Carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}