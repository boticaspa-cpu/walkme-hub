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

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
  tours: { count: number }[];
}

interface CategoryForm {
  name: string;
  slug: string;
}

const emptyForm: CategoryForm = { name: "", slug: "" };

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function Categorias() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, tours(count)")
        .order("name");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("categories").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug });
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
        const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Categoría actualizada");
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        toast.success("Categoría creada");
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
          <h1 className="text-2xl font-bold font-display">Categorías</h1>
          <p className="text-sm text-muted-foreground">Categorías de tours del catálogo</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Cargando…</p>
      ) : categories.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay categorías</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{cat.slug} • {cat.tours?.[0]?.count ?? 0} tours
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cat.active ? "default" : "secondary"} className="text-xs">
                    {cat.active ? "Activa" : "Inactiva"}
                  </Badge>
                  {isAdmin && (
                    <>
                      <Switch
                        checked={cat.active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: cat.id, active: checked })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
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
            <DialogTitle>{editingId ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos de la categoría." : "Ingresa el nombre de la nueva categoría."}
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
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
