import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, CalendarCheck, Users, TrendingUp, Map, FileText, ArrowRight,
  Wallet, Percent, Receipt, Tag, Package,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default function Dashboard() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const todayStr = new Date().toISOString().split("T")[0];
  const monthStart = todayStr.slice(0, 7) + "-01";
  const monthEnd = (() => {
    const d = new Date();
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return last.toISOString().split("T")[0];
  })();
  const currentMonth = todayStr.slice(0, 7);

  const { data: salesToday = [], isLoading: loadingSales } = useQuery({
    queryKey: ["dashboard-sales-today", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("total_mxn")
        .gte("sold_at", `${todayStr}T00:00:00`).lte("sold_at", `${todayStr}T23:59:59`);
      if (error) throw error;
      return data;
    },
  });

  const { data: reservationsToday = [], isLoading: loadingRes } = useQuery({
    queryKey: ["dashboard-res-today", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("reservations").select("id, status")
        .eq("reservation_date", todayStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: activeLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["dashboard-active-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id")
        .not("status", "in", '("won","lost")');
      if (error) throw error;
      return data;
    },
  });

  const { data: upcomingRes = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ["dashboard-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reservations")
        .select("id, reservation_date, reservation_time, tours(title), clients(name)")
        .eq("status", "scheduled")
        .gte("reservation_date", todayStr)
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentSales = [], isLoading: loadingRecentSales } = useQuery({
    queryKey: ["dashboard-recent-sales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales")
        .select("id, total_mxn, payment_method, currency, profiles:sold_by(full_name)")
        .order("sold_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const kpiLoading = loadingSales || loadingRes || loadingLeads;

  // Admin-only financial KPIs
  const { data: pendingPayables = 0 } = useQuery({
    queryKey: ["dashboard-payables", currentMonth],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("operator_payables")
        .select("amount_mxn")
        .eq("status", "pending")
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd);
      if (error) throw error;
      return (data ?? []).reduce((a: number, r: any) => a + Number(r.amount_mxn), 0);
    },
  });

  const { data: monthCommissions = 0 } = useQuery({
    queryKey: ["dashboard-commissions", currentMonth],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("commissions")
        .select("amount_mxn")
        .gte("created_at", `${monthStart}T00:00:00`)
        .lte("created_at", `${monthEnd}T23:59:59`);
      if (error) throw error;
      return (data ?? []).reduce((a: number, r: any) => a + Number(r.amount_mxn), 0);
    },
  });

  const { data: expenseSummary = { paid: 0, planned: 0 } } = useQuery({
    queryKey: ["dashboard-expenses", currentMonth],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("expense_items")
        .select("status, paid_amount_mxn, estimated_amount_mxn")
        .eq("period_month", currentMonth);
      if (error) throw error;
      const paid = (data ?? []).filter((e: any) => e.status === "paid").reduce((a: number, e: any) => a + Number(e.paid_amount_mxn || 0), 0);
      const planned = (data ?? []).reduce((a: number, e: any) => a + Number(e.estimated_amount_mxn || 0), 0);
      return { paid, planned };
    },
  });

  const totalSalesToday = salesToday.reduce((a, s: any) => a + Number(s.total_mxn), 0);
  const resConfirmed = reservationsToday.filter((r: any) => r.status === "scheduled").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{isAdmin ? "Dashboard General" : "Mi Dashboard"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{isAdmin ? "Resumen de operaciones de hoy" : "Tu resumen personal de hoy"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KpiCard title="Ventas del Día" value={fmt(totalSalesToday)} subtitle="MXN" icon={DollarSign} />
            <KpiCard title="Reservas Hoy" value={reservationsToday.length} subtitle={`${resConfirmed} programadas`} icon={CalendarCheck} />
            <KpiCard title="Leads Activos" value={activeLeads.length} subtitle="sin cerrar" icon={Users} />
          </>
        )}
      </div>

      {/* Admin-only financial KPIs */}
      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <Wallet className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagos Prov. Pendientes</p>
                  <p className="text-lg font-bold">{fmt(pendingPayables)}</p>
                  <p className="text-[10px] text-muted-foreground">Este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Comisiones del Mes</p>
                  <p className="text-lg font-bold">{fmt(monthCommissions)}</p>
                  <p className="text-[10px] text-muted-foreground">Generadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Receipt className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gastos del Mes</p>
                  <p className="text-lg font-bold">{fmt(expenseSummary.paid)}</p>
                  <p className="text-[10px] text-muted-foreground">de {fmt(expenseSummary.planned)} planeado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <Link to="/cotizaciones"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><FileText className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Nueva Cotización</span></CardContent></Card></Link>
        <Link to="/reservas"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><CalendarCheck className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Nueva Reserva</span></CardContent></Card></Link>
        <Link to="/tours"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><Map className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Ver Catálogo</span></CardContent></Card></Link>
        <Link to="/leads"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><Users className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Nuevo Lead</span></CardContent></Card></Link>
        <Link to="/promociones"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><Tag className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Promociones</span></CardContent></Card></Link>
        <Link to="/paquetes-xcaret"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><Package className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Paquetes Xcaret</span></CardContent></Card></Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Próximas Reservas</CardTitle>
            <Link to="/calendario"><Button variant="ghost" size="sm" className="text-xs">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingUpcoming ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              ))
            ) : upcomingRes.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Sin reservas próximas</p> : upcomingRes.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{r.tours?.title ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.clients?.name ?? "—"}</p>
                </div>
                <Badge variant="outline" className="text-xs">{r.reservation_date} {r.reservation_time}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Ventas Recientes</CardTitle>
            <Link to="/pos"><Button variant="ghost" size="sm" className="text-xs">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSales.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Sin ventas recientes</p> : recentSales.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{fmt(Number(s.total_mxn))}</p>
                  <p className="text-xs text-muted-foreground">{s.profiles?.full_name ?? "—"}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">{s.payment_method === "cash" ? `Efectivo ${s.currency}` : "Tarjeta"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
