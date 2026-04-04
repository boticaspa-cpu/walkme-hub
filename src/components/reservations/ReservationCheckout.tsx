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
import { AlertTriangle, Banknote, CreditCard, ArrowLeftRight, Info } from "lucide-react";

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

  // Split payment state
  const [splitMode, setSplitMode] = useState<"full" | "partial">("full");
  const [depositAmount, setDepositAmount] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");

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

  // Fetch operator info to check fee_collection_mode
  const { data: operatorInfo } = useQuery({
    queryKey: ["operator-checkout", reservation?.tours?.operator_id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("operators")
        .select("id, fee_collection_mode, base_currency, exchange_rate")
        .eq("id", reservation.tours.operator_id)
        .single();
      return data;
    },
    enabled: open && !!reservation?.tours?.operator_id,
  });

  const isOnSite = operatorInfo?.fee_collection_mode === "on_site";

  // Fetch net_cost for split payment calculation
  const { data: netCostData } = useQuery({
    queryKey: ["net-cost-checkout", reservation?.tour_id, reservation?.zone, reservation?.nationality],
    queryFn: async () => {
      const pkgName = reservation.package_name || "";
      const { data: adultVariant } = await (supabase as any)
        .from("tour_price_variants")
        .select("net_cost, tax_fee")
        .eq("tour_id", reservation.tour_id)
        .eq("zone", reservation.zone || "")
        .eq("nationality", reservation.nationality || "")
        .eq("pax_type", "Adulto")
        .eq("package_name", pkgName)
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      const { data: childVariant } = await (supabase as any)
        .from("tour_price_variants")
        .select("net_cost, tax_fee")
        .eq("tour_id", reservation.tour_id)
        .eq("zone", reservation.zone || "")
        .eq("nationality", reservation.nationality || "")
        .eq("pax_type", "Menor")
        .eq("package_name", pkgName)
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      const adultCost = adultVariant?.net_cost ?? 0;
      const childCost = childVariant?.net_cost ?? 0;
      const adultTax = adultVariant?.tax_fee ?? 0;
      const childTax = childVariant?.tax_fee ?? 0;
      const totalNetCost = (adultCost * (reservation.pax_adults || 1)) + (childCost * (reservation.pax_children || 0));
      const totalTaxFee = (adultTax * (reservation.pax_adults || 1)) + (childTax * (reservation.pax_children || 0));
      return { totalNetCost, totalTaxFee, adultCost, childCost, adultTax, childTax };
    },
    enabled: open && isOnSite && !!reservation?.tour_id,
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
        .select("tour_id, zone, nationality, pax_type, sale_price, package_name")
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
      toursForPricing as any,
      reservation.package_name || undefined
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
  const needsCashSession = paymentMethod === "cash";

  // Initialize deposit/balance when on_site and we have net cost data
  useEffect(() => {
    if (isOnSite && netCostData && baseTotalMxn > 0) {
      const suggestedDeposit = Math.max(0, baseTotalMxn - netCostData.totalNetCost);
      const suggestedBalance = netCostData.totalNetCost;
      setDepositAmount(suggestedDeposit.toFixed(2));
      setBalanceAmount(suggestedBalance.toFixed(2));
    }
  }, [isOnSite, netCostData, baseTotalMxn]);

  const parsedDeposit = parseFloat(depositAmount) || 0;
  const parsedBalance = parseFloat(balanceAmount) || 0;

  // The amount the agency actually charges
  const isPartialMode = isOnSite && splitMode === "partial";
  const chargeAmount = isPartialMode ? parsedDeposit : baseTotalMxn;
  const balanceCurrency = operatorInfo?.base_currency || "MXN";

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (paymentMethod !== "cash" && currency !== "MXN") {
        throw new Error("Pagos con tarjeta/transferencia solo aceptan MXN");
      }

      if (needsCashSession && !isSessionOpen) {
        throw new Error("Debes abrir caja para cobrar en efectivo");
      }

      if (isPartialMode && parsedDeposit <= 0) {
        throw new Error("El depósito debe ser mayor a $0");
      }

      const er = currency !== "MXN" ? parseFloat(exchangeRate) || 1 : 1;

      // 0. Fetch reservation_items for accurate sale_items
      const { data: resItems } = await supabase
        .from("reservation_items")
        .select("*")
        .eq("reservation_id", reservation.id);

      const hasResItems = resItems && resItems.length > 0;
      const resDiscount = reservation.discount_mxn || 0;

      // Compute real subtotal from items (before discount)
      const itemsSubtotal = hasResItems
        ? resItems.reduce((s: number, i: any) => s + (i.subtotal_mxn || 0), 0)
        : baseTotalMxn + resDiscount;

      // 1. Create sale — total = deposit (what the agency actually collects)
      const saleTotal = isPartialMode ? parsedDeposit : baseTotalMxn;
      const { data: sale, error: saleErr } = await (supabase as any).from("sales").insert({
        reservation_id: reservation.id,
        client_id: reservation.client_id || null,
        payment_method: paymentMethod,
        currency,
        exchange_rate: er,
        subtotal_mxn: isPartialMode ? saleTotal : itemsSubtotal,
        discount_mxn: isPartialMode ? 0 : resDiscount,
        total_mxn: saleTotal,
        sold_by: user?.id,
        cash_session_id: activeSession?.id || null,
      }).select("id").single();
      if (saleErr) throw saleErr;

      // 2. Create sale_items from reservation_items when available
      if (hasResItems) {
        const saleItems = resItems.map((ri: any) => ({
          sale_id: sale.id,
          tour_id: ri.tour_id,
          qty: (ri.qty_adults || 0) + (ri.qty_children || 0),
          qty_adults: ri.qty_adults || 0,
          qty_children: ri.qty_children || 0,
          unit_price_mxn: ri.unit_price_mxn || 0,
          unit_price_child_mxn: ri.unit_price_child_mxn || 0,
          tour_date: ri.tour_date || reservation.reservation_date,
        }));
        await (supabase as any).from("sale_items").insert(saleItems);
      } else {
        // Fallback for old reservations without items
        await (supabase as any).from("sale_items").insert({
          sale_id: sale.id,
          tour_id: reservation.tour_id,
          qty: (reservation.pax_adults || 0) + (reservation.pax_children || 0),
          qty_adults: reservation.pax_adults || 1,
          qty_children: reservation.pax_children || 0,
          unit_price_mxn: saleTotal / Math.max(1, reservation.pax_adults || 1),
          unit_price_child_mxn: 0,
          tour_date: reservation.reservation_date,
        });
      }

      // 3. Create cash_movement if session open — only for what the agency charges
      if (activeSession?.id) {
        const movType = paymentMethod === "card" ? "sale_card" : paymentMethod === "transfer" ? "sale_transfer" : "sale_cash";
        await (supabase as any).from("cash_movements").insert({
          session_id: activeSession.id,
          type: movType,
          amount_mxn: saleTotal,
          amount_fx: currency !== "MXN" ? saleTotal / er : null,
          currency_fx: currency !== "MXN" ? currency : null,
          reference: `Reserva ${reservation.folio || reservation.id.slice(0, 8)}`,
          created_by: user?.id,
        });
      }

      // 4. Update reservation — partial if partial mode, paid otherwise
      const updateData: any = {
        payment_status: isPartialMode ? "partial" : "paid",
        sale_id: sale.id,
      };
      if (isPartialMode) {
        updateData.deposit_mxn = parsedDeposit;
        updateData.balance_mxn = parsedBalance;
        updateData.balance_currency = balanceCurrency;
      }
      await (supabase as any).from("reservations").update(updateData).eq("id", reservation.id);

      // 5. Create operator_payable if tour has operator
      if (reservation.tours?.operator_id) {
        const { data: operator } = await (supabase as any)
          .from("operators")
          .select("id, payment_rules, base_currency, exchange_rate")
          .eq("id", reservation.tours.operator_id)
          .single();

        if (operator && !isPartialMode) {
          // Compute net cost in operator currency
          let operatorCostMxn = 0;
          if (netCostData) {
            operatorCostMxn = netCostData.totalNetCost;
          } else {
            // Fallback: estimate from variants
            operatorCostMxn = baseTotalMxn * 0.70;
          }
          const opExRate = operator.exchange_rate || 17.5;
          const amountInCurrency = operator.base_currency !== "MXN"
            ? operatorCostMxn / opExRate
            : operatorCostMxn;

          const tourTitle = reservation.tours?.title || "";
          const folio = reservation.folio || reservation.id.slice(0, 8);

          await (supabase as any).from("operator_payables").insert({
            operator_id: operator.id,
            sale_id: sale.id,
            sale_date: reservation.reservation_date,
            amount_currency: operator.base_currency || "USD",
            amount_value: parseFloat(amountInCurrency.toFixed(2)),
            equivalent_mxn: parseFloat(operatorCostMxn.toFixed(2)),
            exchange_rate_used: opExRate,
            notes: `Reserva ${folio} - ${tourTitle}`.trim(),
            status: "pending",
          });
        }
      }

      // 6. Auto-generate seller commission based on PROFIT
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

          if (isPartialMode && netCostData) {
            // For partial, net cost goes to operator via client — profit = deposit
            totalNetCost = 0;
            totalTaxFee = 0;
          } else if (reservation.tour_id) {
            const zone = reservation.zone || "";
            const nationality = reservation.nationality || "";
            const commPkgName = reservation.package_name || "";
            const { data: adultVariant } = await (supabase as any)
              .from("tour_price_variants")
              .select("net_cost, tax_fee")
              .eq("tour_id", reservation.tour_id)
              .eq("zone", zone)
              .eq("nationality", nationality)
              .eq("pax_type", "Adulto")
              .eq("package_name", commPkgName)
              .eq("active", true)
              .limit(1)
              .maybeSingle();
            const { data: childVariant } = await (supabase as any)
              .from("tour_price_variants")
              .select("net_cost, tax_fee")
              .eq("tour_id", reservation.tour_id)
              .eq("zone", zone)
              .eq("nationality", nationality)
              .eq("pax_type", "Menor")
              .eq("package_name", commPkgName)
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

          const profit = isPartialMode
            ? Math.max(0, parsedDeposit - cardFeeAmount)
            : Math.max(0, baseTotalMxn - totalNetCost - totalTaxFee - cardFeeAmount);
          const commissionAmount = profit * rate;
          if (commissionAmount > 0) {
            await (supabase as any).from("commissions").insert({
              seller_id: user.id,
              sale_id: sale.id,
              rate,
              amount_mxn: commissionAmount,
              card_fee_mxn: cardFeeAmount,
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
      toast.success(isPartialMode
        ? `Depósito cobrado — balance de ${fmt(parsedBalance)} pendiente al abordar`
        : "Reserva cobrada — pendiente confirmación del operador"
      );
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
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{fmt(baseTotalMxn)}</span>
            </div>
            {paymentMethod === "card" && cardFeePercent > 0 && (
              <p className="text-xs text-muted-foreground">
                Incluye absorción de comisión tarjeta ({cardFeePercent}%)
              </p>
            )}
          </div>

          {/* ── SPLIT PAYMENT MODE SELECTOR (on_site) ── */}
          {isOnSite && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de cobro</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitMode("full")}
                  className={`rounded-lg border p-3 text-sm font-medium text-center transition-colors ${
                    splitMode === "full"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Pago completo
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode("partial")}
                  className={`rounded-lg border p-3 text-sm font-medium text-center transition-colors ${
                    splitMode === "partial"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Pago parcial
                </button>
              </div>

              {splitMode === "partial" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                    <Info className="h-4 w-4" />
                    Cobro parcial — Pago al operador al abordar
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Depósito (cobro agencia)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={depositAmount}
                        onChange={(e) => {
                          setDepositAmount(e.target.value);
                          const dep = parseFloat(e.target.value) || 0;
                          setBalanceAmount(Math.max(0, baseTotalMxn - dep).toFixed(2));
                        }}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Balance (pago al operador)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={balanceAmount}
                        onChange={(e) => {
                          setBalanceAmount(e.target.value);
                          const bal = parseFloat(e.target.value) || 0;
                          setDepositAmount(Math.max(0, baseTotalMxn - bal).toFixed(2));
                        }}
                        className="font-mono"
                      />
                      {balanceCurrency !== "MXN" && (
                        <p className="text-[11px] text-muted-foreground">
                          Moneda del operador: {balanceCurrency}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-blue-700">
                    El cliente pagará <strong>{fmt(parsedBalance)}</strong> al operador al abordar el tour.
                    Solo se cobrará <strong>{fmt(parsedDeposit)}</strong> como depósito ahora.
                  </p>
                </div>
              )}
            </div>
          )}

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
              Total en {currency}: {(chargeAmount / (parseFloat(exchangeRate) || 1)).toFixed(2)} {currency}
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
            {checkoutMutation.isPending
              ? "Procesando…"
              : isPartialMode
                ? `Cobrar depósito ${fmt(chargeAmount)}`
                : `Cobrar ${fmt(chargeAmount)}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
