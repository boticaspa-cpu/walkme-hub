import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, RotateCcw } from "lucide-react";
import OperatorVoucherPrintView, { type OperatorVoucherData } from "./OperatorVoucherPrintView";

interface Props {
  reservation: any | null;
  onClose: () => void;
}

const buildInitial = (r: any): OperatorVoucherData => ({
  clientName: r?.clients?.name ?? "",
  phone: r?.clients?.phone ?? "",
  email: r?.pax_email || r?.clients?.email || "",
  hotel: r?.hotel_name ?? "",
  room: "",
  pickupPoint: r?.pickup_point || r?.pickup_notes || "",
  notes: r?.notes ?? "",
  language: r?.tour_language ?? "",
  showPhone: false,
  showEmail: false,
  showHotel: true,
  showPickup: true,
  showNotes: true,
  showLanguage: true,
  payAmount: "0",
  payCurrency: "MXN",
  payMethod: "cash",
  payReference: "",
});

export default function OperatorVoucherDialog({ reservation, onClose }: Props) {
  const [data, setData] = useState<OperatorVoucherData>(buildInitial(reservation));
  const set = <K extends keyof OperatorVoucherData>(k: K, v: OperatorVoucherData[K]) =>
    setData((p) => ({ ...p, [k]: v }));

  const operatorId = reservation?.tours?.operator_id ?? null;

  const { data: prefill } = useQuery({
    queryKey: ["operator-voucher-prefill", reservation?.id],
    enabled: !!reservation?.id,
    queryFn: async () => {
      const [{ data: variants }, { data: op }] = await Promise.all([
        supabase
          .from("tour_price_variants")
          .select("pax_type, net_cost, package_name, zone, nationality")
          .eq("tour_id", reservation.tour_id ?? "")
          .eq("zone", reservation.zone ?? "")
          .eq("nationality", reservation.nationality ?? ""),
        operatorId
          ? supabase.from("operators").select("base_currency, preferred_payment_method").eq("id", operatorId).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      const pkg = reservation.package_name || null;
      const pick = (paxType: string) => {
        const list = (variants ?? []).filter((v: any) => v.pax_type === paxType);
        return list.find((v: any) => v.package_name === pkg) ?? list.find((v: any) => !v.package_name) ?? list[0];
      };
      const adult = Number(pick("adult")?.net_cost ?? 0);
      const child = Number(pick("child")?.net_cost ?? 0);
      const amount = adult * (reservation.pax_adults ?? 0) + child * (reservation.pax_children ?? 0);
      return {
        amount,
        currency: (op as any)?.base_currency || "MXN",
        method: (op as any)?.preferred_payment_method || "cash",
      };
    },
  });

  useEffect(() => {
    setData(buildInitial(reservation));
  }, [reservation?.id]);

  useEffect(() => {
    if (!prefill) return;
    setData((p) => ({
      ...p,
      payAmount: prefill.amount > 0 ? String(prefill.amount) : p.payAmount,
      payCurrency: ["MXN", "USD"].includes(prefill.currency) ? prefill.currency : "MXN",
      payMethod: ["cash", "transfer", "card", "credit", "prepaid"].includes(prefill.method) ? prefill.method : "cash",
    }));
  }, [prefill]);

  const handlePrint = () => {
    const content = document.getElementById("operator-voucher-content");
    if (!content) return;
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");
    w.document.write(`<!DOCTYPE html><html><head><title>Cupón Operador ${reservation?.folio ?? ""}</title>
      ${styles}
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; margin: 0; background: white; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${content.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
  };

  const toggles = useMemo(
    () => ([
      { key: "showPhone" as const, label: "Teléfono pax" },
      { key: "showEmail" as const, label: "Email pax" },
      { key: "showHotel" as const, label: "Hotel" },
      { key: "showPickup" as const, label: "Pickup" },
      { key: "showLanguage" as const, label: "Idioma" },
      { key: "showNotes" as const, label: "Notas" },
    ]),
    []
  );

  return (
    <Dialog open={!!reservation} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cupón Operador — {reservation?.folio ?? ""}</DialogTitle>
          <DialogDescription>
            Sin precios de venta ni "incluye". Elige qué datos mostrar y captura el monto a pagar al operador.
          </DialogDescription>
        </DialogHeader>

        {reservation && (
          <div className="space-y-4">
            {/* Visibilidad */}
            <div className="rounded-lg border border-border p-3">
              <Label className="text-xs uppercase text-muted-foreground">Mostrar en el cupón</Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {toggles.map((t) => (
                  <label key={t.key} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                    <span className="text-xs">{t.label}</span>
                    <Switch checked={data[t.key]} onCheckedChange={(v) => set(t.key, v)} />
                  </label>
                ))}
              </div>
            </div>

            {/* Datos editables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pasajero</Label>
                <Input value={data.clientName} onChange={(e) => set("clientName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Idioma</Label>
                <Input value={data.language} onChange={(e) => set("language", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Teléfono pax</Label>
                <Input value={data.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email pax</Label>
                <Input value={data.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hotel</Label>
                <Input value={data.hotel} onChange={(e) => set("hotel", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Habitación</Label>
                <Input value={data.room} onChange={(e) => set("room", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Punto de pickup</Label>
                <Input value={data.pickupPoint} onChange={(e) => set("pickupPoint", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Notas operativas</Label>
                <Textarea rows={2} value={data.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </div>

            {/* Pago al operador */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <Label className="text-xs uppercase text-muted-foreground">Pago al operador</Label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Monto</Label>
                  <Input type="number" inputMode="decimal" value={data.payAmount} onChange={(e) => set("payAmount", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Moneda</Label>
                  <Select value={data.payCurrency} onValueChange={(v) => set("payCurrency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Forma de pago</Label>
                  <Select value={data.payMethod} onValueChange={(v) => set("payMethod", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="credit">Crédito (pago posterior)</SelectItem>
                      <SelectItem value="prepaid">Prepagado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Referencia</Label>
                  <Input value={data.payReference} onChange={(e) => set("payReference", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-border p-2 overflow-x-auto">
              <OperatorVoucherPrintView reservation={reservation} data={data} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setData(buildInitial(reservation))}>
            <RotateCcw className="mr-2 h-4 w-4" /> Restablecer
          </Button>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
