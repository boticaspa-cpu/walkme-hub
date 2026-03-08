import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Lock, ShoppingCart, DollarSign } from "lucide-react";
import DateRangeFilter from "@/components/shared/DateRangeFilter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCashSession } from "@/hooks/useCashSession";
import ReservationCheckout from "@/components/reservations/ReservationCheckout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function POS() {
  const navigate = useNavigate();
  const { activeSession, isSessionOpen, isLoadingSession } = useCashSession();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [checkoutReservation, setCheckoutReservation] = useState<any>(null);

  // Fetch pending reservations (scheduled/unpaid)
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

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

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

  // POS gate: block if no cash session open
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
            <p className="p-6 text-sm text-muted-foreground">Cargando reservas…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">No hay reservas pendientes de cobro</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha Tour</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-bold">{r.folio ?? "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{r.tours?.title ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{r.clients?.name ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{r.reservation_date}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{fmt(r.total_mxn)}</TableCell>
                    <TableCell className="text-right">
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

      {/* Checkout Dialog */}
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
