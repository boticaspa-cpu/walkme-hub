import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, Plus } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const fmtDate = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("es-MX");
const addDays = (s: string, days: number) => {
  const d = new Date(s + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("es-MX");
};

type Payable = {
  id: string;
  operator_id: string;
  sale_id: string;
  sale_date: string;
  amount_value: number;
  amount_currency: string;
  equivalent_mxn: number | null;
  exchange_rate_used: number | null;
  status: string;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  operator: { id: string; name: string } | null;
};

export default function CuentasPorPagar() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const isAdmin = role === "admin";

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOperator, setFilterOperator] = useState("all");
  const [payDialogItem, setPayDialogItem] = useState<Payable | null>(null);
  const [payForm, setPayForm] = useState({
    payment_method: "",
    payment_reference: "",
    payment_date: today,
    payment_amount: "",
  });

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    operator_id: "",
    amount_value: "",
    amount_currency: "USD",
    sale_date: today,
    notes: "",
  });

  const { data: payables = [], isLoading } = useQuery<Payable[]>({
    queryKey: ["operator-payables"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("operator_payables")
        .select("*, operator:operators(id, name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: operatorsList = [] } = useQuery({
    queryKey: ["operators-for-cpp-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("operators").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (item: Payable) => {
      const parsedAmount = parseFloat(payForm.payment_amount);
      const noteParts = [
        payForm.payment_method ? `Método: ${payForm.payment_method}` : "",
        payForm.payment_reference ? `Ref: ${payForm.payment_reference}` : "",
        payForm.payment_date ? `Fecha: ${payForm.payment_date}` : "",
      ].filter(Boolean);
      const { error } = await (supabase as any)
        .from("operator_payables")
        .update({
          amount_value: isNaN(parsedAmount) ? item.amount_value : parsedAmount,
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: payForm.payment_method || null,
          notes: [item.notes, noteParts.join(" | ")].filter(Boolean).join(" — "),
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator-payables"] });
      toast.success("Marcado como pagado");
      setPayDialogItem(null);
      setPayForm({ payment_method: "", payment_reference: "", payment_date: today, payment_amount: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createPayableMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("operator_payables")
        .insert({
          operator_id: newForm.operator_id,
          sale_id: newForm.operator_id, // required FK — use operator_id as placeholder
          amount_value: parseFloat(newForm.amount_value),
          amount_currency: newForm.amount_currency,
          sale_date: newForm.sale_date,
          notes: newForm.notes || null,
          status: "pending",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator-payables"] });
      toast.success("Pago creado");
      setNewDialogOpen(false);
      setNewForm({ operator_id: "", amount_value: "", amount_currency: "USD", sale_date: today, notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return <div className="p-8 text-muted-foreground">Acceso restringido a administradores.</div>;
  }

  const filtered = payables.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterOperator !== "all" && p.operator_id !== filterOperator) return false;
    return true;
  });

  const totalPending = payables
    .filter((p) => p.status === "pending")
    .reduce((a, p) => a + Number(p.equivalent_mxn ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Cuentas por Pagar</h1>
          <p className="text-sm text-muted-foreground">Pagos pendientes a operadores</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2">
            <p className="text-xs text-muted-foreground">Total pendiente</p>
            <p className="text-xl font-bold text-primary">{fmt(totalPending)}</p>
          </Card>
          <Button onClick={() => setNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo Pago
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterOperator} onValueChange={setFilterOperator}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Operador" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los operadores</SelectItem>
            {(operatorsList as any[]).map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead className="hidden md:table-cell">Concepto/Tour</TableHead>
                  <TableHead>Folio</TableHead>
                  <TableHead className="hidden sm:table-cell">Servicio</TableHead>
                  <TableHead className="hidden sm:table-cell">Vence</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Sin registros
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.operator?.name ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{p.notes ?? "Sin concepto"}</TableCell>
                      <TableCell className="text-sm font-mono">{p.id.slice(0, 8)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{fmtDate(p.sale_date)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{addDays(p.sale_date, 15)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        ${Number(p.amount_value).toFixed(2)} {p.amount_currency}
                      </TableCell>
                      <TableCell>
                        {p.status === "paid" ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Pagado</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPayDialogItem(p);
                              setPayForm({
                                payment_method: "",
                                payment_reference: "",
                                payment_date: today,
                                payment_amount: Number(p.amount_value).toFixed(2),
                              });
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mark as Paid Dialog */}
      <Dialog open={!!payDialogItem} onOpenChange={(o) => { if (!o) setPayDialogItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Pago a Operador</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 rounded-lg p-3">
              <span className="text-muted-foreground">Operador:</span>
              <span className="font-medium">{payDialogItem?.operator?.name}</span>
              <span className="text-muted-foreground">Concepto:</span>
              <span>{payDialogItem?.notes ?? "Sin concepto"}</span>
              <span className="text-muted-foreground">Folio:</span>
              <span className="font-mono">{payDialogItem?.id.slice(0, 8)}</span>
              <span className="text-muted-foreground">Monto original:</span>
              <span className="font-semibold">
                ${Number(payDialogItem?.amount_value).toFixed(2)} {payDialogItem?.amount_currency}
              </span>
            </div>
            <div className="space-y-1">
              <Label>Monto a pagar ({payDialogItem?.amount_currency})</Label>
              <Input type="number" step="0.01" min="0" value={payForm.payment_amount}
                onChange={(e) => setPayForm((p) => ({ ...p, payment_amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Método de pago</Label>
              <Select value={payForm.payment_method} onValueChange={(v) => setPayForm((p) => ({ ...p, payment_method: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_usd">Efectivo USD</SelectItem>
                  <SelectItem value="cash_mxn">Efectivo MXN</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Referencia / Comprobante</Label>
              <Input value={payForm.payment_reference}
                onChange={(e) => setPayForm((p) => ({ ...p, payment_reference: e.target.value }))}
                placeholder="Número de transferencia, folio..." />
            </div>
            <div className="space-y-1">
              <Label>Fecha de pago</Label>
              <Input type="date" value={payForm.payment_date}
                onChange={(e) => setPayForm((p) => ({ ...p, payment_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogItem(null)}>Cancelar</Button>
            <Button onClick={() => payDialogItem && markPaidMutation.mutate(payDialogItem)}
              disabled={markPaidMutation.isPending}>
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Payment Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Pago a Operador</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Operador</Label>
              <Select value={newForm.operator_id} onValueChange={(v) => setNewForm((f) => ({ ...f, operator_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar operador" /></SelectTrigger>
                <SelectContent>
                  {(operatorsList as any[]).map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Monto</Label>
                <Input type="number" step="0.01" min="0" value={newForm.amount_value}
                  onChange={(e) => setNewForm((f) => ({ ...f, amount_value: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>Moneda</Label>
                <Select value={newForm.amount_currency} onValueChange={(v) => setNewForm((f) => ({ ...f, amount_currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fecha de servicio</Label>
              <Input type="date" value={newForm.sale_date}
                onChange={(e) => setNewForm((f) => ({ ...f, sale_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Concepto / Notas</Label>
              <Input value={newForm.notes}
                onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Descripción del pago..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createPayableMutation.mutate()}
              disabled={createPayableMutation.isPending || !newForm.operator_id || !newForm.amount_value}>
              Crear Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
