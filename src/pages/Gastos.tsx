import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, CheckCircle, Upload, Receipt, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

/* ── types ─────────────────────────────────────────────── */

interface ExpenseConcept {
  id: string;
  name: string;
  category: string | null;
  expense_type: "fixed" | "variable";
  frequency: "monthly" | "one_time";
  default_due_day: number | null;
  default_due_date: string | null;
  estimated_amount_mxn: number;
  active: boolean;
  notes: string | null;
  created_at: string;
}

interface ExpenseItem {
  id: string;
  concept_id: string;
  period_month: string;
  due_date: string;
  estimated_amount_mxn: number;
  status: "planned" | "paid";
  paid_amount_mxn: number | null;
  paid_at: string | null;
  payment_method: string | null;
  reference: string | null;
  proof_image_path: string | null;
  proof_image_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  expense_concepts?: ExpenseConcept;
}

interface ConceptForm {
  name: string;
  category: string;
  expense_type: "fixed" | "variable";
  frequency: "monthly" | "one_time";
  default_due_day: string;
  default_due_date: string;
  estimated_amount_mxn: string;
  notes: string;
}

const emptyConceptForm: ConceptForm = {
  name: "", category: "", expense_type: "fixed", frequency: "monthly",
  default_due_day: "", default_due_date: "", estimated_amount_mxn: "", notes: "",
};

