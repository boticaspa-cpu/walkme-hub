import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeTourPrice, computeTotal } from "@/lib/tour-pricing";
import { useAuth } from "@/contexts/AuthContext";
import { useCashSession } from "@/hooks/useCashSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, Banknote, CreditCard, ArrowLeftRight } from "lucide-react";

interface ReservationCheckoutProps {
  reservation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ReservationCheckout({ reservation, open, onOpenChange, onSuccess }: ReservationCheckoutProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { activeSession, isSessionOpen } = useCashSession();

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [currency, setCurrency] = useState("MXN");
  const [exchangeRate, setExchangeRate] = useState("17.50");
  const [recalculatedTotal, setRecalculatedTotal] = useState<number | null>(null);

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  // Force MXN when payment is card or transfer
  useEffect(() => {
    if (paymentMethod === "card" || paymentMethod === "transfer") {
      setCurrency("MXN");
    }
  }, [paymentMethod]);

  // Fetch card_fee_percent from settings
  const { data: cardFeePercent = 0 } = useQuery({
    queryKey: ["settings-card-fee"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "card_fee_percent")
        .maybeSingle();
      if (error) throw error;
      return parseFloat(data?.value ?? "0") || 0;
    },
    enabled: open,
  });

  // Fetch tours + variants for recalc if total=0
  const { data: toursForPricing = [] } = useQuery({
    queryKey: ["tours-pricing-checkout"],
    queryFn: async () => {
      const { data } = await supabase.from("tours").select("id, price_mxn, suggested_price_mxn, public_price_adult_usd, public_price_child_usd, exchange_rate_tour, tax_adult_usd, tax_child_usd").eq("active", true);
      return data ?? [];
    },
    enabled: open && (reservation?.total_mxn ?? 0) === 0,
  });

  const { data: variantsForPricing = [] } = useQuery({
    queryKey: ["variants-pricing-checkout"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tour_price_variants")
        .select("tour_id, zone, nationality, pax_type, sale_price")
        .eq("active", true);
      return data ?? [];
    },
    enabled: open && (reservation?.total_mxn ?? 0) === 0,
  });

  // Recalculate if total_mxn=0
  useEffect(() => {
    if (!reservation || reservation.total_mxn > 0) {
      setRecalculatedTotal(null);
      return;
    }
    if (!reservation.tour_id || toursForPricing.length === 0) return;
    const result = computeTourPrice(
      reservation.tour_id,
      reservation.zone ?? "",
      reservation.nationality ?? "",
      variantsForPricing as any,
      toursForPricing as any
    );
    const total = computeTotal(result.adultPrice, result.childPrice, reservation.pax_adults || 1, reservation.pax_children || 0);
    if (total > 0) {
      setRecalculatedTotal(total);
      (supabase as any).from("reservations").update({ total_mxn: total }).eq("id", reservation.id)
        .then(({ error: recalcErr }: { error: unknown }) => {
          if (recalcErr) console.warn("Could not update recalculated total:", recalcErr);
        });
    }
  }, [reservation, toursForPricing, variantsForPricing]);

  const baseTotalMxn = recalculatedTotal ?? reservation?.total_mxn ?? 0;
  const cardFeeAmount = paymentMethod === "card" ? Math.round(baseTotalMxn * cardFeePercent) / 100 : 0;
  const totalMxn = baseTotalMxn; // Cliente NO paga recargo — fee es costo interno
  const needsCashSession = paymentMethod === "cash";

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      // Validate: non-cash must be MXN
      if (paymentMethod !== "cash" && currency !== "MXN") {
        throw new Error("Pagos con tarjeta/transferencia solo aceptan MXN");
      }

      if (needsCashSession && !isSessionOpen) {
        throw new Error("Debes abrir caja para cobrar en efectivo");
      }

      const er = currency !== "MXN" ? parseFloat(exchangeRate) || 1 : 1;

