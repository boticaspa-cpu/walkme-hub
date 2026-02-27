import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, UserPlus, Pencil, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const triggerLabels: Record<string, string> = {
  manual: "Manual",
  reminder_1h: "Recordatorio 1h antes",
  welcome: "Bienvenida",
  protocol_10min: "Protocolo 10 min",
  post_tour: "Seguimiento post-tour",
};

const emptyTemplate = { name: "", body: "", trigger_event: "manual", active: true };

export default function Configuracion() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);

  // Exchange rates state
  const [rateUsd, setRateUsd] = useState("");
  const [rateEur, setRateEur] = useState("");
  const [rateCad, setRateCad] = useState("");

  // Users query
  const { data: users = [] } = useQuery({
    queryKey: ["config-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("id, full_name, approval_status").order("full_name");
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      return (profiles ?? []).map((p: any) => ({
        ...p,
        role: roles?.find((r: any) => r.user_id === p.id)?.role ?? "seller",
      }));
    },
  });

  // Settings query
  const { data: settings = [] } = useQuery({
    queryKey: ["settings-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings" as any)
        .select("key, value")
        .in("key", ["exchange_rate_usd", "exchange_rate_eur", "exchange_rate_cad"]);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  // Populate rate inputs when settings load
  useEffect(() => {
    if (settings.length > 0) {
      const get = (k: string) => settings.find((s: any) => s.key === k)?.value ?? "";
      setRateUsd(get("exchange_rate_usd"));
      setRateEur(get("exchange_rate_eur"));
      setRateCad(get("exchange_rate_cad"));
    }
  }, [settings]);

  const saveRatesMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { key: "exchange_rate_usd", value: rateUsd },
        { key: "exchange_rate_eur", value: rateEur },
        { key: "exchange_rate_cad", value: rateCad },
      ];
      for (const u of updates) {
        const { error } = await supabase
          .from("settings" as any)
          .update({ value: u.value, updated_by: user?.id, updated_at: new Date().toISOString() } as any)
          .eq("key", u.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-all"] });
      qc.invalidateQueries({ queryKey: ["settings-exchange-usd"] });
      toast.success("Tipos de cambio actualizados");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Templates query
  const { data: templates = [] } = useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("message_templates").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: templateForm.name,
        body: templateForm.body,
        trigger_event: templateForm.trigger_event,
        active: templateForm.active,
        ...(editingTemplateId ? {} : { created_by: user?.id }),
      };
      if (editingTemplateId) {
        const { error } = await supabase.from("message_templates").update(payload).eq("id", editingTemplateId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("message_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message-templates"] });
      toast.success(editingTemplateId ? "Plantilla actualizada" : "Plantilla creada");
      closeTemplateDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeTemplateDialog = () => { setTemplateDialogOpen(false); setEditingTemplateId(null); setTemplateForm(emptyTemplate); };
  const openCreateTemplate = () => { setTemplateForm(emptyTemplate); setEditingTemplateId(null); setTemplateDialogOpen(true); };
  const openEditTemplate = (t: any) => {
    setTemplateForm({ name: t.name, body: t.body, trigger_event: t.trigger_event, active: t.active });
    setEditingTemplateId(t.id);
    setTemplateDialogOpen(true);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-display">Configuración</h1>
        <p className="text-sm text-muted-foreground">Gestión de usuarios, tipos de cambio y plantillas</p>
      </div>

      {/* Users */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Usuarios del Sistema</CardTitle>
          <Button size="sm" disabled><UserPlus className="mr-2 h-4 w-4" /> Invitar Vendedor</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">{u.full_name?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{u.full_name || "Sin nombre"}</p>
                  <p className="text-xs text-muted-foreground">{u.approval_status}</p>
                </div>
              </div>
              <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs capitalize">{u.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" /> Tipos de Cambio del Operador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Define los tipos de cambio que se usan para calcular los precios sugeridos de los tours.</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">USD → MXN</Label>
              <Input type="number" step="0.01" value={rateUsd} onChange={(e) => setRateUsd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">EUR → MXN</Label>
              <Input type="number" step="0.01" value={rateEur} onChange={(e) => setRateEur(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CAD → MXN</Label>
              <Input type="number" step="0.01" value={rateCad} onChange={(e) => setRateCad(e.target.value)} />
            </div>
          </div>
          <Button size="sm" onClick={() => saveRatesMutation.mutate()} disabled={saveRatesMutation.isPending}>
            {saveRatesMutation.isPending ? "Guardando…" : "Guardar Tipos de Cambio"}
          </Button>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Plantillas de Mensajes</CardTitle>
          <Button size="sm" variant="outline" onClick={openCreateTemplate}><Plus className="mr-2 h-4 w-4" /> Nueva Plantilla</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay plantillas creadas</p>
            ) : templates.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <span className="text-sm font-medium">{t.name}</span>
                  <p className="text-xs text-muted-foreground">{triggerLabels[t.trigger_event] ?? t.trigger_event}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t.active ? "Activa" : "Inactiva"}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTemplate(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={(open) => { if (!open) closeTemplateDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTemplateId ? "Editar Plantilla" : "Nueva Plantilla"}</DialogTitle>
            <DialogDescription>Configura el nombre, contenido y evento de activación.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={templateForm.name} onChange={(e) => setTemplateForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Contenido</Label><Textarea rows={4} value={templateForm.body} onChange={(e) => setTemplateForm(p => ({ ...p, body: e.target.value }))} placeholder="Texto del mensaje…" /></div>
            <div className="space-y-1.5">
              <Label>Evento</Label>
              <Select value={templateForm.trigger_event} onValueChange={(v) => setTemplateForm(p => ({ ...p, trigger_event: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={templateForm.active} onCheckedChange={(v) => setTemplateForm(p => ({ ...p, active: v }))} />
              <Label>Activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTemplateDialog}>Cancelar</Button>
            <Button onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending || !templateForm.name.trim()}>
              {saveTemplateMutation.isPending ? "Guardando…" : editingTemplateId ? "Actualizar" : "Crear Plantilla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
