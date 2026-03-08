import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, BadgePercent, FileText, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ── types ── */
interface PromoPackage {
  id: string;
  name: string;
  description: string;
  discount_rule: string;
  public_price_adult_usd: number;
  public_price_child_usd: number;
  preferential_adult_usd: number;
  preferential_child_usd: number;
  commission_rate: number;
  active: boolean;
  created_at: string;
  tour_ids?: string[];
}

interface Tour {
  id: string;
  title: string;
  public_price_adult_usd: number;
  public_price_child_usd: number;
  tax_adult_usd: number;
  tax_child_usd: number;
  exchange_rate_tour: number;
  active: boolean;
}

/* ── Xcaret pricing formulas (MXN) ── */
function tourToMxnAdult(t: Tour) {
  const tc = t.exchange_rate_tour > 0 ? t.exchange_rate_tour : 1;
  return (t.public_price_adult_usd + (t.tax_adult_usd ?? 0)) * tc;
}

function tourToMxnChild(t: Tour) {
  const tc = t.exchange_rate_tour > 0 ? t.exchange_rate_tour : 1;
  return (t.public_price_child_usd + (t.tax_child_usd ?? 0)) * tc;
}

function calcXcaretPrices(sumAdultMxn: number) {
  const publicAdult = sumAdultMxn * 0.80;
  const publicChild = publicAdult * 0.75;
  const prefAdult = publicAdult * 0.70;
  const prefChild = prefAdult * 0.75;
  return { publicAdult, publicChild, prefAdult, prefChild };
}