      // 1. Create sale (total includes card fee)
      const { data: sale, error: saleErr } = await (supabase as any).from("sales").insert({
        reservation_id: reservation.id,
        client_id: reservation.client_id || null,
        payment_method: paymentMethod,
        currency,
        exchange_rate: er,
        subtotal_mxn: baseTotalMxn,
        discount_mxn: 0,
        total_mxn: baseTotalMxn,
        sold_by: user?.id,
        cash_session_id: activeSession?.id || null,
      }).select("id").single();
      if (saleErr) throw saleErr;

      // 2. Create sale_item
      await (supabase as any).from("sale_items").insert({
        sale_id: sale.id,
        tour_id: reservation.tour_id,
        qty: (reservation.pax_adults || 0) + (reservation.pax_children || 0),
        qty_adults: reservation.pax_adults || 1,
        qty_children: reservation.pax_children || 0,
        unit_price_mxn: baseTotalMxn / Math.max(1, reservation.pax_adults || 1),
        unit_price_child_mxn: 0,
        tour_date: reservation.reservation_date,
      });

      // 3. Create cash_movement if session open
      if (activeSession?.id) {
        const movType = paymentMethod === "card" ? "sale_card" : paymentMethod === "transfer" ? "sale_transfer" : "sale_cash";
        await (supabase as any).from("cash_movements").insert({
          session_id: activeSession.id,
          type: movType,
          amount_mxn: baseTotalMxn,
          amount_fx: currency !== "MXN" ? baseTotalMxn / er : null,
          currency_fx: currency !== "MXN" ? currency : null,
          reference: `Reserva ${reservation.folio || reservation.id.slice(0, 8)}`,
          created_by: user?.id,
        });
      }

      // 4. Update reservation
      await (supabase as any).from("reservations").update({
        payment_status: "paid",
        sale_id: sale.id,
      }).eq("id", reservation.id);

      // 5. Create operator_payable if tour has operator
      if (reservation.tours?.operator_id) {
        const { data: operator } = await (supabase as any)
          .from("operators")
          .select("id, payment_rules, base_currency, exchange_rate")
          .eq("id", reservation.tours.operator_id)
          .single();

        if (operator) {
          const serviceDate = reservation.reservation_date;
          const rule = operator.payment_rules || "prepago";
          let dueDate: string;
          let payableMonth: string | null = null;

          if (rule === "prepago") {
            const d = new Date(serviceDate + "T00:00:00");
            d.setDate(d.getDate() - 1);
            dueDate = d.toISOString().split("T")[0];
          } else {
            const d = new Date(serviceDate + "T00:00:00");
            const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            dueDate = lastDay.toISOString().split("T")[0];
            payableMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          }

          const amountFx = operator.base_currency !== "MXN" ? baseTotalMxn / (operator.exchange_rate || 1) : null;

          await (supabase as any).from("operator_payables").insert({
            reservation_id: reservation.id,
            operator_id: operator.id,
            service_date: serviceDate,
            payment_rule_snapshot: rule,
            due_date: dueDate,
            payable_month: payableMonth,
            amount_mxn: baseTotalMxn,
            amount_fx: amountFx,
            currency_fx: operator.base_currency !== "MXN" ? operator.base_currency : null,
            status: "pending",
          });
        }
      }

