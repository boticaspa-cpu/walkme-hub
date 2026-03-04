import { useState } from "react";
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

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!reservationDate) throw new Error("Selecciona una fecha de viaje");
      
      const firstItem = items[0];
      if (!firstItem) throw new Error("La cotización no tiene items");

      // Calculate total from items
      const total = items.reduce((s: number, i: any) => s + i.qty_adults * i.unit_price_mxn + i.qty_children * i.unit_price_child_mxn, 0);
      const totalPax = items.reduce((s: number, i: any) => s + i.qty_adults + i.qty_children, 0);

      // Build notes with all tour names if multiple
      let notes = quote.notes || "";
      if (items.length > 1) {
        const tourNames = items.map((i: any, idx: number) => `${idx + 1}. ${i.tours?.title ?? "Tour"}`).join(", ");
        notes = `Cotización ${quote.folio} con ${items.length} tours: ${tourNames}. ${notes}`.trim();
      }

      // Create reservation from first item
      const { data: reservation, error: rErr } = await supabase.from("reservations").insert({
        client_id: quote.client_id || null,
        tour_id: firstItem.tour_id || null,
        reservation_date: reservationDate,
        pax: totalPax,
        pax_adults: firstItem.qty_adults,
        pax_children: firstItem.qty_children,
        zone: firstItem.zone || "",
        nationality: firstItem.nationality || "",
        total_mxn: total,
        status: "scheduled",
        payment_status: "unpaid",
        notes,
        created_by: user?.id,
      }).select("id").single();

      if (rErr) throw rErr;

      // Update quote with reservation_id and accepted status
      const { error: qErr } = await supabase.from("quotes").update({
        status: "accepted",
        reservation_id: reservation.id,
      }).eq("id", quote.id);

      if (qErr) throw qErr;

      return reservation.id;
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
          <DialogDescription>Se creará una reserva a partir de esta cotización ({quote?.folio}).</DialogDescription>
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
                    • {it.tours?.title ?? "Tour"} — {it.qty_adults} ad.{it.qty_children > 0 ? `, ${it.qty_children} niños` : ""}
                  </p>
                ))}
              </div>
            )}
            {items.length > 1 && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠ Se creará 1 reserva con el primer tour. Los demás tours se incluyen en las notas.
              </p>
            )}
          </div>

          {/* Date picker */}
          <div className="space-y-1.5">
            <Label>Fecha de viaje *</Label>
            <Input type="date" value={reservationDate} onChange={e => setReservationDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending || !reservationDate}>
            {acceptMutation.isPending ? "Creando reserva…" : "Aceptar y Crear Reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
