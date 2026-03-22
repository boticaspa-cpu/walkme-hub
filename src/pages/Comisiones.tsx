import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Clock, CheckCircle, Building2, TrendingUp, Pencil, DollarSign, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

/* ── Edit Dialog ── */
function EditCommissionDialog({ commission, open, onOpenChange, onSave }: {
  commission: any; open: boolean; onOpenChange: (o: boolean) => void; onSave: () => void;
}) {
  const netProfit = Number(commission?.net_profit ?? 0);
  const [sellerAmt, setSellerAmt] = useState(Number(commission?.commission_amount ?? 0));
  const agencyAmt = netProfit - sellerAmt;

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("commissions")
        .update({ commission_amount: sellerAmt, agency_commission: agencyAmt })
        .eq("id", commission.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Comisión actualizada"); onSave(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Comisión</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
            <p>Vendedor: <span className="font-medium">{commission?.seller?.full_name ?? "—"}</span></p>
            <p>Ganancia Neta: <span className="font-semibold">{fmt(netProfit)}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Comisión Vendedor (MXN)</Label>
              <Input type="number" value={sellerAmt} onChange={e => setSellerAmt(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Comisión Agencia (MXN)</Label>
              <Input value={fmt(agencyAmt)} disabled />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Pay Dialog ── */
function PayCommissionDialog({ commission, open, onOpenChange, onPaid }: {
  commission: any; open: boolean; onOpenChange: (o: boolean) => void; onPaid: () => void;
}) {
  const { user } = useAuth();
  const [method, setMethod] = useState("");
  const [amount, setAmount] = useState(Number(commission?.commission_amount ?? 0));

  const mutation = useMutation({
    mutationFn: async () => {
      const receiptNumber = `COM-${Date.now().toString().slice(-8)}`;
      const { error } = await (supabase as any)
        .from("commissions")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: method,
          payment_amount: amount,
          receipt_number: receiptNumber,
          confirmed_by: user?.id,
        })
        .eq("id", commission.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Comisión pagada correctamente"); onPaid(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Pagar Comisión</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
            <span className="text-sm font-medium">{commission?.seller?.full_name ?? "—"}</span>
            <span className="text-lg font-bold text-primary">{fmt(Number(commission?.commission_amount ?? 0))}</span>
          </div>
          <div className="space-y-1">
            <Label>Forma de Pago *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash_mxn">💵 Efectivo MXN</SelectItem>
                <SelectItem value="cash_usd">💲 Efectivo USD</SelectItem>
                <SelectItem value="transfer">🏦 Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Monto Pagado</Label>
            <Input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !method}>Confirmar Pago</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Create Commission Dialog ── */
function CreateCommissionDialog({ open, onOpenChange, sellers, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; sellers: any[]; onCreated: () => void;
}) {
  const [sellerId, setSellerId] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [grossProfit, setGrossProfit] = useState(0);
  const [rate, setRate] = useState(50);
  const [notes, setNotes] = useState("");

  const sellerAmount = grossProfit * (rate / 100);
  const agencyAmount = grossProfit - sellerAmount;

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations-for-commission"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reservations")
        .select("id, folio, client:clients(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!sellerId) throw new Error("Selecciona un vendedor");
      if (grossProfit <= 0) throw new Error("La ganancia bruta debe ser mayor a 0");
      const { error } = await (supabase as any).from("commissions").insert({
        seller_id: sellerId,
        reservation_id: reservationId || null,
        gross_profit: grossProfit,
        net_profit: grossProfit,
        commission_rate: rate,
        commission_amount: sellerAmount,
        agency_commission: agencyAmount,
        status: "pending",
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comisión creada");
      onCreated();
      onOpenChange(false);
      setSellerId("");
      setReservationId("");
      setGrossProfit(0);
      setRate(50);
      setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nueva Comisión</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Vendedor *</Label>
            <Select value={sellerId} onValueChange={setSellerId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar vendedor" /></SelectTrigger>
              <SelectContent>
                {sellers.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Reserva (opcional)</Label>
            <Select value={reservationId} onValueChange={setReservationId}>
              <SelectTrigger><SelectValue placeholder="Sin reserva" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin reserva</SelectItem>
                {(reservations as any[]).map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.folio ?? r.id.slice(0, 8)} — {r.client?.name ?? "Sin cliente"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Ganancia Bruta (MXN) *</Label>
            <Input type="number" value={grossProfit || ""} onChange={e => setGrossProfit(parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Comisión %</Label>
              <Input type="number" value={rate} onChange={e => setRate(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Com. Vendedor</Label>
              <Input value={fmt(sellerAmount)} disabled />
            </div>
            <div className="space-y-1">
              <Label>Com. Agencia</Label>
              <Input value={fmt(agencyAmount)} disabled />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !sellerId || grossProfit <= 0}>
            Crear Comisión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ── */
export default function Comisiones() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === "admin";

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeller, setFilterSeller] = useState("all");
  const [editItem, setEditItem] = useState<any>(null);
  const [payItem, setPayItem] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["commissions", isAdmin, user?.id],
    queryFn: async () => {
      let q = (supabase as any)
        .from("commissions")
        .select(`
          *,
          seller:profiles!commissions_seller_id_fkey(id, full_name),
          reservation:reservations!commissions_reservation_id_fkey(id, reservation_date, total_mxn, client:clients(name)),
          confirmed_by_user:profiles!commissions_confirmed_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });
      if (!isAdmin) q = q.eq("seller_id", user?.id);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ["profiles-comm-filter"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = commissions.filter((c: any) => {
    if (filterStatus !== "all" && (c.status ?? "pending") !== filterStatus) return false;
    if (isAdmin && filterSeller !== "all" && c.seller_id !== filterSeller) return false;
    return true;
  });

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const thisMonth = commissions.filter((c: any) => c.created_at >= monthStart && c.created_at <= monthEnd);

  const pendingItems = commissions.filter((c: any) => (c.status ?? "pending") === "pending");
  const pendingTotal = pendingItems.reduce((a: number, c: any) => a + Number(c.commission_amount ?? 0), 0);
  const paidThisMonth = thisMonth.filter((c: any) => c.status === "paid").reduce((a: number, c: any) => a + Number(c.commission_amount ?? 0), 0);
  const agencyProfitMonth = thisMonth.reduce((a: number, c: any) => a + Number(c.agency_commission ?? 0), 0);
  const totalProfitMonth = thisMonth.reduce((a: number, c: any) => a + Number(c.net_profit ?? 0), 0);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["commissions"] });

  const statusBadge = (status: string) =>
    status === "paid"
      ? <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Pagado</Badge>
      : <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Pendiente</Badge>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{isAdmin ? "Comisiones" : "Mis Comisiones"}</h1>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Comisión
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pendientes de Pago", value: fmt(pendingTotal), sub: `${pendingItems.length} comisiones`, icon: Clock },
          { label: "Pagadas Este Mes", value: fmt(paidThisMonth), icon: CheckCircle },
          { label: "Ganancia Agencia (Mes)", value: fmt(agencyProfitMonth), icon: Building2 },
          { label: "Ganancia Total (Mes)", value: fmt(totalProfitMonth), icon: TrendingUp },
        ].map((k) => (
          <Card key={k.label} className="shadow-sm">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <k.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold tracking-tight">{k.value}</p>
                {k.sub && <p className="text-xs text-muted-foreground">{k.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select value={filterSeller} onValueChange={setFilterSeller}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Vendedor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los vendedores</SelectItem>
              {(sellers as any[]).map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead># Recibo</TableHead>
                    <TableHead>Fecha</TableHead>
                    {isAdmin && <TableHead>Vendedor</TableHead>}
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Gan. Bruta</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Fee 4%</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Gan. Neta</TableHead>
                    <TableHead className="text-right">Com. Vendedor</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Com. Agencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 11 : 10} className="text-center text-muted-foreground py-8">
                        Sin comisiones registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">
                          {c.receipt_number ?? <span className="text-muted-foreground">Pendiente</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.created_at ? format(new Date(c.created_at), "dd/MM/yy") : "—"}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-sm font-medium">{c.seller?.full_name ?? "—"}</TableCell>
                        )}
                        <TableCell className="text-sm">
                          {c.reservation?.client?.name ?? "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-sm">
                          {fmt(Number(c.gross_profit ?? 0))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-sm text-muted-foreground">
                          {Number(c.card_fee_amount) > 0 ? fmt(Number(c.card_fee_amount)) : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-sm">
                          {fmt(Number(c.net_profit ?? 0))}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {fmt(Number(c.commission_amount ?? 0))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-sm">
                          {fmt(Number(c.agency_commission ?? 0))}
                        </TableCell>
                        <TableCell>{statusBadge(c.status ?? "pending")}</TableCell>
                        <TableCell>
                          {c.status === "pending" && isAdmin ? (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setEditItem(c)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setPayItem(c)}>
                                <DollarSign className="h-4 w-4 mr-1" />Pagar
                              </Button>
                            </div>
                          ) : c.status === "paid" ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-green-600 font-medium">Pagada</span>
                              <Button size="icon" variant="ghost" onClick={() => toast.info(`Recibo: ${c.receipt_number ?? "N/A"}`)}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {editItem && (
        <EditCommissionDialog commission={editItem} open={!!editItem} onOpenChange={o => { if (!o) setEditItem(null); }} onSave={invalidate} />
      )}
      {payItem && (
        <PayCommissionDialog commission={payItem} open={!!payItem} onOpenChange={o => { if (!o) setPayItem(null); }} onPaid={invalidate} />
      )}
      {isAdmin && (
        <CreateCommissionDialog open={createOpen} onOpenChange={setCreateOpen} sellers={sellers as any[]} onCreated={invalidate} />
      )}
    </div>
  );
}
