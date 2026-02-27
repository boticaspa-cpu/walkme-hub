import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, CalendarCheck, Users, TrendingUp, Map, ShoppingCart, ArrowRight,
} from "lucide-react";
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

  const { data: salesToday = [] } = useQuery({
    queryKey: ["dashboard-sales-today", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("total_mxn")
        .gte("sold_at", `${todayStr}T00:00:00`).lte("sold_at", `${todayStr}T23:59:59`);
      if (error) throw error;
      return data;
    },
  });

  const { data: reservationsToday = [] } = useQuery({
    queryKey: ["dashboard-res-today", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("reservations").select("id, status")
        .eq("reservation_date", todayStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: activeLeads = [] } = useQuery({
    queryKey: ["dashboard-active-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id")
        .not("status", "in", '("won","lost")');
      if (error) throw error;
      return data;
    },
  });

  const { data: upcomingRes = [] } = useQuery({
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

  const { data: recentSales = [] } = useQuery({
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

  const totalSalesToday = salesToday.reduce((a, s: any) => a + Number(s.total_mxn), 0);
  const resConfirmed = reservationsToday.filter((r: any) => r.status === "scheduled").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{isAdmin ? "Dashboard General" : "Mi Dashboard"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{isAdmin ? "Resumen de operaciones de hoy" : "Tu resumen personal de hoy"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas del Día" value={fmt(totalSalesToday)} subtitle="MXN" icon={DollarSign} />
        <KpiCard title="Reservas Hoy" value={reservationsToday.length} subtitle={`${resConfirmed} programadas`} icon={CalendarCheck} />
        <KpiCard title="Leads Activos" value={activeLeads.length} subtitle="sin cerrar" icon={Users} />
        <KpiCard title="Ventas Hoy" value={salesToday.length} subtitle="transacciones" icon={TrendingUp} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/pos"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><ShoppingCart className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Nueva Venta</span></CardContent></Card></Link>
        <Link to="/reservas"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><CalendarCheck className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Nueva Reserva</span></CardContent></Card></Link>
        <Link to="/tours"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><Map className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Ver Catálogo</span></CardContent></Card></Link>
        <Link to="/leads"><Card className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-colors"><CardContent className="flex items-center gap-3 p-4"><Users className="h-5 w-5 text-primary" /><span className="font-medium text-sm">Nuevo Lead</span></CardContent></Card></Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Próximas Reservas</CardTitle>
            <Link to="/calendario"><Button variant="ghost" size="sm" className="text-xs">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingRes.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Sin reservas próximas</p> : upcomingRes.map((r: any) => (
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
