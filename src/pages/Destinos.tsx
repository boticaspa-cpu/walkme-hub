import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DestinationRow {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
  tours: { count: number }[];
}

interface DestinationForm {
  name: string;
  slug: string;
}

const emptyForm: DestinationForm = { name: "", slug: "" };

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function Destinos() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DestinationForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("destinations")
        .select("*, tours(count)")
        .order("name");
      if (error) throw error;
      return data as DestinationRow[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from("destinations").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (dest: DestinationRow) => {
    setEditingId(dest.id);
    setForm({ name: dest.name, slug: dest.slug });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm({ name, slug: generateSlug(name) });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), slug: form.slug || generateSlug(form.name) };
      if (editingId) {
        const { error } = await (supabase as any).from("destinations").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Destino actualizado");
      } else {
        const { error } = await (supabase as any).from("destinations").insert(payload);
        if (error) throw error;
        toast.success("Destino creado");
      }
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Destinos</h1>
          <p className="text-sm text-muted-foreground">Destinos turísticos del catálogo</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Destino
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Cargando…</p>
      ) : destinations.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay destinos</p>
      ) : (
        <div className="space-y-2">
          {destinations.map((dest) => (
            <Card key={dest.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm">{dest.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{dest.slug} • {dest.tours?.[0]?.count ?? 0} tours
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={dest.active ? "default" : "secondary"} className="text-xs">
                    {dest.active ? "Activo" : "Inactivo"}
                  </Badge>
                  {isAdmin && (
                    <>
                      <Switch
                        checked={dest.active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: dest.id, active: checked })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(dest)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Destino" : "Nuevo Destino"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos del destino." : "Ingresa el nombre del nuevo destino."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear destino"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
