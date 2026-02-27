import { useState } from "react";
import { Plus, Search, Filter, Pencil } from "lucide-react";
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

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-warning/10 text-warning",
  interested: "bg-accent/10 text-accent-foreground",
  quoted: "bg-secondary/10 text-secondary-foreground",
  won: "bg-green-100 text-green-700",
  lost: "bg-destructive/10 text-destructive",
};
const statusLabels: Record<string, string> = {
  new: "Nuevo", contacted: "Contactado", interested: "Interesado",
  quoted: "Cotizado", won: "Ganado", lost: "Perdido",
};

const emptyForm = {
  name: "", phone: "", origin: "Walk-in", destination: "", travel_date: "",
  pax: 1, budget: "", notes: "", status: "new", assigned_to: "",
};

export default function Leads() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === "admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, profiles:assigned_to(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, phone: form.phone, origin: form.origin,
        destination: form.destination, travel_date: form.travel_date || null,
        pax: form.pax, budget: form.budget || null, notes: form.notes || null,
        status: form.status, assigned_to: form.assigned_to || null,
      };
      if (editingId) {
        const { error } = await supabase.from("leads").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leads").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(editingId ? "Lead actualizado" : "Lead creado");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };
  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (l: any) => {
    setForm({
      name: l.name, phone: l.phone ?? "", origin: l.origin, destination: l.destination,
      travel_date: l.travel_date ?? "", pax: l.pax, budget: l.budget ?? "",
      notes: l.notes ?? "", status: l.status, assigned_to: l.assigned_to ?? "",
    });
    setEditingId(l.id);
    setDialogOpen(true);
  };

  const filtered = leads.filter((l: any) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !l.destination.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Leads</h1>
          <p className="text-sm text-muted-foreground">Gestión de prospectos y seguimiento</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Lead</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o destino..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Cargando…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Destino</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="hidden lg:table-cell">Pax</TableHead>
                  <TableHead className="hidden lg:table-cell">Presupuesto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Asignado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No se encontraron leads</TableCell></TableRow>
                ) : filtered.map((lead: any) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{lead.destination}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{lead.travel_date ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{lead.pax}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm font-medium">{lead.budget ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[lead.status] ?? ""} border-0 text-xs`}>{statusLabels[lead.status] ?? lead.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{lead.profiles?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lead)}><Pencil className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Lead" : "Nuevo Lead"}</DialogTitle>
            <DialogDescription>{editingId ? "Modifica los datos del lead." : "Completa los datos del nuevo lead."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Origen</Label><Input value={form.origin} onChange={(e) => setForm(p => ({ ...p, origin: e.target.value }))} placeholder="Instagram, Web, Walk-in…" /></div>
              <div className="space-y-1.5"><Label>Destino</Label><Input value={form.destination} onChange={(e) => setForm(p => ({ ...p, destination: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Fecha viaje</Label><Input type="date" value={form.travel_date} onChange={(e) => setForm(p => ({ ...p, travel_date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Pax</Label><Input type="number" min={1} value={form.pax} onChange={(e) => setForm(p => ({ ...p, pax: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-1.5"><Label>Presupuesto</Label><Input value={form.budget} onChange={(e) => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="$5,000 MXN" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Asignado a</Label>
                <Select value={form.assigned_to} onValueChange={(v) => setForm(p => ({ ...p, assigned_to: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notas opcionales…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim()}>
              {saveMutation.isPending ? "Guardando…" : editingId ? "Actualizar" : "Crear Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
