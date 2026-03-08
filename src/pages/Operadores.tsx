import { useState, useRef } from "react";
import { Plus, Search, Upload, Pencil, FileSpreadsheet } from "lucide-react";
import PriceListImportDialog from "@/components/operators/PriceListImportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

type Operator = Tables<"operators"> & { tours: { count: number }[] };

interface OperatorForm {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  tags: string;
  exchange_rate: string;
  base_currency: string;
  payment_rules: string;
  fee_collection_mode: string;
}

const emptyForm: OperatorForm = {
  name: "", contact_name: "", phone: "", email: "", tags: "",
  exchange_rate: "1", base_currency: "USD", payment_rules: "prepago",
  fee_collection_mode: "agency",
};

export default function Operadores() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OperatorForm>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [priceListOp, setPriceListOp] = useState<{ id: string; name: string } | null>(null);

  const { data: operators = [], isLoading } = useQuery({
    queryKey: ["operators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operators")
        .select("*, tours(count)")
        .order("name");
      if (error) throw error;
      return data as Operator[];
    },
  });

  const filtered = operators.filter((op) =>
    op.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("operators").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (op: Operator) => {
    setEditingId(op.id);
    setForm({
      name: op.name,
      contact_name: op.contact_name,
      phone: op.phone,
      email: op.email ?? "",
      tags: op.tags.join(", "),
      exchange_rate: String(op.exchange_rate ?? 1),
      base_currency: op.base_currency ?? "USD",
      payment_rules: op.payment_rules ?? "prepago",
      fee_collection_mode: (op as any).fee_collection_mode ?? "agency",
    });
    setLogoPreview(op.logo_url);
    setLogoFile(null);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      let logo_url: string | undefined;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `operators/logos/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("media")
          .upload(path, logoFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
        logo_url = urlData.publicUrl;
      }

      const payload = {
        name: form.name.trim(),
        contact_name: form.contact_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        exchange_rate: Number(form.exchange_rate) || 1,
        base_currency: form.base_currency,
        payment_rules: form.payment_rules,
        ...(logo_url ? { logo_url } : {}),
      };

      if (editingId) {
        const { error } = await supabase.from("operators").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Operador actualizado");
      } else {
        const { error } = await supabase.from("operators").insert(payload);
        if (error) throw error;
        toast.success("Operador creado");
      }

      queryClient.invalidateQueries({ queryKey: ["operators"] });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Operadores</h1>
          <p className="text-sm text-muted-foreground">Proveedores de tours y sus configuraciones</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /><span className="hidden sm:inline">Nuevo Operador</span><span className="sm:hidden">Nuevo</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar operador..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-center text-muted-foreground">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">No se encontraron operadores</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                  <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                  <TableHead>Tours</TableHead>
                  <TableHead className="hidden lg:table-cell">Moneda</TableHead>
                  <TableHead className="hidden lg:table-cell">T.C.</TableHead>
                  <TableHead className="hidden xl:table-cell">Pago</TableHead>
                  {isAdmin && <TableHead className="w-24">Activo</TableHead>}
                  {isAdmin && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {op.logo_url && (
                          <img src={op.logo_url} alt="" className="h-6 w-6 rounded object-cover" />
                        )}
                        {op.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{op.contact_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{op.phone}</TableCell>
                    <TableCell>{op.tours?.[0]?.count ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="text-[10px]">{op.base_currency}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{op.exchange_rate}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Badge variant="secondary" className="text-[10px]">{op.payment_rules}</Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Switch
                          checked={op.active}
                          onCheckedChange={(checked) =>
                            toggleActive.mutate({ id: op.id, active: checked })
                          }
                        />
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(op)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Mapear Lista de Precios"
                            onClick={() => setPriceListOp({ id: op.id, name: op.name })}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Operador" : "Nuevo Operador"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos del operador." : "Ingresa los datos del nuevo operador."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Contacto</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            {/* New v2 fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de Cambio</Label>
                <Input type="number" value={form.exchange_rate} onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Moneda Base</Label>
                <Select value={form.base_currency} onValueChange={(v) => setForm({ ...form, base_currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Regla de Pago</Label>
                <Select value={form.payment_rules} onValueChange={(v) => setForm({ ...form, payment_rules: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prepago">Prepago</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tags (separados por coma)</Label>
              <Input
                placeholder="Bilingüe, Premium, Eco-friendly"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {logoPreview && (
                  <img src={logoPreview} alt="preview" className="h-10 w-10 rounded object-cover border" />
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Subir imagen
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear operador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price List Import Dialog */}
      {priceListOp && (
        <PriceListImportDialog
          open={!!priceListOp}
          onOpenChange={(v) => { if (!v) setPriceListOp(null); }}
          operator={priceListOp}
        />
      )}
    </div>
  );
}
