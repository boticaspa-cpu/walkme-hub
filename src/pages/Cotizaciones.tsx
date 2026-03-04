import { useState, useEffect } from "react";
import { Plus, Search, FileText, Send, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-warning/10 text-warning",
};
const statusLabels: Record<string, string> = {
  draft: "Borrador", sent: "Enviada", accepted: "Aceptada", rejected: "Rechazada", expired: "Expirada",
};

const ZONES = ["Cancún", "Playa del Carmen", "Riviera Maya", "Tulum"];
const NATIONALITIES = ["Nacional", "Extranjero"];

interface QuoteItem {
  tour_id: string;
  qty_adults: number;
  qty_children: number;
  unit_price_mxn: number;
  unit_price_child_mxn: number;
  zone: string;
  nationality: string;
}

const emptyForm = { client_id: "", client_name: "", notes: "", status: "draft", quote_date: "" };

export default function Cotizaciones() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === "admin";

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<QuoteItem[]>([]);

  // mini-dialog client
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "" });

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: tours = [] } = useQuery({
    queryKey: ["tours-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("id, title, price_mxn").eq("active", true).order("title");
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

  // Auto-fill prices when tour+zone+nationality change
  const lookupPrice = (tourId: string, zone: string, nationality: string, paxType: string): number => {
    const v = allVariants.find(
      (v: any) => v.tour_id === tourId && v.zone === zone && v.nationality === nationality && v.pax_type === paxType
    );
    return v?.sale_price ?? 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const total_mxn = items.reduce((s, i) => s + i.qty_adults * i.unit_price_mxn + i.qty_children * i.unit_price_child_mxn, 0);
      const clientName = clients.find((c: any) => c.id === form.client_id)?.name ?? form.client_name;

      if (editingId) {
        const { error } = await supabase.from("quotes").update({
          client_id: form.client_id || null,
          client_name: clientName,
          notes: form.notes || null,
          status: form.status,
          total_mxn,
        }).eq("id", editingId);
        if (error) throw error;

        await supabase.from("quote_items").delete().eq("quote_id", editingId);
        if (items.length > 0) {
          const { error: ie } = await supabase.from("quote_items").insert(
            items.map(i => ({
              quote_id: editingId,
              tour_id: i.tour_id || null,
              qty: i.qty_adults + i.qty_children,
              qty_adults: i.qty_adults,
              qty_children: i.qty_children,
              unit_price_mxn: i.unit_price_mxn,
              unit_price_child_mxn: i.unit_price_child_mxn,
              zone: i.zone,
              nationality: i.nationality,
            }))
          );
          if (ie) throw ie;
        }
      } else {
        const { data, error } = await supabase.from("quotes").insert({
          client_id: form.client_id || null,
          client_name: clientName,
          notes: form.notes || null,
          status: "draft",
          total_mxn,
          created_by: user?.id,
        }).select("id").single();
        if (error) throw error;
        if (items.length > 0) {
          const { error: ie } = await supabase.from("quote_items").insert(
            items.map(i => ({
              quote_id: data.id,
              tour_id: i.tour_id || null,
              qty: i.qty_adults + i.qty_children,
              qty_adults: i.qty_adults,
              qty_children: i.qty_children,
              unit_price_mxn: i.unit_price_mxn,
              unit_price_child_mxn: i.unit_price_child_mxn,
              zone: i.zone,
              nationality: i.nationality,
            }))
          );
          if (ie) throw ie;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success(editingId ? "Cotización actualizada" : "Cotización creada");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveClientMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ name: clientForm.name, phone: clientForm.phone, email: clientForm.email || null, created_by: user?.id })
        .select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      setForm(p => ({ ...p, client_id: data.id }));
      toast.success("Cliente creado");
      setClientDialogOpen(false);
      setClientForm({ name: "", phone: "", email: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); setItems([]); };
  const openCreate = () => { setForm(emptyForm); setItems([]); setEditingId(null); setDialogOpen(true); };

  const openEdit = async (q: any) => {
    setForm({ client_id: q.client_id ?? "", client_name: q.client_name, notes: q.notes ?? "", status: q.status, quote_date: "" });
    setEditingId(q.id);
    const { data } = await supabase.from("quote_items").select("tour_id, qty_adults, qty_children, unit_price_mxn, unit_price_child_mxn, zone, nationality").eq("quote_id", q.id);
    setItems((data ?? []).map((i: any) => ({
      tour_id: i.tour_id ?? "",
      qty_adults: i.qty_adults ?? 1,
      qty_children: i.qty_children ?? 0,
      unit_price_mxn: i.unit_price_mxn ?? 0,
      unit_price_child_mxn: i.unit_price_child_mxn ?? 0,
      zone: i.zone ?? "",
      nationality: i.nationality ?? "",
    })));
    setDialogOpen(true);
  };

  const addItem = () => setItems(p => [...p, { tour_id: "", qty_adults: 1, qty_children: 0, unit_price_mxn: 0, unit_price_child_mxn: 0, zone: "", nationality: "" }]);
  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(p => p.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };

      // Auto-fill prices when tour+zone+nationality are set
      const tourId = field === "tour_id" ? value : updated.tour_id;
      const zone = field === "zone" ? value : updated.zone;
      const nat = field === "nationality" ? value : updated.nationality;

      if (tourId && zone && nat && (field === "tour_id" || field === "zone" || field === "nationality")) {
        updated.unit_price_mxn = lookupPrice(tourId, zone, nat, "Adulto");
        updated.unit_price_child_mxn = lookupPrice(tourId, zone, nat, "Niño");
      }

      return updated;
    }));
  };

  const total = items.reduce((s, i) => s + i.qty_adults * i.unit_price_mxn + i.qty_children * i.unit_price_child_mxn, 0);
  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const filtered = quotes.filter((q: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (q.folio ?? "").toLowerCase().includes(s) || (q.clients?.name ?? q.client_name ?? "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">Propuestas y presupuestos para clientes</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nueva Cotización</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar cotización..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Cargando…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No se encontraron cotizaciones</TableCell></TableRow>
                ) : filtered.map((q: any) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono text-xs font-bold">{q.folio ?? "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{q.clients?.name ?? q.client_name}</TableCell>
                    <TableCell className="text-sm font-semibold">{fmt(q.total_mxn)}</TableCell>
                    <TableCell>
                      <Badge className={`${statusStyles[q.status] ?? ""} border-0 text-xs`}>{statusLabels[q.status] ?? q.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(q)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver PDF"><FileText className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Enviar"><Send className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog crear/editar cotización */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cotización" : "Nueva Cotización"}</DialogTitle>
            <DialogDescription>{editingId ? "Modifica la cotización." : "El folio se genera automáticamente."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Cliente */}
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <div className="flex gap-2">
                <Select value={form.client_id} onValueChange={(v) => setForm(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" onClick={() => setClientDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label>Fecha de viaje</Label>
              <Input type="date" value={form.quote_date} onChange={(e) => setForm(p => ({ ...p, quote_date: e.target.value }))} />
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Líneas de cotización</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="mr-1 h-3 w-3" /> Agregar</Button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  {/* Row 1: Tour + delete */}
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Select value={item.tour_id} onValueChange={(v) => updateItem(idx, "tour_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar tour" /></SelectTrigger>
                        <SelectContent>
                          {tours.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Row 2: Zona + Nacionalidad */}
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={item.zone} onValueChange={(v) => updateItem(idx, "zone", v)}>
                      <SelectTrigger><SelectValue placeholder="Zona pickup" /></SelectTrigger>
                      <SelectContent>
                        {ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={item.nationality} onValueChange={(v) => updateItem(idx, "nationality", v)}>
                      <SelectTrigger><SelectValue placeholder="Nacionalidad" /></SelectTrigger>
                      <SelectContent>
                        {NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 3: Adultos + Precio adulto | Niños + Precio niño */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Adultos</Label>
                      <Input type="number" min={0} value={item.qty_adults} onChange={(e) => updateItem(idx, "qty_adults", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Precio adulto</Label>
                      <Input type="number" min={0} step="0.01" value={item.unit_price_mxn} onChange={(e) => updateItem(idx, "unit_price_mxn", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Niños</Label>
                      <Input type="number" min={0} value={item.qty_children} onChange={(e) => updateItem(idx, "qty_children", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Precio niño</Label>
                      <Input type="number" min={0} step="0.01" value={item.unit_price_child_mxn} onChange={(e) => updateItem(idx, "unit_price_child_mxn", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  {/* Subtotal línea */}
                  <p className="text-xs text-right text-muted-foreground">
                    Subtotal: {fmt(item.qty_adults * item.unit_price_mxn + item.qty_children * item.unit_price_child_mxn)}
                  </p>
                </div>
              ))}
              {items.length > 0 && (
                <p className="text-sm font-semibold text-right">Total: {fmt(total)}</p>
              )}
            </div>

            {/* Estado (solo edición) */}
            {editingId && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notas opcionales…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.client_id}>
              {saveMutation.isPending ? "Guardando…" : editingId ? "Actualizar" : "Crear Cotización"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mini-dialog Nuevo Cliente */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>Crea un cliente rápido para esta cotización.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={clientForm.name} onChange={(e) => setClientForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={clientForm.phone} onChange={(e) => setClientForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={clientForm.email} onChange={(e) => setClientForm(p => ({ ...p, email: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveClientMutation.mutate()} disabled={saveClientMutation.isPending || !clientForm.name.trim()}>
              {saveClientMutation.isPending ? "Guardando…" : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