      // 6. Auto-generate seller commission based on PROFIT (sale - net cost)
      if (user?.id) {
        const { data: sellerProfile } = await (supabase as any)
          .from("profiles")
          .select("commission_rate")
          .eq("id", user.id)
          .single();
        const rate = sellerProfile?.commission_rate ?? 0.10;
        if (rate > 0) {
          let totalNetCost = 0;
          let totalTaxFee = 0;
          if (reservation.tour_id) {
            const zone = reservation.zone || "";
            const nationality = reservation.nationality || "";
            const { data: adultVariant } = await (supabase as any)
              .from("tour_price_variants")
              .select("net_cost, tax_fee")
              .eq("tour_id", reservation.tour_id)
              .eq("zone", zone)
              .eq("nationality", nationality)
              .eq("pax_type", "Adulto")
              .eq("active", true)
              .limit(1)
              .maybeSingle();
            const { data: childVariant } = await (supabase as any)
              .from("tour_price_variants")
              .select("net_cost, tax_fee")
              .eq("tour_id", reservation.tour_id)
              .eq("zone", zone)
              .eq("nationality", nationality)
              .eq("pax_type", "Niño")
              .eq("active", true)
              .limit(1)
              .maybeSingle();
            const adultCost = adultVariant?.net_cost ?? 0;
            const childCost = childVariant?.net_cost ?? 0;
            const adultTax = adultVariant?.tax_fee ?? 0;
            const childTax = childVariant?.tax_fee ?? 0;
            totalNetCost = (adultCost * (reservation.pax_adults || 1)) + (childCost * (reservation.pax_children || 0));
            totalTaxFee = (adultTax * (reservation.pax_adults || 1)) + (childTax * (reservation.pax_children || 0));
          }
          const profit = Math.max(0, baseTotalMxn - totalNetCost - totalTaxFee);
          const commissionAmount = profit * rate;
          if (commissionAmount > 0) {
            await (supabase as any).from("commissions").insert({
              seller_id: user.id,
              sale_id: sale.id,
              rate,
              amount_mxn: commissionAmount,
            });
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["cash-movements"] });
      qc.invalidateQueries({ queryKey: ["cash-session-sales"] });
      qc.invalidateQueries({ queryKey: ["pending-reservations"] });
      toast.success("Reserva cobrada — pendiente confirmación del operador");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[100dvh] sm:max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar y Cobrar</DialogTitle>
          <DialogDescription>Reserva {reservation.folio || ""}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ticket Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tour</span>
              <span className="font-medium text-right max-w-[60%]">{reservation.tours?.title || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente</span>
              <span>{reservation.clients?.name || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha</span>
              <span>{reservation.reservation_date} {reservation.reservation_time}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pax</span>
              <span>{reservation.pax_adults || 0} adultos, {reservation.pax_children || 0} menores</span>
            </div>
            {reservation.zone && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Zona</span>
                <span>{reservation.zone}</span>
              </div>
            )}
            {reservation.nationality && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nacionalidad</span>
                <span>{reservation.nationality}</span>
              </div>
            )}
            {(reservation as any).discount_mxn > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmt(baseTotalMxn + (reservation as any).discount_mxn)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento</span>
                  <span>-{fmt((reservation as any).discount_mxn)}</span>
                </div>
              </>
            )}
            <Separator />
            {/* Card fee breakdown */}
            {cardFeeAmount > 0 ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal tour</span>
                  <span>{fmt(baseTotalMxn)}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Comisión tarjeta ({cardFeePercent}%)</span>
                  <span>+{fmt(cardFeeAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total a cobrar</span>
                  <span>{fmt(totalMxn)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{fmt(totalMxn)}</span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Método de pago</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="cash" />
                <Banknote className="h-4 w-4" />
                <span className="text-sm">Efectivo</span>
              </Label>
              <Label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="card" />
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Tarjeta</span>
              </Label>
              <Label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="transfer" />
                <ArrowLeftRight className="h-4 w-4" />
                <span className="text-sm">Transfer</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Currency for cash only */}
          {paymentMethod === "cash" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Divisa</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {currency !== "MXN" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">T.C. → MXN</Label>
                  <Input value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {currency !== "MXN" && paymentMethod === "cash" && (
            <p className="text-xs text-muted-foreground">
              Total en {currency}: {(totalMxn / (parseFloat(exchangeRate) || 1)).toFixed(2)} {currency}
            </p>
          )}

          {/* Cash session warning */}
          {needsCashSession && !isSessionOpen && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">Debes abrir caja antes de cobrar en efectivo.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending || (needsCashSession && !isSessionOpen)}
          >
            {checkoutMutation.isPending ? "Procesando…" : `Cobrar ${fmt(totalMxn)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
