import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, FileText, Send, Pencil, Trash2, CheckCircle, ExternalLink, MoreVertical } from "lucide-react";
import DateRangeFilter from "@/components/shared/DateRangeFilter";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SendQuoteDialog from "@/components/cotizaciones/SendQuoteDialog";
import AcceptQuoteDialog from "@/components/cotizaciones/AcceptQuoteDialog";
import DiscountInput from "@/components/shared/DiscountInput";
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
  draft: "Borrador", sent: "Enviada", accepted: "Aceptada", rejected: "Cancelada", expired: "Expirada",
};

const ZONES = ["Cancún", "Playa del Carmen", "Riviera Maya", "Tulum"];
const NATIONALITIES = ["Nacional", "Extranjero"];

interface QuoteItem {
  tour_id: string;
  tour_date: string;
  qty_adults: number;
  qty_children: number;
  unit_price_mxn: number;
  unit_price_child_mxn: number;
  zone: string;
  nationality: string;
  package_name: string;
}

const emptyForm = { client_id: "", client_name: "", notes: "", status: "draft", discount_mxn: 0 };

export default function Cotizaciones() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<QuoteItem[]>([]);

  // Send & Accept dialogs
  const [sendQuote, setSendQuote] = useState<any>(null);
  const [acceptQuote, setAcceptQuote] = useState<any>(null);

  // mini-dialog client
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "" });

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes", role, user?.id],
    queryFn: async () => {
      let q = supabase.from("quotes").select("*, clients(name)").order("created_at", { ascending: false });
      if (role === "seller") q = q.eq("created_by", user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
      const { data, error } = await supabase.from("tours").select("id, title, price_mxn, suggested_price_mxn").eq("active", true).order("title");
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
        .select("tour_id, zone, nationality, pax_type, sale_price, package_name")
        .eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  // Load tour_packages for package dropdown (keyed by tour_id)
  const { data: allTourPackages = [] } = useQuery({
    queryKey: ["tour-packages-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_packages")
        .select("tour_id, name, price_adult_mxn, price_child_mxn")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Packages for a tour (from tour_packages, independent of zone/nationality)
  const getPackages = (tourId: string) =>
    allTourPackages.filter((p: any) => p.tour_id === tourId);

  // Price lookup: variant matrix → tour_packages → tour base
  const lookupPrice = (tourId: string, zone: string, nationality: string, paxType: string, packageName?: string): number => {
    // 1. Exact variant match (needs zone + nationality)
    if (packageName && zone && nationality) {
      const v = allVariants.find(
        (v: any) => v.tour_id === tourId && v.zone === zone && v.nationality === nationality && v.pax_type === paxType && v.package_name === packageName
      );
      if (v?.sale_price) return v.sale_price;
    }
    // 2. General variant (no package, needs zone + nationality)
    if (zone && nationality) {
      const v = allVariants.find(
        (v: any) => v.tour_id === tourId && v.zone === zone && v.nationality === nationality && v.pax_type === paxType && !v.package_name
      );
      if (v?.sale_price) return v.sale_price;
    }
    // 3. tour_packages price (available as soon as package is selected)
    if (packageName) {
      const pkg = allTourPackages.find((p: any) => p.tour_id === tourId && p.name === packageName);
      if (pkg) return paxType === "Menor" ? (pkg as any).price_child_mxn ?? 0 : (pkg as any).price_adult_mxn ?? 0;
    }
    // 4. Tour base price
    const tour = tours.find((t: any) => t.id === tourId);
    if (!tour) return 0;
    return paxType === "Menor" ? (tour as any).suggested_price_mxn ?? 0 : (tour as any).price_mxn ?? 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const subtotal = items.reduce((s, i) => s + i.qty_adults * i.unit_price_mxn + i.qty_children * i.unit_price_child_mxn, 0);
      const total_mxn = Math.max(0, subtotal - (form.discount_mxn || 0));
      const clientName = clients.find((c: any) => c.id === form.client_id)?.name ?? form.client_name;

      if (editingId) {
        const { error } = await supabase.from("quotes").update({
          client_id: form.client_id || null,
          client_name: clientName,
          notes: form.notes || null,
          status: form.status,
          total_mxn,
          discount_mxn: form.discount_mxn || 0,
        } as any).eq("id", editingId);
        if (error) throw error;

        await supabase.from("quote_items").delete().eq("quote_id", editingId);
        if (items.length > 0) {
          const { error: ie } = await supabase.from("quote_items").insert(
            items.map(i => ({
              quote_id: editingId,
              tour_id: i.tour_id || null,
              tour_date: i.tour_date || null,
              qty: i.qty_adults + i.qty_children,
              qty_adults: i.qty_adults,
              qty_children: i.qty_children,
              unit_price_mxn: i.unit_price_mxn,
              unit_price_child_mxn: i.unit_price_child_mxn,
              zone: i.zone,
              nationality: i.nationality,
              package_name: i.package_name || null,
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
          discount_mxn: form.discount_mxn || 0,
          created_by: user?.id,
        } as any).select("id").single();
        if (error) throw error;
        if (items.length > 0) {
          const { error: ie } = await supabase.from("quote_items").insert(
            items.map(i => ({
              quote_id: data.id,
              tour_id: i.tour_id || null,
              tour_date: i.tour_date || null,
              qty: i.qty_adults + i.qty_children,
              qty_adults: i.qty_adults,
              qty_children: i.qty_children,
              unit_price_mxn: i.unit_price_mxn,
              unit_price_child_mxn: i.unit_price_child_mxn,
              zone: i.zone,
              nationality: i.nationality,
              package_name: i.package_name || null,
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

  // ── Detect ?tour_id= query param to open create dialog with tour pre-selected ──
  useEffect(() => {
    const tourId = searchParams.get("tour_id");
    if (tourId && tours.length > 0) {
      const tour = tours.find((t: any) => t.id === tourId);
      if (tour) {
        setForm({ ...emptyForm });
        setItems([{
          tour_id: tourId,
          tour_date: "",
          qty_adults: 1,
          qty_children: 0,
          unit_price_mxn: (tour as any).price_mxn ?? 0,
          unit_price_child_mxn: (tour as any).suggested_price_mxn ?? 0,
          zone: "",
          nationality: "",
          package_name: "",
        }]);
        setEditingId(null);
        setDialogOpen(true);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, tours]);

  const openEdit = async (q: any) => {
    setForm({ client_id: q.client_id ?? "", client_name: q.client_name, notes: q.notes ?? "", status: q.status, discount_mxn: (q as any).discount_mxn ?? 0 });
    setEditingId(q.id);
    const { data } = await supabase.from("quote_items").select("tour_id, tour_date, qty_adults, qty_children, unit_price_mxn, unit_price_child_mxn, zone, nationality, package_name").eq("quote_id", q.id);
    setItems((data ?? []).map((i: any) => ({
      tour_id: i.tour_id ?? "",
      tour_date: i.tour_date ?? "",
      qty_adults: i.qty_adults ?? 1,
      qty_children: i.qty_children ?? 0,
      unit_price_mxn: i.unit_price_mxn ?? 0,
      unit_price_child_mxn: i.unit_price_child_mxn ?? 0,
      zone: i.zone ?? "",
      nationality: i.nationality ?? "",
      package_name: i.package_name ?? "",
    })));
    setDialogOpen(true);
  };

  const addItem = () => setItems(p => [...p, { tour_id: "", tour_date: "", qty_adults: 1, qty_children: 0, unit_price_mxn: 0, unit_price_child_mxn: 0, zone: "", nationality: "", package_name: "" }]);
  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(p => p.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };

      // Auto-fill prices when tour+zone+nationality+package change
      const tourId = field === "tour_id" ? value : updated.tour_id;
      const zone = field === "zone" ? value : updated.zone;
      const nat = field === "nationality" ? value : updated.nationality;
      const pkg = field === "package_name" ? value : updated.package_name;

      // Reset package when tour changes
      if (field === "tour_id") updated.package_name = "";

      const priceFields = ["tour_id", "zone", "nationality", "package_name"];
      if (tourId && priceFields.includes(field)) {
        // lookupPrice handles all fallbacks: variant → package → tour base
        updated.unit_price_mxn = lookupPrice(tourId, zone, nat, "Adulto", pkg || undefined);
        updated.unit_price_child_mxn = lookupPrice(tourId, zone, nat, "Menor", pkg || undefined);
      }

      return updated;
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.qty_adults * i.unit_price_mxn + i.qty_children * i.unit_price_child_mxn, 0);
  const total = Math.max(0, subtotal - (form.discount_mxn || 0));
  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const filtered = quotes.filter((q: any) => {
    if (dateFrom && new Date(q.created_at) < dateFrom) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(q.created_at) > end) return false;
    }
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
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /><span className="hidden sm:inline">Nueva Cotización</span><span className="sm:hidden">Nueva</span></Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar cotización..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
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
                      {/* Desktop */}
                      <div className="hidden sm:flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(q)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/cotizaciones/${q.id}/pdf`, '_blank')}><FileText className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSendQuote(q)}><Send className="h-3.5 w-3.5" /></Button>
                        {(q.status === "draft" || q.status === "sent") && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => setAcceptQuote(q)}><CheckCircle className="h-3.5 w-3.5" /></Button>
                        )}
                        {(q as any).reservation_id && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.location.href = `/reservas?highlight=${(q as any).reservation_id}`}><ExternalLink className="h-3.5 w-3.5" /></Button>
                        )}
                      </div>
                      {/* Mobile */}
                      <div className="sm:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(q)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/cotizaciones/${q.id}/pdf`, '_blank')}><FileText className="mr-2 h-4 w-4" />Ver PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSendQuote(q)}><Send className="mr-2 h-4 w-4" />Enviar</DropdownMenuItem>
                            {(q.status === "draft" || q.status === "sent") && (
                              <DropdownMenuItem onClick={() => setAcceptQuote(q)}><CheckCircle className="mr-2 h-4 w-4" />Aceptar</DropdownMenuItem>
                            )}
                            {(q as any).reservation_id && (
                              <DropdownMenuItem onClick={() => window.location.href = `/reservas?highlight=${(q as any).reservation_id}`}><ExternalLink className="mr-2 h-4 w-4" />Ver Reserva</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        <DialogContent className="sm:max-w-2xl max-h-[100dvh] sm:max-h-[90dvh] overflow-y-auto w-full">
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

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Cotización tour</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="mr-1 h-3 w-3" /> Agregar</Button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  {/* Row 1: Tour + Fecha + delete */}
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-0">
                      <Select value={item.tour_id} onValueChange={(v) => updateItem(idx, "tour_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar tour" /></SelectTrigger>
                        <SelectContent>
                          {tours.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-xs text-muted-foreground">Fecha</Label>
                      <Input type="date" value={item.tour_date} onChange={(e) => updateItem(idx, "tour_date", e.target.value)} className="h-9 w-36" />
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Row 2: Paquete (aparece en cuanto hay tour, independiente de zona/nat) */}
                  {(() => {
                    const pkgs = getPackages(item.tour_id);
                    if (!pkgs.length) return null;
                    return (
                      <Select value={item.package_name} onValueChange={(v) => updateItem(idx, "package_name", v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar paquete" /></SelectTrigger>
                        <SelectContent>
                          {pkgs.map((p: any) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    );
                  })()}

                  {/* Row 3: Zona + Nacionalidad */}
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Adultos</Label>
                      <Input type="number" min={0} value={item.qty_adults} onChange={(e) => updateItem(idx, "qty_adults", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Precio adulto</Label>
                      <Input type="number" min={0} step="0.01" value={item.unit_price_mxn} onChange={(e) => updateItem(idx, "unit_price_mxn", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Menores</Label>
                      <Input type="number" min={0} value={item.qty_children} onChange={(e) => updateItem(idx, "qty_children", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Precio menor</Label>
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
                <div className="space-y-2 pt-1">
                  <p className="text-sm text-right text-muted-foreground">Subtotal: {fmt(subtotal)}</p>
                  <div className="flex justify-end">
                    <div className="w-full sm:w-64">
                      <DiscountInput
                        subtotal={subtotal}
                        discountMxn={form.discount_mxn || 0}
                        onChange={(v) => setForm(p => ({ ...p, discount_mxn: v }))}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-right">Total: {fmt(total)}</p>
                </div>
              )}
            </div>

            {/* Estado (solo edición) */}
            {editingId && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => {
                    if (v === "accepted") {
                      const q = quotes.find((q: any) => q.id === editingId);
                      if (q) { closeDialog(); setAcceptQuote(q); }
                      return;
                    }
                    setForm(p => ({ ...p, status: v }));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels)
                      .filter(([k]) => k !== "accepted")
                      .map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    <SelectItem value="accepted">Pasar a Reserva</SelectItem>
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
        <DialogContent className="sm:max-w-sm">
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

      {/* Send & Accept dialogs */}
      {sendQuote && (
        <SendQuoteDialog open={!!sendQuote} onOpenChange={(o) => { if (!o) setSendQuote(null); }} quote={sendQuote} />
      )}
      {acceptQuote && (
        <AcceptQuoteDialog open={!!acceptQuote} onOpenChange={(o) => { if (!o) setAcceptQuote(null); }} quote={acceptQuote} />
      )}
    </div>
  );
}
