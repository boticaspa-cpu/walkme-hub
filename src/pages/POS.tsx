import { useState } from "react";
import { Minus, Plus, Trash2, Tag, CreditCard, Banknote, DollarSign, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import PackageSelectDialog, { TourPackage } from "@/components/pos/PackageSelectDialog";
import VariantSelectDialog, { PriceVariant } from "@/components/pos/VariantSelectDialog";

interface CartItem {
  tour_id: string;
  name: string;
  qty: number;
  unitPrice: number;
  costUsd: number;
  feesUsd: number;
  publicPriceUsd: number;
  taxUsd: number;
  packageId?: string;
  packageName?: string;
  packageIncludes?: string[];
  // Variant fields
  variantId?: string;
  zone?: string;
  isMexican?: boolean;
  priceChildMxn?: number;
  qtyAdults?: number;
  qtyChildren?: number;
}

export default function POS() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [currency, setCurrency] = useState("MXN");
  const [exchangeRate, setExchangeRate] = useState("17.50");
  const [clientId, setClientId] = useState("");

  // mini-dialog client
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "" });

  // package selection
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [pendingTour, setPendingTour] = useState<any>(null);
  const [pendingPackages, setPendingPackages] = useState<TourPackage[]>([]);

  // variant selection
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [pendingVariants, setPendingVariants] = useState<PriceVariant[]>([]);
  const [pendingVariantTour, setPendingVariantTour] = useState<any>(null);
  const [pendingPackageNames, setPendingPackageNames] = useState<Record<string, string>>({});
  // Load admin exchange rate from settings
  const { data: adminExchangeRate = 17.5 } = useQuery({
    queryKey: ["settings-exchange-usd"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings" as any)
        .select("value")
        .eq("key", "exchange_rate_usd")
        .single();
      if (error) return 17.5;
      return parseFloat((data as any).value) || 17.5;
    },
  });

  const { data: tours = [] } = useQuery({
    queryKey: ["tours-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("id, title, price_mxn, price_adult_usd, suggested_price_mxn, mandatory_fees_usd, public_price_adult_usd, tax_adult_usd, child_age_min, child_age_max" as any)
        .eq("active", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Load all active price variants (role-based)
  const { role } = useAuth();
  const variantTable = role === "admin" ? "tour_price_variants" : "tour_price_variants_seller";
  const { data: allVariants = [] } = useQuery({
    queryKey: ["tour-price-variants-active", variantTable],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(variantTable)
        .select("*")
        .eq("active", true);
      if (error) throw error;
      return (data || []) as unknown as PriceVariant[];
    },
  });

  // Load all active tour packages
  const { data: allPackages = [] } = useQuery({
    queryKey: ["tour-packages-active"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tour_packages")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as TourPackage[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  // === Derived calculations ===
  const subtotal = cart.reduce((s, i) => {
    if (i.variantId) {
      return s + (i.unitPrice * (i.qtyAdults || 0)) + ((i.priceChildMxn || 0) * (i.qtyChildren || 0));
    }
    return s + i.unitPrice * i.qty;
  }, 0);
  const promoDiscount = cart.length >= 3 ? subtotal * 0.15 : 0;
  const grandTotal = subtotal - promoDiscount;

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  const fmtUsd = (n: number) => `$${n.toFixed(2)} USD`;

  const addToCartDirect = (tour: any) => {
    const unitPrice = tour.suggested_price_mxn > 0 ? tour.suggested_price_mxn : tour.price_mxn;
    setCart(prev => {
      const existing = prev.find(i => i.tour_id === tour.id && !i.packageId);
      if (existing) return prev.map(i => i.tour_id === tour.id && !i.packageId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        tour_id: tour.id,
        name: tour.title,
        qty: 1,
        unitPrice,
        costUsd: tour.price_adult_usd || 0,
        feesUsd: tour.mandatory_fees_usd || 0,
        publicPriceUsd: tour.public_price_adult_usd || 0,
        taxUsd: tour.tax_adult_usd || 0,
      }];
    });
  };

  const addPackageToCart = (tour: any, pkg: TourPackage) => {
    const unitPrice = pkg.price_adult_mxn;
    const cartKey = `${tour.id}-${pkg.id}`;
    setCart(prev => {
      const existing = prev.find(i => i.tour_id === tour.id && i.packageId === pkg.id);
      if (existing) return prev.map(i => i.tour_id === tour.id && i.packageId === pkg.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        tour_id: tour.id,
        name: `${tour.title} — ${pkg.name}`,
        qty: 1,
        unitPrice,
        costUsd: pkg.cost_adult_usd || 0,
        feesUsd: pkg.service_type === "entry_only" ? 0 : (pkg.mandatory_fees_usd || 0),
        publicPriceUsd: pkg.public_price_adult_usd || 0,
        taxUsd: pkg.tax_adult_usd || 0,
        packageId: pkg.id,
        packageName: pkg.name,
        packageIncludes: pkg.includes,
      }];
    });
    setPackageDialogOpen(false);
  };

  const handleTourClick = (tour: any) => {
    // Check if tour has variants
    const tourVariants = allVariants.filter((v: PriceVariant) => v.tour_id === tour.id);
    if (tourVariants.length > 0) {
      // Use variant lookup flow
      setPendingVariantTour(tour);
      setPendingVariants(tourVariants);
      // Build package name map
      const tourPkgs = allPackages.filter((p: TourPackage) => p.tour_id === tour.id);
      const nameMap: Record<string, string> = {};
      tourPkgs.forEach((p: TourPackage) => { nameMap[p.id] = p.name; });
      setPendingPackageNames(nameMap);
      setVariantDialogOpen(true);
      return;
    }

    // Fallback: package flow or direct
    const tourPkgs = allPackages.filter((p: TourPackage) => p.tour_id === tour.id);
    if (tourPkgs.length > 0) {
      setPendingTour(tour);
      setPendingPackages(tourPkgs);
      setPackageDialogOpen(true);
    } else {
      addToCartDirect(tour);
    }
  };

  const addVariantToCart = (adultVariant: PriceVariant, childVariant: PriceVariant | null, qtyAdults: number, qtyChildren: number) => {
    if (!pendingVariantTour) return;
    const tour = pendingVariantTour;
    const label = [
      tour.title,
      adultVariant.zone,
      adultVariant.nationality,
    ].filter(Boolean).join(" — ");

    const adultPrice = adultVariant.sale_price;
    const childPrice = childVariant?.sale_price || 0;

    setCart(prev => [...prev, {
      tour_id: tour.id,
      name: label,
      qty: qtyAdults + qtyChildren,
      unitPrice: adultPrice,
      costUsd: 0,
      feesUsd: 0,
      publicPriceUsd: 0,
      taxUsd: 0,
      variantId: adultVariant.id,
      zone: adultVariant.zone,
      isMexican: adultVariant.nationality === "Mexicano",
      priceChildMxn: childPrice,
      qtyAdults,
      qtyChildren,
    }]);
  };

  const cartItemKey = (item: CartItem) => `${item.tour_id}-${item.packageId || "direct"}-${item.variantId || ""}`;
  const updateQty = (item: CartItem, delta: number) => {
    const key = cartItemKey(item);
    setCart(prev => prev.map(i => cartItemKey(i) === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };
  const removeItem = (item: CartItem) => {
    const key = cartItemKey(item);
    setCart(prev => prev.filter(i => cartItemKey(i) !== key));
  };

  const saleMutation = useMutation({
    mutationFn: async () => {
      const er = currency !== "MXN" ? parseFloat(exchangeRate) || 1 : 1;
      const { data: sale, error } = await supabase.from("sales").insert({
        client_id: clientId || null,
        payment_method: paymentMethod,
        currency,
        exchange_rate: er,
        subtotal_mxn: subtotal,
        discount_mxn: promoDiscount,
        total_mxn: grandTotal,
        sold_by: user?.id,
      }).select("id").single();
      if (error) throw error;

      const { error: ie } = await (supabase as any).from("sale_items").insert(
        cart.map(i => ({
          sale_id: sale.id,
          tour_id: i.tour_id,
          qty: i.variantId ? (i.qtyAdults || 0) + (i.qtyChildren || 0) : i.qty,
          qty_adults: i.qtyAdults || i.qty,
          qty_children: i.qtyChildren || 0,
          unit_price_mxn: i.unitPrice,
          unit_price_child_mxn: i.priceChildMxn || 0,
          tour_package_id: i.packageId || null,
          tour_price_variant_id: i.variantId || null,
        }))
      );
      if (ie) throw ie;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venta registrada");
      setCart([]);
      setClientId("");
      setCurrency("MXN");
      setPaymentMethod("cash");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveClientMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("clients")
        .insert({ name: clientForm.name, phone: clientForm.phone, email: clientForm.email || null, created_by: user?.id })
        .select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      setClientId(data.id);
      toast.success("Cliente creado");
      setClientDialogOpen(false);
      setClientForm({ name: "", phone: "", email: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display">Punto de Venta</h1>
        <p className="text-sm text-muted-foreground">Carrito inteligente con promociones automáticas</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Tours */}
        <div className="lg:col-span-3 space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Agregar Tours</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {tours.map((t: any) => {
                  const hasVariants = allVariants.some((v: PriceVariant) => v.tour_id === t.id);
                  const hasPkgs = allPackages.some((p: TourPackage) => p.tour_id === t.id);
                  const displayPrice = t.suggested_price_mxn > 0 ? t.suggested_price_mxn : t.price_mxn;
                  const label = hasVariants ? "Seleccionar" : hasPkgs ? "Ver paquetes" : fmt(displayPrice);
                  const hint = hasVariants ? "(variantes)" : hasPkgs ? "(paquetes)" : null;
                  return (
                    <button key={t.id} onClick={() => handleTourClick(t)} className="flex items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{t.title}</span>
                        {hint && <span className="ml-1.5 text-[10px] text-muted-foreground">{hint}</span>}
                      </div>
                      <span className="text-sm font-bold text-primary">{label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Carrito</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Carrito vacío</p>
              ) : (
                <>
                  {/* Client selector */}
                  <div className="space-y-1">
                    <Label className="text-xs">Cliente</Label>
                    <div className="flex gap-2">
                      <Select value={clientId} onValueChange={setClientId}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Opcional" /></SelectTrigger>
                        <SelectContent>
                          {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="button" size="icon" variant="outline" onClick={() => setClientDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  <Separator />

                  {cart.map(item => {
                    const agencyPerPax = item.publicPriceUsd * adminExchangeRate;
                    const boardingPerPax = (item.taxUsd + item.feesUsd) * adminExchangeRate;
                    const boardingUsdPerPax = item.taxUsd + item.feesUsd;

                    return (
                      <div key={cartItemKey(item)} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            {item.variantId ? (
                              <p className="text-xs text-muted-foreground">
                                {item.qtyAdults}A × {fmt(item.unitPrice)} + {item.qtyChildren}N × {fmt(item.priceChildMxn || 0)}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">{fmt(item.unitPrice)} c/u</p>
                            )}
                          </div>
                          {!item.variantId && (
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item, -1)}><Minus className="h-3 w-3" /></Button>
                              <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item, 1)}><Plus className="h-3 w-3" /></Button>
                            </div>
                          )}
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item)}><Trash2 className="h-3 w-3" /></Button>
                          <span className="text-sm font-semibold w-20 text-right">
                            {fmt(item.variantId
                              ? (item.unitPrice * (item.qtyAdults || 0)) + ((item.priceChildMxn || 0) * (item.qtyChildren || 0))
                              : item.unitPrice * item.qty
                            )}
                          </span>
                        </div>

                        {/* Package includes */}
                        {item.packageIncludes && item.packageIncludes.length > 0 && (
                          <div className="ml-0 px-2 py-1 rounded bg-muted/30 text-[11px] text-muted-foreground">
                            Incluye: {item.packageIncludes.join(" · ")}
                          </div>
                        )}

                        {/* Desglose agencia vs abordar */}
                        {(item.publicPriceUsd > 0) && (
                          <div className="rounded bg-muted/50 px-2 py-1.5 ml-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-[11px] text-muted-foreground">
                                Agencia: ${item.publicPriceUsd} USD × T.C. ${adminExchangeRate} = {fmt(agencyPerPax)}
                              </span>
                            </div>
                            {boardingUsdPerPax > 0 && (
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-[11px] text-muted-foreground">
                                  Al abordar: (${item.taxUsd} tax + ${item.feesUsd} fees) × T.C. ${adminExchangeRate} = {fmt(boardingPerPax)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {promoDiscount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">¡Paquete 3+ tours! -15% aplicado ({fmt(promoDiscount)})</span>
                    </div>
                  )}

                  <Separator />

                  {/* Desglose de totales */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">{fmt(subtotal)}</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento</span>
                        <span>-{fmt(promoDiscount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-bold pt-1">
                      <span>TOTAL FINAL</span>
                      <span>{fmt(grandTotal)}</span>
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs">Método de pago</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash"><span className="flex items-center gap-2"><Banknote className="h-3.5 w-3.5" /> Efectivo</span></SelectItem>
                        <SelectItem value="card"><span className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Tarjeta (solo MXN)</span></SelectItem>
                      </SelectContent>
                    </Select>
                    {paymentMethod === "cash" && (
                      <div className="flex gap-2">
                        <div className="flex-1">
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
                          <div className="flex-1">
                            <Label className="text-xs">T.C. Venta → MXN</Label>
                            <Input value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
                          </div>
                        )}
                      </div>
                    )}
                    {currency !== "MXN" && paymentMethod === "cash" && (
                      <p className="text-xs text-muted-foreground">Total en {currency}: {(grandTotal / parseFloat(exchangeRate || "1")).toFixed(2)} {currency}</p>
                    )}
                  </div>

                  <Button className="w-full mt-2" size="lg" onClick={() => saleMutation.mutate()} disabled={saleMutation.isPending}>
                    {saleMutation.isPending ? "Registrando…" : `Registrar Venta — ${fmt(grandTotal)}`}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mini-dialog Nuevo Cliente */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>Crea un cliente rápido para esta venta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={clientForm.name} onChange={(e) => setClientForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={clientForm.phone} onChange={(e) => setClientForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={clientForm.email} onChange={(e) => setClientForm(p => ({ ...p, email: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveClientMutation.mutate()} disabled={saveClientMutation.isPending || !clientForm.name.trim()}>
              {saveClientMutation.isPending ? "Guardando…" : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package Selection Dialog */}
      {pendingTour && (
        <PackageSelectDialog
          open={packageDialogOpen}
          onOpenChange={setPackageDialogOpen}
          tourTitle={pendingTour.title}
          packages={pendingPackages}
          onSelect={(pkg) => addPackageToCart(pendingTour, pkg)}
        />
      )}

      {/* Variant Selection Dialog */}
      {pendingVariantTour && (
        <VariantSelectDialog
          open={variantDialogOpen}
          onOpenChange={setVariantDialogOpen}
          tourTitle={pendingVariantTour.title}
          childAgeMin={pendingVariantTour.child_age_min ?? 4}
          childAgeMax={pendingVariantTour.child_age_max ?? 10}
          variants={pendingVariants}
          onAdd={addVariantToCart}
        />
      )}
    </div>
  );
}