const CATEGORIES = ["Renta", "Servicios", "Impuestos", "Comisiones", "Nómina", "Otros"];
const PIE_COLORS = ["hsl(var(--primary))", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

function currentMonth() {
  return format(new Date(), "yyyy-MM");
}

function monthLabel(ym: string) {
  const d = parse(ym + "-01", "yyyy-MM-dd", new Date());
  return format(d, "MMMM yyyy", { locale: es });
}

function monthOptions(n = 12) {
  const opts: string[] = [];
  const now = new Date();
  for (let i = -1; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(format(d, "yyyy-MM"));
  }
  return opts;
}

function fmtMXN(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

/* ── main ──────────────────────────────────────────────── */

export default function Gastos() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const qc = useQueryClient();

  if (!isAdmin) {
    return <p className="p-8 text-muted-foreground">Acceso restringido a administradores.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display">Gastos</h1>
        <p className="text-sm text-muted-foreground">Control de gastos operativos</p>
      </div>
      <Tabs defaultValue="mes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conceptos"><Receipt className="h-4 w-4 mr-1" />Conceptos</TabsTrigger>
          <TabsTrigger value="mes"><BarChart3 className="h-4 w-4 mr-1" />Mes</TabsTrigger>
          <TabsTrigger value="reportes"><TrendingUp className="h-4 w-4 mr-1" />Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="conceptos"><ConceptosTab qc={qc} /></TabsContent>
        <TabsContent value="mes"><MesTab qc={qc} userId={user?.id} /></TabsContent>
        <TabsContent value="reportes"><ReportesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: CONCEPTOS
   ═══════════════════════════════════════════════════════ */

function ConceptosTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConceptForm>(emptyConceptForm);
  const [saving, setSaving] = useState(false);

  const { data: concepts = [], isLoading } = useQuery({
    queryKey: ["expense-concepts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("expense_concepts").select("*").order("name");
      if (error) throw error;
      return data as ExpenseConcept[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from("expense_concepts").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expense-concepts"] }); toast.success("Estado actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => { setEditingId(null); setForm(emptyConceptForm); setDialogOpen(true); };
  const openEdit = (c: ExpenseConcept) => {
    setEditingId(c.id);
    setForm({
      name: c.name, category: c.category ?? "", expense_type: c.expense_type,
      frequency: c.frequency, default_due_day: c.default_due_day?.toString() ?? "",
      default_due_date: c.default_due_date ?? "", estimated_amount_mxn: c.estimated_amount_mxn.toString(),
      notes: c.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        category: form.category || null,
        expense_type: form.expense_type,
        frequency: form.frequency,
        default_due_day: form.default_due_day ? parseInt(form.default_due_day) : null,
        default_due_date: form.default_due_date || null,
        estimated_amount_mxn: parseFloat(form.estimated_amount_mxn) || 0,
        notes: form.notes || null,
      };
      if (editingId) {
        const { error } = await (supabase as any).from("expense_concepts").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Concepto actualizado");
      } else {
        const { error } = await (supabase as any).from("expense_concepts").insert(payload);
        if (error) throw error;
        toast.success("Concepto creado");
      }
      qc.invalidateQueries({ queryKey: ["expense-concepts"] });
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message ?? "Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo Concepto</Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Cargando…</p>
      ) : concepts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay conceptos registrados</p>
      ) : (
        <div className="space-y-2">
          {concepts.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">{c.name}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {c.category && <span>{c.category}</span>}
                    <Badge variant="outline" className="text-[10px]">{c.expense_type === "fixed" ? "Fijo" : "Variable"}</Badge>
                    <Badge variant="outline" className="text-[10px]">{c.frequency === "monthly" ? "Mensual" : "Único"}</Badge>
                    {c.default_due_day && <span>Día {c.default_due_day}</span>}
                    <span>{fmtMXN(c.estimated_amount_mxn)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={c.active ? "default" : "secondary"} className="text-xs">{c.active ? "Activo" : "Inactivo"}</Badge>
                  <Switch checked={c.active} onCheckedChange={(v) => toggleActive.mutate({ id: c.id, active: v })} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Concepto" : "Nuevo Concepto"}</DialogTitle>
            <DialogDescription>{editingId ? "Modifica los datos del concepto." : "Registra un nuevo concepto de gasto."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.expense_type} onValueChange={(v: any) => setForm({ ...form, expense_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="fixed">Fijo</SelectItem><SelectItem value="variable">Variable</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Frecuencia</Label>
                <Select value={form.frequency} onValueChange={(v: any) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Mensual</SelectItem><SelectItem value="one_time">Único</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {form.frequency === "monthly" ? (
                <div className="space-y-1.5"><Label>Día de pago (1-31)</Label><Input type="number" min={1} max={31} value={form.default_due_day} onChange={(e) => setForm({ ...form, default_due_day: e.target.value })} /></div>
              ) : (
                <div className="space-y-1.5"><Label>Fecha pago</Label><Input type="date" value={form.default_due_date} onChange={(e) => setForm({ ...form, default_due_date: e.target.value })} /></div>
              )}
              <div className="space-y-1.5"><Label>Estimado MXN</Label><Input type="number" value={form.estimated_amount_mxn} onChange={(e) => setForm({ ...form, estimated_amount_mxn: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando…" : editingId ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: MES
   ═══════════════════════════════════════════════════════ */

function MesTab({ qc, userId }: { qc: ReturnType<typeof useQueryClient>; userId?: string }) {
  const [month, setMonth] = useState(currentMonth());
  const months = useMemo(() => monthOptions(12), []);

  // concepts
  const { data: concepts = [] } = useQuery({
    queryKey: ["expense-concepts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("expense_concepts").select("*").order("name");
      if (error) throw error;
      return data as ExpenseConcept[];
    },
  });

  // items for month
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["expense-items", month],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("expense_items")
        .select("*, expense_concepts(*)")
        .eq("period_month", month)
        .order("due_date");
      if (error) throw error;
      return data as ExpenseItem[];
    },
  });

  // auto-generate missing monthly items
  useEffect(() => {
    if (!concepts.length) return;
    const activeMonthlyConcepts = concepts.filter((c) => c.active && c.frequency === "monthly");
    const existingConceptIds = new Set(items.map((i) => i.concept_id));
    const missing = activeMonthlyConcepts.filter((c) => !existingConceptIds.has(c.id));
    if (!missing.length) return;

    const [yyyy, mm] = month.split("-").map(Number);
    const toInsert = missing.map((c) => {
      const day = Math.min(c.default_due_day ?? 1, new Date(yyyy, mm, 0).getDate());
      return {
        concept_id: c.id,
        period_month: month,
        due_date: `${yyyy}-${String(mm).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        estimated_amount_mxn: c.estimated_amount_mxn,
        status: "planned" as const,
        created_by: userId ?? null,
      };
    });

    (async () => {
      const { error } = await (supabase as any).from("expense_items").insert(toInsert);
      if (!error) refetch();
    })();
  }, [concepts, items, month, userId, refetch]);

  // pay dialog
  const [payDialog, setPayDialog] = useState(false);
  const [payingItem, setPayingItem] = useState<ExpenseItem | null>(null);
  const [payForm, setPayForm] = useState({ paid_amount_mxn: "", paid_at: "", payment_method: "bank_transfer", reference: "", notes: "" });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [payingSaving, setPayingSaving] = useState(false);

  const openPay = (item: ExpenseItem) => {
    setPayingItem(item);
    setPayForm({
      paid_amount_mxn: item.estimated_amount_mxn.toString(),
      paid_at: format(new Date(), "yyyy-MM-dd"),
      payment_method: "bank_transfer",
      reference: "", notes: item.notes ?? "",
    });
    setProofFile(null);
    setPayDialog(true);
  };

  const handlePay = async () => {
    if (!payingItem) return;
    setPayingSaving(true);
    try {
      let proof_image_path: string | null = null;
      let proof_image_url: string | null = null;

      if (proofFile) {
        const ext = proofFile.name.split(".").pop();
        const path = `${payingItem.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("expense-proofs").upload(path, proofFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        proof_image_path = path;
        const { data: urlData } = await supabase.storage.from("expense-proofs").createSignedUrl(path, 60 * 60 * 24 * 365);
        proof_image_url = urlData?.signedUrl ?? null;
      }

      const update: any = {
        status: "paid",
        paid_amount_mxn: parseFloat(payForm.paid_amount_mxn) || 0,
        paid_at: payForm.paid_at || new Date().toISOString(),
        payment_method: payForm.payment_method,
        reference: payForm.reference || null,
        notes: payForm.notes || null,
      };
      if (proof_image_path) { update.proof_image_path = proof_image_path; update.proof_image_url = proof_image_url; }

      const { error } = await (supabase as any).from("expense_items").update(update).eq("id", payingItem.id);
      if (error) throw error;
      toast.success("Gasto marcado como pagado");
      qc.invalidateQueries({ queryKey: ["expense-items", month] });
      setPayDialog(false);
    } catch (e: any) { toast.error(e.message ?? "Error"); }
    finally { setPayingSaving(false); }
  };

  // edit estimated dialog
  const [editEstDialog, setEditEstDialog] = useState(false);
  const [editEstItem, setEditEstItem] = useState<ExpenseItem | null>(null);
  const [editEstValue, setEditEstValue] = useState("");

  const openEditEst = (item: ExpenseItem) => {
    setEditEstItem(item);
    setEditEstValue(item.estimated_amount_mxn.toString());
    setEditEstDialog(true);
  };

  const handleEditEst = async () => {
    if (!editEstItem) return;
    const { error } = await (supabase as any).from("expense_items")
      .update({ estimated_amount_mxn: parseFloat(editEstValue) || 0 }).eq("id", editEstItem.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estimado actualizado");
    qc.invalidateQueries({ queryKey: ["expense-items", month] });
    setEditEstDialog(false);
  };

  const totalEstimated = items.reduce((s, i) => s + Number(i.estimated_amount_mxn), 0);
  const totalPaid = items.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.paid_amount_mxn ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>{months.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Estimado: <strong>{fmtMXN(totalEstimated)}</strong></span>
          <span className="text-muted-foreground">Pagado: <strong className="text-green-600">{fmtMXN(totalPaid)}</strong></span>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Cargando…</p>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Vence</TableHead>
                <TableHead className="text-right">Estimado</TableHead>
                <TableHead className="hidden md:table-cell text-right">Pagado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin gastos este mes</TableCell></TableRow>
              ) : items.map((item) => {
                const concept = item.expense_concepts;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-sm">
                      {concept?.name ?? "—"}
                      <p className="sm:hidden text-xs text-muted-foreground">{item.due_date}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{concept?.category ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{concept?.expense_type === "fixed" ? "Fijo" : "Var"}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">{item.due_date}</TableCell>
                    <TableCell className="text-right text-sm">{fmtMXN(item.estimated_amount_mxn)}</TableCell>
                    <TableCell className="hidden md:table-cell text-right text-sm">{item.status === "paid" ? fmtMXN(item.paid_amount_mxn) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "paid" ? "default" : "secondary"} className="text-xs">
                        {item.status === "paid" ? "Pagado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {item.status === "planned" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEditEst(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="default" size="sm" onClick={() => openPay(item)}><CheckCircle className="h-3.5 w-3.5 mr-1" /><span className="hidden sm:inline">Pagar</span></Button>
                        </>
                      )}
                      {item.status === "paid" && item.proof_image_url && (
                        <a href={item.proof_image_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm"><Upload className="h-3.5 w-3.5" /></Button>
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pay dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Marcar Pagado</DialogTitle><DialogDescription>{payingItem?.expense_concepts?.name}</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5"><Label>Monto pagado *</Label><Input type="number" value={payForm.paid_amount_mxn} onChange={(e) => setPayForm({ ...payForm, paid_amount_mxn: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Fecha de pago</Label><Input type="date" value={payForm.paid_at} onChange={(e) => setPayForm({ ...payForm, paid_at: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Método</Label>
              <Select value={payForm.payment_method} onValueChange={(v) => setPayForm({ ...payForm, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="bank_transfer">Transferencia</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Referencia</Label><Input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Comprobante (imagen)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1.5"><Label>Notas</Label><Textarea value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(false)}>Cancelar</Button>
            <Button onClick={handlePay} disabled={payingSaving}>{payingSaving ? "Guardando…" : "Confirmar pago"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit estimated dialog */}
      <Dialog open={editEstDialog} onOpenChange={setEditEstDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Editar Estimado</DialogTitle><DialogDescription>{editEstItem?.expense_concepts?.name}</DialogDescription></DialogHeader>
          <div className="space-y-1.5 py-2"><Label>Monto estimado MXN</Label><Input type="number" value={editEstValue} onChange={(e) => setEditEstValue(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEstDialog(false)}>Cancelar</Button>
            <Button onClick={handleEditEst}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: REPORTES
   ═══════════════════════════════════════════════════════ */

function ReportesTab() {
  const [range, setRange] = useState(6);
  const months = useMemo(() => {
    const opts: string[] = [];
    const now = new Date();
    for (let i = 0; i < range; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push(format(d, "yyyy-MM"));
    }
    return opts.reverse();
  }, [range]);

  const { data: allItems = [] } = useQuery({
    queryKey: ["expense-items-report", range],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("expense_items")
        .select("*, expense_concepts(*)")
        .in("period_month", months)
        .order("period_month");
      if (error) throw error;
      return data as ExpenseItem[];
    },
    enabled: months.length > 0,
  });

  // bar chart data
  const barData = useMemo(() => {
    return months.map((m) => {
      const monthItems = allItems.filter((i) => i.period_month === m && i.status === "paid");
      const fixed = monthItems.filter((i) => i.expense_concepts?.expense_type === "fixed").reduce((s, i) => s + Number(i.paid_amount_mxn ?? 0), 0);
      const variable = monthItems.filter((i) => i.expense_concepts?.expense_type === "variable").reduce((s, i) => s + Number(i.paid_amount_mxn ?? 0), 0);
      return { month: monthLabel(m), fijos: fixed, variables: variable, total: fixed + variable };
    });
  }, [allItems, months]);

  // pie data — current month category distribution
  const pieData = useMemo(() => {
    const cm = months[months.length - 1];
    const monthItems = allItems.filter((i) => i.period_month === cm && i.status === "paid");
    const byCat: Record<string, number> = {};
    monthItems.forEach((i) => {
      const cat = i.expense_concepts?.category ?? "Otros";
      byCat[cat] = (byCat[cat] ?? 0) + Number(i.paid_amount_mxn ?? 0);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [allItems, months]);

  // summary
  const latestMonth = months[months.length - 1];
  const latestItems = allItems.filter((i) => i.period_month === latestMonth);
  const totalMonth = latestItems.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.paid_amount_mxn ?? 0), 0);
  const totalFixed = latestItems.filter((i) => i.status === "paid" && i.expense_concepts?.expense_type === "fixed").reduce((s, i) => s + Number(i.paid_amount_mxn ?? 0), 0);
  const totalVariable = totalMonth - totalFixed;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={range.toString()} onValueChange={(v) => setRange(parseInt(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total {monthLabel(latestMonth)}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{fmtMXN(totalMonth)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Fijos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{fmtMXN(totalFixed)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Variables</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{fmtMXN(totalVariable)}</p></CardContent></Card>
      </div>

      {/* stacked bar chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Gastos por mes (Fijos vs Variables)</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtMXN(v)} />
              <Legend />
              <Bar dataKey="fijos" stackId="a" fill="hsl(var(--primary))" name="Fijos" />
              <Bar dataKey="variables" stackId="a" fill="#f97316" name="Variables" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* pie chart */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Distribución por categoría — {monthLabel(latestMonth)}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtMXN(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
