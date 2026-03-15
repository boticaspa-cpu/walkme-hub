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
import { CheckCircle } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const fmtDate = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("es-MX");

type Payable = {
  id: string;
  reservation_id: string;
  operator_id: string;
  service_date: string;
  due_date: string;
  payable_month: string | null;
  amount_mxn: number;
  amount_fx: number | null;
  currency_fx: string | null;
  payment_rule_snapshot: string;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  reservations: { folio: string | null; reservation_date: string; tours: { title: string } | null } | null;
  operators: { name: string } | null;
};

export default function CuentasPorPagar() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOperator, setFilterOperator] = useState("all");
  const [payDialogItem, setPayDialogItem] = useState<Payable | null>(null);
  const [payForm, setPayForm] = useState({
    payment_method: "",
    payment_reference: "",
    payment_date: today,
  });

  if (role !== "admin") {
    return <div className="p-8 text-muted-foreground">Acceso restringido a administradores.</div>;
  }

  const { data: payables = [], isLoading } = useQuery<Payable[]>({
    queryKey: ["operator-payables-full"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("operator_payables")
        .select("*, reservations(folio, reservation_date, tours(title)), operators(name)")
        .order("due_date", { ascending: true });
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
      const noteParts = [
        payForm.payment_method ? `Método: ${payForm.payment_method}` : "",
        payForm.payment_reference ? `Ref: ${payForm.payment_reference}` : "",
        payForm.payment_date ? `Fecha: ${payForm.payment_date}` : "",
      ].filter(Boolean);
      const { error } = await (supabase as any)
        .from("operator_payables")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          notes: noteParts.join(" | "),
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator-payables-full"] });
      qc.invalidateQueries({ queryKey: ["operator-payables"] });
      toast.success("Marcado como pagado");
      setPayDialogItem(null);
      setPayForm({ payment_method: "", payment_reference: "", payment_date: today });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getEffectiveStatus = (p: Payable) => {
    if (p.status === "paid") return "paid";
    if (p.due_date < today) return "overdue";
    return "pending";
  };

  const statusBadge = (p: Payable) => {
    const s = getEffectiveStatus(p);
    if (s === "paid") return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Pagado</Badge>;
    if (s === "overdue") return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Vencido</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Pendiente</Badge>;
  };

  const filtered = payables.filter((p) => {
    const effStatus = getEffectiveStatus(p);
    if (filterStatus !== "all" && effStatus !== filterStatus) return false;
    if (filterOperator !== "all" && p.operator_id !== filterOperator) return false;
    return true;
  });

  const totalPending = payables
    .filter((p) => p.status === "pending")
    .reduce((a, p) => a + Number(p.amount_mxn), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Cuentas por Pagar</h1>
          <p className="text-sm text-muted-foreground">Pagos pendientes a operadores</p>
        </div>
        <Card className="px-4 py-2">
          <p className="text-xs text-muted-foreground">Total pendiente</p>
          <p className="text-xl font-bold text-primary">{fmt(totalPending)}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterOperator} onValueChange={setFilterOperator}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Operador" />
          </SelectTrigger>
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
                  <TableHead className="hidden md:table-cell">Tour</TableHead>
                  <TableHead>Folio</TableHead>
                  <TableHead className="hidden sm:table-cell">Servicio</TableHead>
                  <TableHead>Vence</TableHead>
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
                      <TableCell className="font-medium text-sm">{p.operators?.name ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{p.reservations?.tours?.title ?? "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{p.reservations?.folio ?? "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{fmtDate(p.service_date)}</TableCell>
                      <TableCell className="text-sm">{fmtDate(p.due_date)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {Number(p.amount_fx) > 0 ? (
                          <span className="font-semibold">
                            ${Number(p.amount_fx).toFixed(2)} {p.currency_fx}
                          </span>
                        ) : (
                          <span className="font-semibold">{fmt(Number(p.amount_mxn))}</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(p)}</TableCell>
                      <TableCell>
                        {p.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPayDialogItem(p);
                              setPayForm({ payment_method: "", payment_reference: "", payment_date: today });
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Pagar
                          </Button>
                        ) : p.notes ? (
                          <span className="text-xs text-muted-foreground hidden lg:inline">{p.notes}</span>
                        ) : null}
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
          <DialogHeader>
            <DialogTitle>Registrar Pago a Operador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 rounded-lg p-3">
              <span className="text-muted-foreground">Operador:</span>
              <span className="font-medium">{payDialogItem?.operators?.name}</span>
              <span className="text-muted-foreground">Tour:</span>
              <span>{payDialogItem?.reservations?.tours?.title ?? "—"}</span>
              <span className="text-muted-foreground">Folio:</span>
              <span className="font-mono">{payDialogItem?.reservations?.folio ?? "—"}</span>
              <span className="text-muted-foreground">Monto:</span>
              <span className="font-semibold">
                {Number(payDialogItem?.amount_fx) > 0
                  ? `$${Number(payDialogItem?.amount_fx).toFixed(2)} ${payDialogItem?.currency_fx}`
                  : fmt(Number(payDialogItem?.amount_mxn))}
              </span>
            </div>

            <div className="space-y-1">
              <Label>Método de pago</Label>
              <Select
                value={payForm.payment_method}
                onValueChange={(v) => setPayForm((p) => ({ ...p, payment_method: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_usd">Efectivo USD</SelectItem>
                  <SelectItem value="cash_mxn">Efectivo MXN</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Referencia / Comprobante</Label>
              <Input
                value={payForm.payment_reference}
                onChange={(e) => setPayForm((p) => ({ ...p, payment_reference: e.target.value }))}
                placeholder="Número de transferencia, folio..."
              />
            </div>

            <div className="space-y-1">
              <Label>Fecha de pago</Label>
              <Input
                type="date"
                value={payForm.payment_date}
                onChange={(e) => setPayForm((p) => ({ ...p, payment_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogItem(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => payDialogItem && markPaidMutation.mutate(payDialogItem)}
              disabled={markPaidMutation.isPending}
            >
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