function fmt(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

/* ── component ── */
export default function PaquetesXcaret() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);

  // Fetch Xcaret category IDs
  const { data: xcaretCategories = [] } = useQuery({
    queryKey: ["xcaret-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", "%xcaret%");
      if (error) throw error;
      return data ?? [];
    },
  });

  const xcaretCatIds = xcaretCategories.map((c) => c.id);

  // Fetch only tours belonging to Xcaret categories
  const { data: tours = [] } = useQuery<Tour[]>({
    queryKey: ["tours-for-promos", xcaretCatIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("id, title, public_price_adult_usd, public_price_child_usd, tax_adult_usd, tax_child_usd, exchange_rate_tour, active")
        .eq("active", true)
        .in("category_id", xcaretCatIds)
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
    enabled: xcaretCatIds.length > 0,
  });

  // Fetch promo packages + their tour ids
  const { data: packages = [], isLoading } = useQuery<PromoPackage[]>({
    queryKey: ["promo-packages"],
    queryFn: async () => {
      const { data: pkgs, error } = await supabase
        .from("promo_packages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: links, error: e2 } = await supabase
        .from("promo_package_tours")
        .select("promo_package_id, tour_id");
      if (e2) throw e2;

      return (pkgs ?? []).map((p: any) => ({
        ...p,
        tour_ids: (links ?? [])
          .filter((l: any) => l.promo_package_id === p.id)
          .map((l: any) => l.tour_id),
      }));
    },
  });

  /* ── mutations ── */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const sumAdultMxn = selectedTourIds.reduce((acc, tid) => {
        const t = tours.find((x) => x.id === tid);
        return acc + (t ? tourToMxnAdult(t) : 0);
      }, 0);
      const prices = calcXcaretPrices(sumAdultMxn);

      if (editingId) {
        // update
        const { error } = await supabase
          .from("promo_packages")
          .update({
            name,
            description,
            public_price_adult_usd: prices.publicAdult,
            public_price_child_usd: prices.publicChild,
            preferential_adult_usd: prices.prefAdult,
            preferential_child_usd: prices.prefChild,
          })
          .eq("id", editingId);
        if (error) throw error;

        // re-sync tours
        await supabase.from("promo_package_tours").delete().eq("promo_package_id", editingId);
        if (selectedTourIds.length) {
          const { error: e2 } = await supabase.from("promo_package_tours").insert(
            selectedTourIds.map((tid) => ({ promo_package_id: editingId, tour_id: tid }))
          );
          if (e2) throw e2;
        }
      } else {
        // insert
        const { data: pkg, error } = await supabase
          .from("promo_packages")
          .insert({
            name,
            description,
            public_price_adult_usd: prices.publicAdult,
            public_price_child_usd: prices.publicChild,
            preferential_adult_usd: prices.prefAdult,
            preferential_child_usd: prices.prefChild,
          })
          .select("id")
          .single();
        if (error) throw error;

        if (selectedTourIds.length) {
          const { error: e2 } = await supabase.from("promo_package_tours").insert(
            selectedTourIds.map((tid) => ({ promo_package_id: pkg.id, tour_id: tid }))
          );
          if (e2) throw e2;
        }
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Paquete actualizado" : "Paquete creado");
      qc.invalidateQueries({ queryKey: ["promo-packages"] });
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("promo_packages").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promo-packages"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promo_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paquete eliminado");
      qc.invalidateQueries({ queryKey: ["promo-packages"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  /* ── helpers ── */
  function openCreate() {
    setEditingId(null);
    setName("");
    setDescription("");
    setSelectedTourIds([]);
    setDialogOpen(true);
  }

  function openEdit(pkg: PromoPackage) {
    setEditingId(pkg.id);
    setName(pkg.name);
    setDescription(pkg.description ?? "");
    setSelectedTourIds(pkg.tour_ids ?? []);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
  }

  function toggleTour(tourId: string) {
    setSelectedTourIds((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId]
    );
  }

  /* ── live calculator ── */
  const liveCalc = useMemo(() => {
    const sumMxn = selectedTourIds.reduce((acc, tid) => {
      const t = tours.find((x) => x.id === tid);
      return acc + (t ? tourToMxnAdult(t) : 0);
    }, 0);
    const discount = sumMxn * 0.20;
    const total = sumMxn - discount;
    return { sumMxn, discount, total, ...calcXcaretPrices(sumMxn) };
  }, [selectedTourIds, tours]);

  const tourNameMap = useMemo(() => {
    const m = new Map<string, string>();
    tours.forEach((t) => m.set(t.id, t.title));
    return m;
  }, [tours]);

  /* helper: compute subtotal for a saved package from its tour_ids */
  function pkgSubtotal(pkg: PromoPackage) {
    return (pkg.tour_ids ?? []).reduce((acc, tid) => {
      const t = tours.find((x) => x.id === tid);
      return acc + (t ? tourToMxnAdult(t) : 0);
    }, 0);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paquetes Xcaret</h1>
          <p className="text-sm text-muted-foreground">
            Combina 2+ tours y aplica el descuento de paquete Xcaret (–20%)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo paquete
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <BadgePercent className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">Aún no hay paquetes creados.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paquete</TableHead>
                  <TableHead className="hidden sm:table-cell">Tours</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Subtotal</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Dcto. paquete</TableHead>
                  <TableHead className="text-right">Total Adulto</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                   <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => {
                  const sub = pkgSubtotal(pkg);
                  const disc = sub * 0.20;
                  return (
                  <TableRow
                    key={pkg.id}
                    className="cursor-pointer"
                    onClick={() => openEdit(pkg)}
                  >
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(pkg.tour_ids ?? []).map((tid) => (
                          <Badge key={tid} variant="secondary" className="text-xs">
                            {tourNameMap.get(tid) ?? tid.slice(0, 6)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground">{fmt(sub)}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-green-600">–{fmt(disc)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(pkg.public_price_adult_usd)}</TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={pkg.active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: pkg.id, active: v })}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar paquete" : "Nuevo paquete Xcaret"}</DialogTitle>
            <DialogDescription>
              Selecciona 2 o más tours y el sistema calcula los precios del contrato automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="pkg-name">Nombre del paquete</Label>
              <Input
                id="pkg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: 2 días Xcaret + Xel-Há"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="pkg-desc">Descripción (opcional)</Label>
              <Textarea
                id="pkg-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Tour selector */}
            <div className="space-y-2">
              <Label>Tours incluidos ({selectedTourIds.length} seleccionados)</Label>
              <div className="max-h-48 overflow-y-auto rounded-md border border-border p-2 space-y-1">
                {tours.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTourIds.includes(t.id)}
                      onCheckedChange={() => toggleTour(t.id)}
                    />
                    <span className="flex-1">{t.title}</span>
                    <span className="text-muted-foreground">{fmt(tourToMxnAdult(t))}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Live calculator – Xcaret-style breakdown */}
            {selectedTourIds.length >= 2 && (
              <Card className="bg-muted/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Desglose del paquete</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  {/* Individual tour prices */}
                  <div className="space-y-1.5">
                    {selectedTourIds.map((tid) => {
                      const t = tours.find((x) => x.id === tid);
                      if (!t) return null;
                      return (
                        <div key={tid} className="flex justify-between">
                          <span className="text-muted-foreground truncate mr-2">{t.title}</span>
                          <span>{fmt(tourToMxnAdult(t))}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-border pt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{fmt(liveCalc.sumMxn)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Dcto. paquete combinable (–20%)</span>
                      <span>–{fmt(liveCalc.discount)}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                    <span>Total Adulto</span>
                    <span>{fmt(liveCalc.total)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!name.trim() || selectedTourIds.length < 2 || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Guardando…" : editingId ? "Guardar cambios" : "Crear paquete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paquete?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El paquete será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingId) deleteMutation.mutate(deletingId);
                setDeletingId(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
