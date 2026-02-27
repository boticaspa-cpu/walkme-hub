import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const statusBadges: Record<string, React.ReactNode> = {
  scheduled: <Badge className="bg-primary/10 text-primary border-0 text-xs">Programada</Badge>,
  completed: <Badge className="bg-green-100 text-green-700 border-0 text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />Completada</Badge>,
  cancelled: <Badge className="bg-destructive/10 text-destructive border-0 text-xs"><XCircle className="mr-1 h-3 w-3" />Cancelada</Badge>,
  no_show: <Badge className="bg-warning/10 text-warning border-0 text-xs"><AlertTriangle className="mr-1 h-3 w-3" />No Show</Badge>,
};

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function Calendario() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === "admin";

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = toDateStr(today);
  const tomorrowStr = toDateStr(tomorrow);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["calendar-reservations", todayStr, tomorrowStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, tours(title), clients(name)")
        .in("reservation_date", [todayStr, tomorrowStr])
        .order("reservation_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").update({ status: "completed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-reservations"] });
      toast.success("Reserva completada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const todayRes = reservations.filter((r: any) => r.reservation_date === todayStr);
  const tomorrowRes = reservations.filter((r: any) => r.reservation_date === tomorrowStr);

  const ReservationCard = ({ r }: { r: any }) => (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-muted-foreground">{r.folio ?? "—"}</span>
          {statusBadges[r.status] ?? <Badge variant="outline" className="text-xs">{r.status}</Badge>}
        </div>
        <p className="text-sm font-semibold">{r.tours?.title ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{r.clients?.name ?? "—"} ({r.pax} pax)</p>
        <p className="text-xs text-muted-foreground">🕐 {r.reservation_time || "—"}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Button size="sm" variant="outline" className="text-xs h-7" disabled>
          <Send className="mr-1 h-3 w-3" /> Recordatorio
        </Button>
        {isAdmin && r.status === "scheduled" && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => completeMutation.mutate(r.id)} disabled={completeMutation.isPending}>
            <CheckCircle2 className="mr-1 h-3 w-3" /> Completar
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display">Calendario Operativo</h1>
        <p className="text-sm text-muted-foreground">Tours programados y seguimiento</p>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Hoy — {today.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayRes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin reservas para hoy</p>
              ) : todayRes.map((r: any) => <ReservationCard key={r.id} r={r} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                Mañana
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tomorrowRes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin reservas para mañana</p>
              ) : tomorrowRes.map((r: any) => <ReservationCard key={r.id} r={r} />)}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
