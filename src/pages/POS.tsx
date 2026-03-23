import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Lock, ShoppingCart, DollarSign, Receipt, Clock, Coins, Wallet } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import DateRangeFilter from "@/components/shared/DateRangeFilter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCashSession } from "@/hooks/useCashSession";
import { useAuth } from "@/contexts/AuthContext";
import ReservationCheckout from "@/components/reservations/ReservationCheckout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function POS() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeSession, isSessionOpen, isLoadingSession, movements } = useCashSession();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [checkoutReservation, setCheckoutReservation] = useState<any>(null);

  // Fetch pending reservations
  const { data: pendingReservations = [], isLoading } = useQuery({
    queryKey: ["pending-reservations"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reservations")
        .select("*, tours(title, operator_id), clients(name, phone)")
        .eq("payment_status", "unpaid")
        .order("reservation_date", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch session sales
  const { data: sessionSales = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ["pos-session-sales", activeSession?.id],
    enabled: !!activeSession?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sales")
        .select("*")
        .eq("cash_session_id", activeSession!.id);
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch seller's commission percentage
  const { data: profile } = useQuery({
    queryKey: ["pos-profile-commission", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("commission_percentage")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  // KPI calculations
  const salesTotalMxn = sessionSales.reduce((s: number, sale: any) => s + (sale.total_mxn || 0), 0);
  const salesCount = sessionSales.length;

  const pendingTotal = pendingReservations.reduce((s: number, r: any) => s + (r.total_mxn || 0), 0);
  const pendingCount = pendingReservations.length;

  const commissionPct = profile?.commission_percentage ?? 30;
  const mySalesToday = sessionSales.filter((s: any) => s.sold_by === user?.id);
  const mySalesTotal = mySalesToday.reduce((s: number, sale: any) => s + (sale.total_mxn || 0), 0);
  const myCommission = mySalesTotal * (commissionPct / 100);

  const cashSalesMxn = sessionSales
    .filter((s: any) => s.payment_method === "cash" && s.currency === "MXN")
    .reduce((s: number, sale: any) => s + (sale.total_mxn || 0), 0);
  const cashSalesUsd = sessionSales
    .filter((s: any) => s.payment_method === "cash" && s.currency === "USD")
    .reduce((s: number, sale: any) => s + (sale.total_mxn || 0), 0);
  const cashMovementsNet = movements.reduce((s: number, m: any) => {
    if (m.type === "in_cash") return s + (m.amount_mxn || 0);
    if (m.type === "out_cash" || m.type === "withdrawal") return s - (m.amount_mxn || 0);
    return s;
  }, 0);
  const expectedCash = (activeSession?.opening_float_mxn || 0) + cashSalesMxn + cashMovementsNet;
  const usdSubtitle = cashSalesUsd > 0 ? `+ ${fmt(cashSalesUsd)} (USD equiv.)` : undefined;

  // Filter
  const filtered = pendingReservations.filter((r: any) => {
    if (dateFrom && new Date(r.reservation_date) < dateFrom) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(r.reservation_date) > end) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.folio ?? "").toLowerCase().includes(q) ||
      (r.clients?.name ?? "").toLowerCase().includes(q) ||
      (r.tours?.title ?? "").toLowerCase().includes(q)
    );
  });

  // POS gate
  if (!isLoadingSession && !isSessionOpen) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold">Caja no abierta</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Necesitas abrir caja para poder registrar ventas.
        </p>
        <Button size="lg" onClick={() => navigate("/cierre-diario")}>
          Abrir Caja
        </Button>
      </div>
    );
  }

  const kpiLoading = isLoadingSession || isLoadingSales;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Punto de Venta</h1>
          <p className="text-sm text-muted-foreground">Busca y cobra reservas pendientes</p>
        </div>
        {isSessionOpen && activeSession && (
          <Button variant="outline" size="sm" onClick={() => navigate("/cierre-diario")}>
            <ShoppingCart className="mr-1 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Caja abierta desde </span>
            {new Date(activeSession.opened_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KpiCard
              title="Ventas del Día"
              value={fmt(salesTotalMxn)}
              subtitle={`${salesCount} venta${salesCount !== 1 ? "s" : ""}`}
              icon={Receipt}
            />
            <KpiCard
              title="Reservas Pendientes"
              value={pendingCount}
              subtitle={fmt(pendingTotal)}
              icon={Clock}
            />
            <KpiCard
              title="Mi Comisión"
              value={fmt(myCommission)}
              subtitle={`${commissionPct}% de ${fmt(mySalesTotal)}`}
              icon={Coins}
            />
            <KpiCard
              title="Efectivo en Caja"
              value={fmt(expectedCash)}
              subtitle={usdSubtitle}
              icon={Wallet}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reservas pendientes de cobro</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por folio, cliente o tour..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Receipt} title="No hay ventas pendientes" description="Todas las reservas han sido cobradas" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha Tour</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right sticky right-0 bg-background">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-bold">{r.folio ?? "—"}</TableCell>
                    <TableCell className="text-sm font-medium truncate max-w-[150px]">{r.tours?.title ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{r.clients?.name ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{r.reservation_date}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{fmt(r.total_mxn)}</TableCell>
                    <TableCell className="text-right sticky right-0 bg-background">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setCheckoutReservation(r)}
                      >
                        <DollarSign className="mr-1 h-3 w-3" />
                        Cobrar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {checkoutReservation && (
        <ReservationCheckout
          reservation={checkoutReservation}
          open={!!checkoutReservation}
          onOpenChange={(open) => { if (!open) setCheckoutReservation(null); }}
          onSuccess={() => setCheckoutReservation(null)}
        />
      )}
    </div>
  );
}
