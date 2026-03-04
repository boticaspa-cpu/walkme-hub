import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, FileText, Printer, Send, Pencil, DollarSign, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeTourPrice, computeTotal } from "@/lib/tour-pricing";
import VoucherPrintView from "@/components/reservations/VoucherPrintView";
import ReservationCheckout from "@/components/reservations/ReservationCheckout";
import { buildWhatsAppMessage, openWhatsApp } from "@/components/reservations/whatsapp-message";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ZONES = ["Cancún", "Playa del Carmen", "Riviera Maya", "Tulum"];
const NATIONALITIES = ["Nacional", "Extranjero"];

/* ── status helpers ── */
const statusStyles: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-yellow-100 text-yellow-700",
};
const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No Show",
};

const paymentStyles: Record<string, string> = {
  unpaid: "bg-yellow-100 text-yellow-700",
  deposit: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
};
const paymentLabels: Record<string, string> = {
  unpaid: "Pendiente",
  deposit: "Anticipo",
  paid: "Pagado",
};

/* ── form defaults ── */
const emptyForm = {
  tour_id: "",
  client_id: "",
  modality: "shared",
  reservation_date: "",
  reservation_time: "",
  pax_adults: 1,
  pax_children: 0,
  zone: "",
  nationality: "",
  total_mxn: 0,
  notes: "",
  status: "scheduled",
};

