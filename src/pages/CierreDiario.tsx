import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCashSession } from "@/hooks/useCashSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Lock, Unlock, ShoppingCart, ArrowDownCircle, ArrowUpCircle, Clock, DollarSign,
} from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

const movementLabels: Record<string, string> = {
  sale_cash: "Venta efectivo",
  sale_card: "Venta tarjeta",
  sale_transfer: "Venta transferencia",
  in_cash: "Entrada efectivo",
  out_cash: "Salida efectivo",
  refund: "Devolución",
  withdrawal: "Retiro",
  adjustment: "Ajuste",
};

export default function CierreDiario() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    registers, defaultRegister, activeSession, isSessionOpen, isLoadingSession,
    movements, sessionSales, openSession, closeSession, addMovement,
  } = useCashSession();

  // Open dialog
  const [openDlg, setOpenDlg] = useState(false);
  const [floatMxn, setFloatMxn] = useState("0");
  const [openNotes, setOpenNotes] = useState("");

  // Movement dialog
  const [movDlg, setMovDlg] = useState<"in_cash" | "out_cash" | null>(null);
  const [movAmount, setMovAmount] = useState("");
  const [movRef, setMovRef] = useState("");

  // Close wizard
  const [closeDlg, setCloseDlg] = useState(false);
  const [closeStep, setCloseStep] = useState(1);
  const [countedCash, setCountedCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  // === Aggregations for close ===
  const salesCash = sessionSales.filter((s: any) => s.payment_method === "cash").reduce((a: number, s: any) => a + Number(s.total_mxn), 0);
  const salesCard = sessionSales.filter((s: any) => s.payment_method === "card").reduce((a: number, s: any) => a + Number(s.total_mxn), 0);
  const salesTransfer = sessionSales.filter((s: any) => s.payment_method === "transfer").reduce((a: number, s: any) => a + Number(s.total_mxn), 0);
  const movIn = movements.filter((m) => m.type === "in_cash").reduce((a, m) => a + Number(m.amount_mxn), 0);
  const movOut = movements.filter((m) => m.type === "out_cash").reduce((a, m) => a + Number(m.amount_mxn), 0);
  const expectedCash = (activeSession?.opening_float_mxn || 0) + salesCash + movIn - movOut;

  const variance = parseFloat(countedCash || "0") - expectedCash;

  const dateLabel = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Upsert daily_closings on close
  const handleClose = async () => {
    if (!activeSession) return;
    if (variance !== 0 && !closeNotes.trim()) {
      toast.error("Indica el motivo de la diferencia");
      return;
    }
    try {
      await closeSession.mutateAsync({
        sessionId: activeSession.id,
        expectedCashMxn: expectedCash,
        countedCashMxn: parseFloat(countedCash || "0"),
        varianceMxn: variance,
        notes: closeNotes || undefined,
      });

      // Also upsert daily_closings for backward compat
      const todayStr = activeSession.business_date;
      await supabase.from("daily_closings").insert({
        closing_date: todayStr,
        total_sales: sessionSales.length,
        cash_mxn: salesCash,
        cash_usd: 0,
        cash_eur: 0,
        cash_cad: 0,
        card_mxn: salesCard,
        transfer_mxn: salesTransfer,
        exchange_rate_usd: 1,
        exchange_rate_eur: 1,
        exchange_rate_cad: 1,
        grand_total_mxn: salesCash + salesCard + salesTransfer,
        closed_by: user?.id,
      });

      toast.success("Caja cerrada exitosamente");
      setCloseDlg(false);
      setCloseStep(1);
      setCountedCash("");
      setCloseNotes("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleOpenSession = async () => {
    if (!defaultRegister) { toast.error("No hay caja configurada"); return; }
    try {
      await openSession.mutateAsync({
        registerId: defaultRegister.id,
        floatMxn: parseFloat(floatMxn) || 0,
        notes: openNotes || undefined,
      });
      toast.success("Caja abierta");
      setOpenDlg(false);
      setFloatMxn("0");
      setOpenNotes("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddMovement = async () => {
    if (!activeSession || !movDlg) return;
    const amt = parseFloat(movAmount);
    if (!amt || amt <= 0) { toast.error("Ingresa un monto válido"); return; }
    try {
      await addMovement.mutateAsync({
        sessionId: activeSession.id,
        type: movDlg,
        amountMxn: amt,
        reference: movRef || undefined,
      });
      toast.success(movDlg === "in_cash" ? "Entrada registrada" : "Salida registrada");
      setMovDlg(null);
      setMovAmount("");
      setMovRef("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold font-display">Caja</h1>
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-display">Caja</h1>
        <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
      </div>

      {/* === STATE A: No session open === */}
      {!isSessionOpen && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Caja cerrada</p>
            <p className="text-sm text-muted-foreground">Abre caja para comenzar a registrar ventas y movimientos.</p>
            <Button size="lg" onClick={() => setOpenDlg(true)}>
              <Unlock className="mr-2 h-4 w-4" /> Abrir Caja
            </Button>
          </CardContent>
        </Card>
      )}

      {/* === STATE B: Session open === */}
      {isSessionOpen && activeSession && (
        <>
          {/* Status banner */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-600 text-white">ABIERTA</Badge>
                  <div>
                    <p className="text-sm font-medium">
                      <Clock className="inline h-3.5 w-3.5 mr-1" />
                      Abierta a las {fmtTime(activeSession.opened_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fondo inicial: {fmt(activeSession.opening_float_mxn)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => navigate("/pos")}>
                    <ShoppingCart className="mr-1 h-3.5 w-3.5" /> Ir a POS
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMovDlg("in_cash")}>
                    <ArrowDownCircle className="mr-1 h-3.5 w-3.5" /> Entrada
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMovDlg("out_cash")}>
                    <ArrowUpCircle className="mr-1 h-3.5 w-3.5" /> Salida
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground">Ventas Efectivo</p>
                <p className="text-lg font-bold">{fmt(salesCash)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground">Ventas Tarjeta</p>
                <p className="text-lg font-bold">{fmt(salesCard)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="text-lg font-bold text-green-600">{fmt(movIn)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground">Salidas</p>
                <p className="text-lg font-bold text-destructive">{fmt(movOut)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Efectivo esperado en caja</span>
                <span className="text-xl font-bold text-primary">{fmt(expectedCash)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Movements log */}
          {movements.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Movimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs">{fmtTime(m.created_at)}</TableCell>
                        <TableCell className="text-xs">{movementLabels[m.type] || m.type}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.reference || "—"}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{fmt(m.amount_mxn)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Close button */}
          <Button variant="destructive" size="lg" className="w-full" onClick={() => { setCloseStep(1); setCloseDlg(true); }}>
            <Lock className="mr-2 h-4 w-4" /> Cerrar Caja
          </Button>
        </>
      )}

      {/* === OPEN DIALOG === */}
      <Dialog open={openDlg} onOpenChange={setOpenDlg}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
            <DialogDescription>Ingresa el fondo inicial para hoy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Caja</Label>
              <Input value={defaultRegister?.name || "—"} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Fondo inicial MXN *</Label>
              <Input type="number" value={floatMxn} onChange={(e) => setFloatMxn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDlg(false)}>Cancelar</Button>
            <Button onClick={handleOpenSession} disabled={openSession.isPending}>
              {openSession.isPending ? "Abriendo…" : "Abrir Caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === MOVEMENT DIALOG === */}
      <Dialog open={!!movDlg} onOpenChange={() => setMovDlg(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{movDlg === "in_cash" ? "Entrada de Efectivo" : "Salida de Efectivo"}</DialogTitle>
            <DialogDescription>Registra un movimiento de caja.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Monto MXN *</Label>
              <Input type="number" value={movAmount} onChange={(e) => setMovAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo / Referencia</Label>
              <Input value={movRef} onChange={(e) => setMovRef(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovDlg(null)}>Cancelar</Button>
            <Button onClick={handleAddMovement} disabled={addMovement.isPending}>
              {addMovement.isPending ? "Guardando…" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === CLOSE WIZARD === */}
      <Dialog open={closeDlg} onOpenChange={setCloseDlg}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cerrar Caja — Paso {closeStep}/2</DialogTitle>
            <DialogDescription>
              {closeStep === 1 ? "Resumen automático del día" : "Arqueo de caja"}
            </DialogDescription>
          </DialogHeader>

          {closeStep === 1 && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Ventas (total):</span>
                <span className="font-medium text-right">{sessionSales.length}</span>
                <span className="text-muted-foreground">Efectivo:</span>
                <span className="font-medium text-right">{fmt(salesCash)}</span>
                <span className="text-muted-foreground">Tarjeta:</span>
                <span className="font-medium text-right">{fmt(salesCard)}</span>
                <span className="text-muted-foreground">Transferencia:</span>
                <span className="font-medium text-right">{fmt(salesTransfer)}</span>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Fondo inicial:</span>
                <span className="font-medium text-right">{fmt(activeSession?.opening_float_mxn || 0)}</span>
                <span className="text-muted-foreground">Entradas efectivo:</span>
                <span className="font-medium text-right">{fmt(movIn)}</span>
                <span className="text-muted-foreground">Salidas efectivo:</span>
                <span className="font-medium text-right">{fmt(movOut)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Efectivo esperado:</span>
                <span className="text-primary">{fmt(expectedCash)}</span>
              </div>
            </div>
          )}

          {closeStep === 2 && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>Efectivo contado MXN *</Label>
                <Input type="number" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} autoFocus />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Esperado:</span>
                <span className="font-medium">{fmt(expectedCash)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diferencia:</span>
                <span className={`font-bold ${variance === 0 ? "text-green-600" : "text-destructive"}`}>
                  {fmt(variance)}
                </span>
              </div>
              {variance !== 0 && (
                <div className="space-y-1.5">
                  <Label>Motivo de la diferencia *</Label>
                  <Textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} rows={2} />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {closeStep === 1 ? (
              <Button onClick={() => setCloseStep(2)}>Siguiente</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setCloseStep(1)}>Atrás</Button>
                <Button variant="destructive" onClick={handleClose} disabled={closeSession.isPending}>
                  {closeSession.isPending ? "Cerrando…" : "Confirmar Cierre"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
