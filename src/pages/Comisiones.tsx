import { Fragment, useState } from "react";
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
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default function Comisiones() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === "admin";
  const today = new Date().toISOString().split("T")[0];

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeller, setFilterSeller] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [payDialogItem, setPayDialogItem] = useState<any>(null);
  const [payForm, setPayForm] = useState({
    payment_method: "",
    payment_reference: "",
    payment_date: today,
  });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["seller-commissions", isAdmin, user?.id],
    queryFn: async () => {
      let q = (supabase as any)
        .from("seller_commissions")
        .select("*, reservations(folio), profiles!seller_commissions_seller_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (!isAdmin) q = q.eq("seller_id", user?.id);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ["profiles-for-comm-filter"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await (supabase as any)
        .from("seller_commissions")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: payForm.payment_method,
          payment_reference: payForm.payment_reference,
          payment_date: payForm.payment_date,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-commissions"] });
      toast.success("Comisión marcada como pagada");
      setPayDialogItem(null);
      setPayForm({ payment_method: "", payment_reference: "", payment_date: today });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = commissions.filter((c: any) => {
    if (filterStatus !== "all" && (c.status ?? "pending") !== filterStatus) return false;
    if (isAdmin && filterSeller !== "all" && c.seller_id !== filterSeller) return false;
    return true;
  });

  const totalComm = filtered.reduce(
    (a: number, c: any) => a + Number(c.commission_amount_mxn ?? 0),
    0
  );

  const statusBadge = (status: string) => {
    if (status === "paid")
      return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Pagado</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Pendiente</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">
            {isAdmin ? "Comisiones" : "Mis Comisiones"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Comisiones de todos los vendedores"
              : "Comisiones generadas por tus ventas"}
          </p>
        </div>
        <Card className="px-4 py-2">
          <p className="text-xs text-muted-foreground">Total (filtrado)</p>
          <p className="text-xl font-bold text-primary">{fmt(totalComm)}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={filterSeller} onValueChange={setFilterSeller}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los vendedores</SelectItem>
              {(sellers as any[]).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  {isAdmin && <TableHead>Vendedor</TableHead>}
                  <TableHead>Folio</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Venta</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Costo Op.</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Fee Tarjeta</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 9 : 8}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin comisiones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c: any) => (
                    <Fragment key={c.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => setExpandedRow(expandedRow === c.id ? null : c.id)}
                      >
                        <TableCell>
                          {expandedRow === c.id ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="font-medium text-sm">
                            {c.profiles?.full_name ?? "—"}
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-sm">
                          {c.reservations?.folio ?? "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right text-sm">
                          {fmt(Number(c.sale_total_mxn ?? 0))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-sm text-muted-foreground">
                          {fmt(Number(c.operator_cost_mxn ?? 0))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-sm text-muted-foreground">
                          {Number(c.card_fee_mxn) > 0 ? fmt(Number(c.card_fee_mxn)) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {fmt(Number(c.commission_amount_mxn ?? 0))}
                        </TableCell>
                        <TableCell>{statusBadge(c.status ?? "pending")}</TableCell>
                        <TableCell>
                          {isAdmin && (c.status === "pending" || !c.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPayDialogItem(c);
                                setPayForm({
                                  payment_method: "",
                                  payment_reference: "",
                                  payment_date: today,
                                });
                              }}
                            >
                              Pagar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      {expandedRow === c.id && (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 9 : 8} className="bg-muted/20 p-0">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Venta Total</p>
                                <p className="font-semibold">{fmt(Number(c.sale_total_mxn ?? 0))}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Costo Operador</p>
                                <p className="font-semibold">− {fmt(Number(c.operator_cost_mxn ?? 0))}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">
                                  Fee Tarjeta ({c.card_fee_percentage ?? 4}%)
                                </p>
                                <p className="font-semibold">− {fmt(Number(c.card_fee_mxn ?? 0))}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Utilidad</p>
                                <p className="font-semibold">{fmt(Number(c.profit_mxn ?? 0))}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">
                                  Comisión ({c.commission_percentage ?? 0}%)
                                </p>
                                <p className="font-semibold text-primary">
                                  {fmt(Number(c.commission_amount_mxn ?? 0))}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Para la agencia</p>
                                <p className="font-semibold">{fmt(Number(c.agency_amount_mxn ?? 0))}</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pay Commission Dialog */}
      <Dialog open={!!payDialogItem} onOpenChange={(o) => { if (!o) setPayDialogItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Comisión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 rounded-lg p-3">
              <span className="text-muted-foreground">Vendedor:</span>
              <span className="font-medium">{payDialogItem?.profiles?.full_name ?? "—"}</span>
              <span className="text-muted-foreground">Folio:</span>
              <span className="font-mono">{payDialogItem?.reservations?.folio ?? "—"}</span>
              <span className="text-muted-foreground">Comisión:</span>
              <span className="font-semibold text-primary">
                {fmt(Number(payDialogItem?.commission_amount_mxn ?? 0))}
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
                  <SelectItem value="cash_mxn">Efectivo MXN</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="cash_usd">Efectivo USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Referencia</Label>
              <Input
                value={payForm.payment_reference}
                onChange={(e) => setPayForm((p) => ({ ...p, payment_reference: e.target.value }))}
                placeholder="Número de comprobante..."
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
              onClick={() => payDialogItem && payMutation.mutate(payDialogItem)}
              disabled={payMutation.isPending}
            >
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
