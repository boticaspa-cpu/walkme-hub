import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default function CierreDiario() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === "admin";

  const todayStr = new Date().toISOString().split("T")[0];
  const [rateUSD, setRateUSD] = useState("17.50");
  const [rateEUR, setRateEUR] = useState("19.20");
  const [rateCAD, setRateCAD] = useState("12.80");

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales-today", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .gte("sold_at", `${todayStr}T00:00:00`)
        .lte("sold_at", `${todayStr}T23:59:59`);
      if (error) throw error;
      return data;
    },
  });

  // Aggregate
  const cashMXN = sales.filter((s: any) => s.payment_method === "cash" && s.currency === "MXN").reduce((a: number, s: any) => a + Number(s.total_mxn), 0);
  const cashUSD = sales.filter((s: any) => s.payment_method === "cash" && s.currency === "USD").reduce((a: number, s: any) => a + Number(s.total_mxn) / Number(s.exchange_rate), 0);
  const cashEUR = sales.filter((s: any) => s.payment_method === "cash" && s.currency === "EUR").reduce((a: number, s: any) => a + Number(s.total_mxn) / Number(s.exchange_rate), 0);
  const cashCAD = sales.filter((s: any) => s.payment_method === "cash" && s.currency === "CAD").reduce((a: number, s: any) => a + Number(s.total_mxn) / Number(s.exchange_rate), 0);
  const cardMXN = sales.filter((s: any) => s.payment_method === "card").reduce((a: number, s: any) => a + Number(s.total_mxn), 0);

  const fxToMXN = cashUSD * parseFloat(rateUSD) + cashEUR * parseFloat(rateEUR) + cashCAD * parseFloat(rateCAD);
  const grandTotal = cashMXN + fxToMXN + cardMXN;

  const closeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("daily_closings").insert({
        closing_date: todayStr,
        total_sales: sales.length,
        cash_mxn: cashMXN,
        cash_usd: cashUSD,
        cash_eur: cashEUR,
        cash_cad: cashCAD,
        card_mxn: cardMXN,
        transfer_mxn: 0,
        exchange_rate_usd: parseFloat(rateUSD),
        exchange_rate_eur: parseFloat(rateEUR),
        exchange_rate_cad: parseFloat(rateCAD),
        grand_total_mxn: grandTotal,
        closed_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Día cerrado exitosamente");
      qc.invalidateQueries({ queryKey: ["sales-today"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dateLabel = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-display">Cierre Diario</h1>
        <p className="text-sm text-muted-foreground">Resumen de ventas del día</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>{dateLabel}</span>
            <Badge variant="outline">{sales.length} ventas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Efectivo MXN</p>
                  <p className="text-lg font-bold">{fmt(cashMXN)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Tarjeta MXN</p>
                  <p className="text-lg font-bold">{fmt(cardMXN)}</p>
                </div>
              </div>

              {(cashUSD > 0 || cashEUR > 0 || cashCAD > 0) && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Efectivo en divisas</p>
                  {cashUSD > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span>${cashUSD.toFixed(2)} USD ×</span>
                      <Input className="w-20 h-7 text-xs" value={rateUSD} onChange={(e) => setRateUSD(e.target.value)} />
                      <span className="font-medium">{fmt(cashUSD * parseFloat(rateUSD))}</span>
                    </div>
                  )}
                  {cashEUR > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span>€{cashEUR.toFixed(2)} EUR ×</span>
                      <Input className="w-20 h-7 text-xs" value={rateEUR} onChange={(e) => setRateEUR(e.target.value)} />
                      <span className="font-medium">{fmt(cashEUR * parseFloat(rateEUR))}</span>
                    </div>
                  )}
                  {cashCAD > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span>C${cashCAD.toFixed(2)} CAD ×</span>
                      <Input className="w-20 h-7 text-xs" value={rateCAD} onChange={(e) => setRateCAD(e.target.value)} />
                      <span className="font-medium">{fmt(cashCAD * parseFloat(rateCAD))}</span>
                    </div>
                  )}
                </div>
              )}

              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Gran Total</span>
                <span className="text-2xl font-bold text-primary">{fmt(grandTotal)}</span>
              </div>

              {isAdmin && (
                <Button className="w-full" size="lg" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending || sales.length === 0}>
                  <Lock className="mr-2 h-4 w-4" /> {closeMutation.isPending ? "Cerrando…" : "Cerrar Día"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
