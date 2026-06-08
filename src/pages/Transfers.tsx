import { useState, useMemo } from "react";
import { PeriodFilter } from "@/components/shared/PeriodFilter";
import { usePeriodFilter } from "@/hooks/usePeriodFilter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Search, MoreVertical, Pencil, Trash2, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";

type Transfer = {
  id: string;
  folio: string | null;
  service_date: string;
  pickup_time: string;
  pax_adults: number;
  pax_children: number;
  origin: string;
  destination: string;
  vehicle_type: string;
  hotel_name: string;
  room_number: string;
  flight_info: string;
  operator_id: string | null;
  client_name: string;
  client_phone: string;
  client_email: string;
  price_mxn: number;
  currency: string;
  exchange_rate: number;
  payment_status: string;
  payment_method: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
};

const VEHICLES = ["Sedán", "SUV", "Van", "Sprinter", "Bus", "Otro"];
const STATUSES = [
  { value: "scheduled", label: "Programado" },
  { value: "confirmed", label: "Confirmado" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
];

const emptyForm = {
  service_date: format(new Date(), "yyyy-MM-dd"),
  pickup_time: "",
  pax_adults: 1,
  pax_children: 0,
  origin: "",
  destination: "",
  vehicle_type: "Sedán",
  hotel_name: "",
  room_number: "",
  flight_info: "",
  operator_id: "",
  client_name: "",
  client_phone: "",
  client_email: "",
  price_mxn: 0,
  currency: "MXN",
  exchange_rate: 1,
  payment_status: "unpaid",
  payment_method: "",
  status: "scheduled",
  notes: "",
};

export default function Transfers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transfer | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const { period, setPeriod } = usePeriodFilter("this_month");

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("transfers")
        .select("*")
        .order("service_date", { ascending: false });
      if (error) throw error;
      return data as Transfer[];
    },
  });

  const { data: operators = [] } = useQuery({
    queryKey: ["operators-light"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operators")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transfers.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (t.service_date) {
        const d = new Date(t.service_date + "T00:00:00");
        if (d < period.from || d > period.to) return false;
      }
      if (!q) return true;
      return [t.folio, t.client_name, t.origin, t.destination, t.hotel_name, t.client_phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [transfers, search, statusFilter, period.from, period.to]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ...form,
        operator_id: form.operator_id || null,
        payment_method: form.payment_method || null,
        notes: form.notes || null,
        pax_adults: Number(form.pax_adults) || 0,
        pax_children: Number(form.pax_children) || 0,
        price_mxn: Number(form.price_mxn) || 0,
        exchange_rate: Number(form.exchange_rate) || 1,
      };
      if (editing) {
        const { error } = await (supabase as any)
          .from("transfers")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        payload.created_by = user?.id;
        const { error } = await (supabase as any).from("transfers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success(editing ? "Transfer actualizado" : "Transfer creado");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message ?? "Error al guardar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("transfers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer eliminado");
    },
    onError: (e: any) => toast.error(e.message ?? "Error"),
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: Transfer) => {
    setEditing(t);
    setForm({
      service_date: t.service_date,
      pickup_time: t.pickup_time ?? "",
      pax_adults: t.pax_adults,
      pax_children: t.pax_children,
      origin: t.origin ?? "",
      destination: t.destination ?? "",
      vehicle_type: t.vehicle_type ?? "Sedán",
      hotel_name: t.hotel_name ?? "",
      room_number: t.room_number ?? "",
      flight_info: t.flight_info ?? "",
      operator_id: t.operator_id ?? "",
      client_name: t.client_name ?? "",
      client_phone: t.client_phone ?? "",
      client_email: t.client_email ?? "",
      price_mxn: t.price_mxn ?? 0,
      currency: t.currency ?? "MXN",
      exchange_rate: t.exchange_rate ?? 1,
      payment_status: t.payment_status ?? "unpaid",
      payment_method: t.payment_method ?? "",
      status: t.status ?? "scheduled",
      notes: t.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim() || !form.client_phone.trim()) {
      toast.error("Nombre y teléfono del pax son obligatorios");
      return;
    }
    if (!form.origin.trim() || !form.destination.trim()) {
      toast.error("Origen y destino son obligatorios");
      return;
    }
    if (Number(form.price_mxn) <= 0) {
      toast.error("Precio debe ser mayor a 0");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transfers</h1>
          <p className="text-sm text-muted-foreground">Registro de traslados con precio manual.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo transfer
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por folio, cliente, origen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Car}
            title="Sin transfers"
            description="Crea tu primer transfer para empezar."
            action={{ label: "Nuevo transfer", onClick: openNew }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden md:table-cell">Pax</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead className="hidden lg:table-cell">Vehículo</TableHead>
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.folio}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(t.service_date + "T00:00:00"), "dd/MM/yy")}
                    {t.pickup_time ? <span className="ml-1 text-muted-foreground">{t.pickup_time}</span> : null}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{t.pax_adults + t.pax_children}</TableCell>
                  <TableCell className="max-w-[240px] truncate">
                    <span className="font-medium">{t.origin}</span>
                    <span className="mx-1 text-muted-foreground">→</span>
                    <span>{t.destination}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{t.vehicle_type}</TableCell>
                  <TableCell className="hidden md:table-cell">{t.client_name}</TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    ${Number(t.price_mxn).toLocaleString("es-MX")} {t.currency}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      t.status === "completed" ? "default" :
                      t.status === "cancelled" ? "destructive" :
                      t.status === "confirmed" ? "secondary" : "outline"
                    }>
                      {STATUSES.find((s) => s.value === t.status)?.label ?? t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(t)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`¿Eliminar transfer ${t.folio}?`)) deleteMutation.mutate(t.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${editing.folio}` : "Nuevo transfer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Fecha del servicio *</Label>
                <Input type="date" value={form.service_date}
                  onChange={(e) => setForm({ ...form, service_date: e.target.value })} required />
              </div>
              <div>
                <Label>Hora pickup</Label>
                <Input type="time" value={form.pickup_time}
                  onChange={(e) => setForm({ ...form, pickup_time: e.target.value })} />
              </div>
              <div>
                <Label>Adultos *</Label>
                <Input type="number" min={0} value={form.pax_adults}
                  onChange={(e) => setForm({ ...form, pax_adults: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Menores</Label>
                <Input type="number" min={0} value={form.pax_children}
                  onChange={(e) => setForm({ ...form, pax_children: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Origen *</Label>
                <Input value={form.origin} placeholder="Aeropuerto CUN"
                  onChange={(e) => setForm({ ...form, origin: e.target.value })} required />
              </div>
              <div>
                <Label>Destino *</Label>
                <Input value={form.destination} placeholder="Hotel Riu Cancún"
                  onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
              </div>
              <div>
                <Label>Tipo de vehículo</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VEHICLES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Operador (opcional)</Label>
                <Select value={form.operator_id || "none"} onValueChange={(v) => setForm({ ...form, operator_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Ninguno —</SelectItem>
                    {operators.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hotel</Label>
                <Input value={form.hotel_name}
                  onChange={(e) => setForm({ ...form, hotel_name: e.target.value })} />
              </div>
              <div>
                <Label>Habitación</Label>
                <Input value={form.room_number}
                  onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Vuelo / referencia</Label>
                <Input value={form.flight_info} placeholder="AA1234 llegada 14:30"
                  onChange={(e) => setForm({ ...form, flight_info: e.target.value })} />
              </div>
              <div>
                <Label>Nombre del pax *</Label>
                <Input value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
              </div>
              <div>
                <Label>Teléfono del pax *</Label>
                <Input value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })} required />
              </div>
              <div className="sm:col-span-2">
                <Label>Email del pax</Label>
                <Input type="email" value={form.client_email}
                  onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
              </div>
              <div>
                <Label>Precio *</Label>
                <Input type="number" min={0} step="0.01" value={form.price_mxn}
                  onChange={(e) => setForm({ ...form, price_mxn: Number(e.target.value) })} required />
              </div>
              <div>
                <Label>Moneda</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pago</Label>
                <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Sin pagar</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.payment_status === "paid" && (
                <div className="sm:col-span-2">
                  <Label>Método de pago</Label>
                  <Select value={form.payment_method || "cash"} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="sm:col-span-2">
                <Label>Notas</Label>
                <Textarea rows={2} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
