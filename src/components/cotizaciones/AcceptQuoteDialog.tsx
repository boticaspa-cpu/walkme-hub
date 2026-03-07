import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
}

export default function AcceptQuoteDialog({ open, onOpenChange, quote }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reservationDate, setReservationDate] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["quote-items-accept", quote?.id],
    queryFn: async () => {
      const { data } = await supabase.from("quote_items").select("*, tours(title)").eq("quote_id", quote.id);
      return data ?? [];
    },
    enabled: !!quote?.id && open,
  });

  // Pre-fill date from first item if available
  useEffect(() => {
    if (items.length > 0 && (items[0] as any).tour_date) {
      setReservationDate((items[0] as any).tour_date);
    }
  }, [items]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!reservationDate) throw new Error("Selecciona una fecha de viaje");
      if (!items.length) throw new Error("La cotización no tiene items");

      const total = items.reduce(
        (s: number, i: any) => s + i.qty_adults * i.unit_price_mxn + i.qty_children * i.unit_price_child_mxn,
        0
      );
      const totalPax = items.reduce((s: number, i: any) => s + i.qty_adults + i.qty_children, 0);
      const firstItem = items[0] as any;

      // 1. Create the reservation
      const { data: reservation, error: rErr } = await supabase
        .from("reservations")
        .insert({
          client_id: quote.client_id || null,
          tour_id: firstItem.tour_id || null,
          reservation_date: reservationDate,
          pax: totalPax,
          pax_adults: firstItem.qty_adults,
          pax_children: firstItem.qty_children,
          zone: firstItem.zone || "",
          nationality: firstItem.nationality || "",
          total_mxn: total,
          status: "confirmed",
          payment_status: "unpaid",
          notes: quote.notes || null,
          created_by: user?.id,
        })
        .select("id")
        .single();

      if (rErr) throw new Error(`Error al crear la reserva: ${rErr.message}`);

      const reservationId = reservation.id;

      // 2. Insert all quote items as reservation_items
      const reservationItems = items.map((i: any) => ({
        reservation_id: reservationId,
        tour_id: i.tour_id || null,
        tour_date: i.tour_date || reservationDate,
        qty_adults: i.qty_adults,
        qty_children: i.qty_children,
        unit_price_mxn: i.unit_price_mxn,
        unit_price_child_mxn: i.unit_price_child_mxn,
        subtotal_mxn: i.qty_adults * i.unit_price_mxn + i.qty_children * i.unit_price_child_mxn,
        zone: i.zone || "",
        nationality: i.nationality || "",
        package_name: i.package_name || null,
      }));

      // 2. Insert reservation_items (best-effort — table may not exist yet)
      const { error: riErr } = await supabase.from("reservation_items").insert(reservationItems);
      if (riErr) {
        console.warn("reservation_items insert skipped:", riErr.message);
      }

      // 3. Mark quote as accepted and link to reservation
      const { error: qErr } = await supabase
        .from("quotes")
        .update({ status: "accepted", reservation_id: reservationId })
        .eq("id", quote.id);

      if (qErr) {
        // Rollback only the reservation — reservation_items cascade-deletes automatically
        await supabase.from("reservations").delete().eq("id", reservationId);
        throw new Error(`Error al actualizar la cotización: ${qErr.message}`);
      }

      return reservationId;
    },
    onSuccess: (reservationId) => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Reserva creada exitosamente");
      onOpenChange(false);
      navigate(`/reservas?highlight=${reservationId}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aceptar Cotización</DialogTitle>
          <DialogDescription>
            Se creará una reserva confirmada a partir de esta cotización ({quote?.folio}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
            <p><span className="font-medium">Cliente:</span> {quote?.client_name || "—"}</p>
            <p><span className="font-medium">Total:</span> {fmt(quote?.total_mxn ?? 0)} MXN</p>
            {items.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {items.map((it: any, idx: number) => (
                  <p key={idx} className="text-xs text-muted-foreground">
                    • {it.tours?.title ?? "Tour"} — {it.qty_adults} ad.
                    {it.qty_children > 0 ? `, ${it.qty_children} niños` : ""}
                    {it.tour_date ? ` — ${it.tour_date}` : ""}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Date picker */}
          <div className="space-y-1.5">
            <Label>Fecha de viaje *</Label>
            <Input
              type="date"
              value={reservationDate}
              onChange={(e) => setReservationDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            {items.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Esta fecha se usa como respaldo para items sin fecha específica.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={acceptMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending || !reservationDate}
          >
            {acceptMutation.isPending ? "Creando reserva…" : "Aceptar y Crear Reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