export default function Reservas() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = role === "admin";

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [voucherReservation, setVoucherReservation] = useState<any>(null);
  const voucherRef = useRef<HTMLDivElement>(null);
  const [checkoutReservation, setCheckoutReservation] = useState<any>(null);

  // mini-dialog nuevo cliente
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "" });

  /* ── queries ── */
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, tours(title, includes, meeting_point, short_description, operator_id), clients(name, phone, email)")
        .order("reservation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch operator_payables for prepago blocking
  const { data: payables = [] } = useQuery({
    queryKey: ["operator-payables"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("operator_payables")
        .select("reservation_id, status, payment_rule_snapshot");
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch operators for prepago check
  const { data: operators = [] } = useQuery({
    queryKey: ["operators-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operators")
        .select("id, name, payment_rules");
      if (error) throw error;
      return data;
    },
  });

  const { data: tours = [] } = useQuery({
    queryKey: ["tours-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("id, title, price_mxn, suggested_price_mxn")
        .eq("active", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Load all price variants for auto-pricing
  const { data: allVariants = [] } = useQuery({
    queryKey: ["tour-price-variants-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_price_variants")
        .select("tour_id, zone, nationality, pax_type, sale_price")
        .eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // ── Auto-pricing: recalculate total when relevant fields change ──
  useEffect(() => {
    if (!form.tour_id) return;
    const result = computeTourPrice(form.tour_id, form.zone, form.nationality, allVariants as any, tours as any);
    const total = computeTotal(result.adultPrice, result.childPrice, form.pax_adults, form.pax_children);
    setForm((p) => ({ ...p, total_mxn: total }));
  }, [form.tour_id, form.zone, form.nationality, form.pax_adults, form.pax_children, allVariants, tours]);

  // ── Detect ?tour_id= query param to open create dialog ──
  useEffect(() => {
    const tourId = searchParams.get("tour_id");
    if (tourId && tours.length > 0) {
      setForm({ ...emptyForm, tour_id: tourId });
      setEditingId(null);
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, tours]);

  /* ── mutations ── */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const pax = form.pax_adults + form.pax_children;
      const payload = {
        tour_id: form.tour_id || null,
        client_id: form.client_id || null,
        modality: form.modality,
        reservation_date: form.reservation_date,
        reservation_time: form.reservation_time,
        pax,
        pax_adults: form.pax_adults,
        pax_children: form.pax_children,
        zone: form.zone,
        nationality: form.nationality,
        total_mxn: form.total_mxn,
        notes: form.notes || null,
        ...(editingId ? { status: form.status } : { created_by: user?.id }),
      };

      if (editingId) {
        const { error } = await supabase.from("reservations").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reservations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast.success(editingId ? "Reserva actualizada" : "Reserva creada");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveClientMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ name: clientForm.name, phone: clientForm.phone, email: clientForm.email || null, created_by: user?.id })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      setForm((prev) => ({ ...prev, client_id: data.id }));
      toast.success("Cliente creado");
      setClientDialogOpen(false);
      setClientForm({ name: "", phone: "", email: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ── helpers ── */
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (r: any) => {
    setForm({
      tour_id: r.tour_id ?? "",
      client_id: r.client_id ?? "",
      modality: r.modality,
      reservation_date: r.reservation_date,
      reservation_time: r.reservation_time,
      pax_adults: r.pax_adults ?? r.pax ?? 1,
      pax_children: r.pax_children ?? 0,
      zone: r.zone ?? "",
      nationality: r.nationality ?? "",
      total_mxn: r.total_mxn,
      notes: r.notes ?? "",
      status: r.status,
    });
    setEditingId(r.id);
    setDialogOpen(true);
  };

  /* ── voucher / prepago helpers ── */
  const isPrepagoBlocked = (r: any): boolean => {
    if (!r.tours?.operator_id) return false;
    const op = operators.find((o: any) => o.id === r.tours.operator_id);
    if (!op || op.payment_rules !== "prepago") return false;
    const payable = payables.find((p: any) => p.reservation_id === r.id);
    return !payable || payable.status === "pending";
  };

  const handleVoucherWithCheck = (r: any) => {
    if (isPrepagoBlocked(r)) {
      toast.warning("Proveedor PREPAGO pendiente — debes pagarlo antes del tour para emitir voucher.");
      return;
    }
    setVoucherReservation(r);
  };

  const handlePrint = (r: any) => {
    if (isPrepagoBlocked(r)) {
      toast.warning("Proveedor PREPAGO pendiente — debes pagarlo antes del tour.");
      return;
    }
    setVoucherReservation(r);
    setTimeout(() => {
      const content = document.getElementById("voucher-content");
      if (!content) return;
      const w = window.open("", "_blank", "width=800,height=600");
      if (!w) return;
      w.document.write(`<!DOCTYPE html><html><head><title>Voucher ${r.folio ?? ""}</title>
        <style>body{font-family:Arial,sans-serif;padding:24px;margin:0}
        table{border-collapse:collapse}th,td{padding:6px 12px}
        .print\\:hidden{display:none!important}</style></head>
        <body>${content.outerHTML}</body></html>`);
      w.document.close();
      w.focus();
      w.print();
      setVoucherReservation(null);
    }, 100);
  };

  const handleWhatsApp = (r: any) => {
    if (isPrepagoBlocked(r)) {
      toast.warning("Proveedor PREPAGO pendiente — debes pagarlo antes del tour para enviar confirmación.");
      return;
    }
    const msg = buildWhatsAppMessage(r, "es");
    openWhatsApp(r.clients?.phone, msg);
  };

  /* ── filter ── */
  const filtered = reservations.filter((r: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const folio = (r.folio ?? "").toLowerCase();
    const clientName = (r.clients?.name ?? "").toLowerCase();
    return folio.includes(q) || clientName.includes(q);
  });

  const confirmationStatus = (r: any) => r.confirmation_status || "scheduled";
  const paymentStatus = (r: any) => r.payment_status || "unpaid";

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Reservas</h1>
          <p className="text-sm text-muted-foreground">Gestión de reservas, cobro y vouchers</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nueva Reserva</Button>
      </div>

      {/* table card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio o nombre..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando reservas…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron reservas
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r: any) => {
                    const cStatus = confirmationStatus(r);
                    const pStatus = paymentStatus(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs font-bold">{r.folio ?? "—"}</TableCell>
                        <TableCell className="text-sm font-medium">{r.tours?.title ?? "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{r.clients?.name ?? "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{r.reservation_date} {r.reservation_time}</TableCell>
                        <TableCell>
                          <Badge className={`${statusStyles[cStatus] ?? statusStyles[r.status] ?? ""} border-0 text-xs`}>
                            {statusLabels[cStatus] ?? statusLabels[r.status] ?? r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${paymentStyles[pStatus] ?? ""} border-0 text-xs`}>
                            {paymentLabels[pStatus] ?? pStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* Confirm & Charge button */}
                            {cStatus === "scheduled" && pStatus !== "paid" && (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setCheckoutReservation(r)}
                              >
                                <DollarSign className="mr-1 h-3 w-3" />
                                Cobrar
                              </Button>
                            )}
                            {cStatus === "confirmed" && pStatus === "paid" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleVoucherWithCheck(r)}
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Ticket
                              </Button>
                            )}
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(r)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Voucher PDF" onClick={() => handleVoucherWithCheck(r)}>
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Imprimir" onClick={() => handlePrint(r)}>
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Enviar WhatsApp" onClick={() => handleWhatsApp(r)}>
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Checkout Dialog ── */}
      {checkoutReservation && (
        <ReservationCheckout
          reservation={checkoutReservation}
          open={!!checkoutReservation}
          onOpenChange={(open) => { if (!open) setCheckoutReservation(null); }}
          onSuccess={() => setCheckoutReservation(null)}
        />
      )}

      {/* ── Dialog Crear / Editar Reserva ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Reserva" : "Nueva Reserva"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos de la reserva." : "Completa los datos para crear una nueva reserva. El folio se genera automáticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Tour */}
            <div className="space-y-1.5">
              <Label>Tour *</Label>
              <Select value={form.tour_id} onValueChange={(v) => setForm((p) => ({ ...p, tour_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tour" /></SelectTrigger>
                <SelectContent>
                  {tours.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cliente + "+" */}
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <div className="flex gap-2">
                <Select value={form.client_id} onValueChange={(v) => setForm((p) => ({ ...p, client_id: v }))}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" onClick={() => setClientDialogOpen(true)} title="Nuevo Cliente">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Zona + Nacionalidad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Zona de pickup</Label>
                <Select value={form.zone} onValueChange={(v) => setForm((p) => ({ ...p, zone: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar zona" /></SelectTrigger>
                  <SelectContent>
                    {ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nacionalidad</Label>
                <Select value={form.nationality} onValueChange={(v) => setForm((p) => ({ ...p, nationality: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Modalidad */}
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <Select value={form.modality} onValueChange={(v) => setForm((p) => ({ ...p, modality: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">Compartido</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha + Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Input type="date" value={form.reservation_date} onChange={(e) => setForm((p) => ({ ...p, reservation_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input placeholder="6:00 AM" value={form.reservation_time} onChange={(e) => setForm((p) => ({ ...p, reservation_time: e.target.value }))} />
              </div>
            </div>

            {/* Adultos + Niños + Total */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Adultos</Label>
                <Input type="number" min={0} value={form.pax_adults} onChange={(e) => setForm((p) => ({ ...p, pax_adults: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Niños</Label>
                <Input type="number" min={0} value={form.pax_children} onChange={(e) => setForm((p) => ({ ...p, pax_children: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Total MXN</Label>
                <Input type="number" min={0} step="0.01" value={form.total_mxn} onChange={(e) => setForm((p) => ({ ...p, total_mxn: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            {/* Estado (solo edicion) */}
            {editingId && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notas */}
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notas opcionales…" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.tour_id || !form.client_id || !form.reservation_date}
            >
              {saveMutation.isPending ? "Guardando…" : editingId ? "Actualizar" : "Crear Reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Mini-dialog Nuevo Cliente ── */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>Crea un cliente rápido para asignar a esta reserva.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={clientForm.name} onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={clientForm.phone} onChange={(e) => setClientForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={clientForm.email} onChange={(e) => setClientForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveClientMutation.mutate()} disabled={saveClientMutation.isPending || !clientForm.name.trim()}>
              {saveClientMutation.isPending ? "Guardando…" : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Voucher Dialog ── */}
      <Dialog open={!!voucherReservation} onOpenChange={(open) => { if (!open) setVoucherReservation(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Voucher — {voucherReservation?.folio ?? ""}</DialogTitle>
            <DialogDescription>Previsualiza e imprime el voucher de la reserva.</DialogDescription>
          </DialogHeader>
          {voucherReservation && (
            <div ref={voucherRef}>
              <VoucherPrintView reservation={voucherReservation} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoucherReservation(null)}>Cerrar</Button>
            <Button onClick={() => handlePrint(voucherReservation)}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden voucher for print */}
      {voucherReservation && (
        <div className="hidden">
          <div id="voucher-print-hidden">
            <VoucherPrintView reservation={voucherReservation} />
          </div>
        </div>
      )}
    </div>
  );
}
