import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, FileText, CalendarCheck, Pencil, MoreHorizontal, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DiscountInput from "@/components/shared/DiscountInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PromoItem {
  tour_id: string;
  package_name: string | null; // null = all packages
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_mode: string;
  discount_value: number;
  discount_mxn: number;
  subtotal_mxn: number;
  total_mxn: number;
  active: boolean;
  created_at: string;
  items: PromoItem[];
}

interface Tour {
  id: string;
  title: string;
  price_mxn: number;
  suggested_price_mxn: number;
  active: boolean;
}

interface TourPackage {
  id: string;
  tour_id: string;
  name: string;
  price_adult_mxn: number;
  active: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function Promociones() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<PromoItem[]>([]);
  const [discountMxn, setDiscountMxn] = useState(0);
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = useState(0);

  // Fetch all active tours
  const { data: tours = [] } = useQuery({
    queryKey: ["tours-for-promos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("id, title, price_mxn, suggested_price_mxn, active")
        .eq("active", true)
        .order("title");
      if (error) throw error;
      return (data ?? []) as Tour[];
    },
  });

  // Fetch all active tour_packages
  const { data: packages = [] } = useQuery({
    queryKey: ["tour-packages-for-promos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_packages")
        .select("id, tour_id, name, price_adult_mxn, active")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as TourPackage[];
    },
  });

  // Fetch promotions with their items
  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data: promos, error: e1 } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (e1) throw e1;

      const { data: links, error: e2 } = await supabase
        .from("promotion_tours")
        .select("promotion_id, tour_id, package_name");
      if (e2) throw e2;

      return (promos ?? []).map((p: any) => ({
        ...p,
        items: (links ?? [])
          .filter((l: any) => l.promotion_id === p.id)
          .map((l: any) => ({ tour_id: l.tour_id, package_name: l.package_name })),
      })) as Promotion[];
    },
  });

  // Get packages for a given tour
  const getPackagesForTour = (tourId: string) => packages.filter((p) => p.tour_id === tourId);

  // Check if a tour is selected (has at least one item)
  const isTourSelected = (tourId: string) => selectedItems.some((i) => i.tour_id === tourId);

  // Get selected items for a tour
  const getSelectedForTour = (tourId: string) => selectedItems.filter((i) => i.tour_id === tourId);

  // Check if "all packages" is selected for a tour
  const isAllPackages = (tourId: string) => {
    const items = getSelectedForTour(tourId);
    return items.length === 1 && items[0].package_name === null;
  };

  // Toggle entire tour (adds as "all packages" or removes all)
  const toggleTour = (tourId: string) => {
    if (isTourSelected(tourId)) {
      setSelectedItems((prev) => prev.filter((i) => i.tour_id !== tourId));
    } else {
      setSelectedItems((prev) => [...prev, { tour_id: tourId, package_name: null }]);
    }
  };

  // Toggle a specific package for a tour
  const togglePackage = (tourId: string, pkgName: string) => {
    const current = getSelectedForTour(tourId);
    const hasThisPackage = current.some((i) => i.package_name === pkgName);

    if (hasThisPackage) {
      // Remove this package
      const remaining = selectedItems.filter((i) => !(i.tour_id === tourId && i.package_name === pkgName));
      // If no packages left for this tour, remove the tour entirely
      setSelectedItems(remaining);
    } else {
      // If currently "all packages", switch to specific
      const withoutTour = selectedItems.filter((i) => i.tour_id !== tourId);
      const existingSpecific = current.filter((i) => i.package_name !== null);
      setSelectedItems([...withoutTour, ...existingSpecific, { tour_id: tourId, package_name: pkgName }]);
    }
  };

  // Toggle "all packages" for a tour
  const toggleAllPackages = (tourId: string) => {
    const withoutTour = selectedItems.filter((i) => i.tour_id !== tourId);
    if (isAllPackages(tourId)) {
      // Already all → remove tour
      setSelectedItems(withoutTour);
    } else {
      // Switch to all
      setSelectedItems([...withoutTour, { tour_id: tourId, package_name: null }]);
    }
  };

  // Calculate subtotal from selected items
  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      if (item.package_name) {
        const pkg = packages.find((p) => p.tour_id === item.tour_id && p.name === item.package_name);
        return acc + (pkg?.price_adult_mxn ?? 0);
      } else {
        const t = tours.find((x) => x.id === item.tour_id);
        return acc + (t ? (t.price_mxn || t.suggested_price_mxn || 0) : 0);
      }
    }, 0);
  }, [selectedItems, tours, packages]);

  const total = Math.max(0, subtotal - discountMxn);

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedItems([]);
    setDiscountMxn(0);
    setDiscountMode("percent");
    setDiscountValue(0);
    setEditingId(null);
  };

  // Open edit
  const openEdit = (promo: Promotion) => {
    setEditingId(promo.id);
    setName(promo.name);
    setDescription(promo.description || "");
    setSelectedItems(promo.items);
    setDiscountMxn(promo.discount_mxn);
    setDiscountMode(promo.discount_mode as "percent" | "amount");
    setDiscountValue(promo.discount_value);
    setDialogOpen(true);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Nombre requerido");
      if (selectedItems.length === 0) throw new Error("Selecciona al menos un tour");

      const payload = {
        name: name.trim(),
        description: description.trim(),
        discount_mode: discountMode,
        discount_value: discountValue,
        discount_mxn: discountMxn,
        subtotal_mxn: subtotal,
        total_mxn: total,
      };

      if (editingId) {
        const { error: e1 } = await supabase.from("promotions").update(payload).eq("id", editingId);
        if (e1) throw e1;

        await supabase.from("promotion_tours").delete().eq("promotion_id", editingId);
        if (selectedItems.length) {
          const { error: e2 } = await (supabase as any).from("promotion_tours").insert(
            selectedItems.map((item) => ({
              promotion_id: editingId,
              tour_id: item.tour_id,
              package_name: item.package_name,
            }))
          );
          if (e2) throw e2;
        }
      } else {
        const { data: promo, error: e1 } = await supabase
          .from("promotions")
          .insert(payload)
          .select("id")
          .single();
        if (e1 || !promo) throw e1 || new Error("Error al crear");

        if (selectedItems.length) {
          const { error: e2 } = await (supabase as any).from("promotion_tours").insert(
            selectedItems.map((item) => ({
              promotion_id: promo.id,
              tour_id: item.tour_id,
              package_name: item.package_name,
            }))
          );
          if (e2) throw e2;
        }
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Promoción actualizada" : "Promoción creada");
      qc.invalidateQueries({ queryKey: ["promotions"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message || "Error al guardar"),
  });

  // Toggle active
  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("promotions").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
    onError: () => toast.error("Error al actualizar"),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promoción eliminada");
      qc.invalidateQueries({ queryKey: ["promotions"] });
      setDeletingId(null);
    },
    onError: () => toast.error("Error al eliminar"),
  });

  // Handle discount change from DiscountInput
  const handleDiscountChange = (mxn: number) => {
    setDiscountMxn(mxn);
    if (discountMode === "percent" && subtotal > 0) {
      setDiscountValue(Math.round((mxn / subtotal) * 100 * 100) / 100);
    } else {
      setDiscountValue(mxn);
    }
  };

  // Build display label for a promo item
  const itemLabel = (item: PromoItem) => {
    const tour = tours.find((t) => t.id === item.tour_id);
    const tourName = tour?.title ?? "Tour";
    if (item.package_name) return `${tourName} → ${item.package_name}`;
    return tourName;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promociones</h1>
          <p className="text-sm text-muted-foreground">Crea combos personalizados de tours con descuento</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Promoción
          </Button>
        )}
      </div>

      {/* Promotions table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Tours / Paquetes</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Subtotal</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Descuento</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Total</TableHead>
                  <TableHead className="hidden sm:table-cell">Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando…</TableCell></TableRow>
                ) : promotions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay promociones</TableCell></TableRow>
                ) : (
                  promotions.map((promo) => {
                    const labels = promo.items.map((item) => itemLabel(item));
                    return (
                      <TableRow key={promo.id}>
                        <TableCell>
                          <div className="font-medium">{promo.name}</div>
                          {promo.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">{promo.description}</div>
                          )}
                          <div className="sm:hidden text-xs text-muted-foreground mt-1 space-y-0.5">
                            <span>{labels.length} item(s)</span>
                            <div className="flex gap-2">
                              <span>{fmt(promo.subtotal_mxn)}</span>
                              <span className="text-destructive">-{fmt(promo.discount_mxn)}</span>
                              <span className="font-semibold text-foreground">={fmt(promo.total_mxn)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {labels.slice(0, 3).map((n, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{n}</Badge>
                            ))}
                            {labels.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{labels.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm hidden sm:table-cell">{fmt(promo.subtotal_mxn)}</TableCell>
                        <TableCell className="text-right text-sm text-destructive hidden sm:table-cell">
                          -{fmt(promo.discount_mxn)}
                          <div className="text-xs text-muted-foreground">
                            {promo.discount_mode === "percent" ? `${promo.discount_value}%` : "Fijo"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold hidden sm:table-cell">{fmt(promo.total_mxn)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {isAdmin ? (
                            <Switch
                              checked={promo.active}
                              onCheckedChange={(v) => toggleActive.mutate({ id: promo.id, active: v })}
                            />
                          ) : (
                            <Badge variant={promo.active ? "default" : "secondary"}>
                              {promo.active ? "Sí" : "No"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {/* Desktop */}
                          <div className="hidden sm:flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate(`/cotizaciones?promotion_id=${promo.id}`)}>
                              <FileText className="mr-1 h-3 w-3" />Cotizar
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate(`/reservas?promotion_id=${promo.id}`)}>
                              <CalendarCheck className="mr-1 h-3 w-3" />Reservar
                            </Button>
                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(promo)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(promo.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                          {/* Mobile */}
                          <div className="sm:hidden">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/cotizaciones?promotion_id=${promo.id}`)}>
                                  <FileText className="mr-2 h-4 w-4" />Cotizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/reservas?promotion_id=${promo.id}`)}>
                                  <CalendarCheck className="mr-2 h-4 w-4" />Reservar
                                </DropdownMenuItem>
                                {isAdmin && (
                                  <>
                                    <DropdownMenuItem onClick={() => openEdit(promo)}>
                                      <Pencil className="mr-2 h-4 w-4" />Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingId(promo.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); setDialogOpen(v); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Promoción" : "Nueva Promoción"}</DialogTitle>
            <DialogDescription>Combina tours y paquetes con un descuento global</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Combo Aventura 3x2" />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            {/* Tour + Package selector */}
            <div className="space-y-1.5">
              <Label>Tours y paquetes incluidos *</Label>
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {tours.map((t) => {
                  const tourPkgs = getPackagesForTour(t.id);
                  const selected = isTourSelected(t.id);
                  const hasPkgs = tourPkgs.length > 0;

                  return (
                    <div key={t.id} className="border-b last:border-b-0">
                      {/* Tour row */}
                      <label className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleTour(t.id)}
                        />
                        <span className="flex-1 text-sm font-medium">{t.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {fmt(t.price_mxn || t.suggested_price_mxn || 0)}
                        </span>
                      </label>

                      {/* Package sub-options (only when tour is selected and has packages) */}
                      {selected && hasPkgs && (
                        <div className="pl-10 pr-3 pb-2 space-y-1">
                          {/* All packages option */}
                          <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/30 rounded px-2">
                            <Checkbox
                              checked={isAllPackages(t.id)}
                              onCheckedChange={() => toggleAllPackages(t.id)}
                            />
                            <span className="text-xs text-muted-foreground">Todos los paquetes</span>
                          </label>
                          {/* Individual packages */}
                          {tourPkgs.map((pkg) => {
                            const isChecked = getSelectedForTour(t.id).some((i) => i.package_name === pkg.name);
                            return (
                              <label key={pkg.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/30 rounded px-2">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => togglePackage(t.id, pkg.name)}
                                />
                                <span className="flex-1 text-xs">{pkg.name}</span>
                                <span className="text-xs text-muted-foreground">{fmt(pkg.price_adult_mxn)}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected items summary */}
            {selectedItems.length > 0 && (
              <Card>
                <CardContent className="p-3 space-y-2">
                  {selectedItems.map((item, idx) => {
                    let price = 0;
                    let label = "";
                    if (item.package_name) {
                      const pkg = packages.find((p) => p.tour_id === item.tour_id && p.name === item.package_name);
                      price = pkg?.price_adult_mxn ?? 0;
                      const tour = tours.find((t) => t.id === item.tour_id);
                      label = `${tour?.title ?? "Tour"} → ${item.package_name}`;
                    } else {
                      const t = tours.find((x) => x.id === item.tour_id);
                      price = t ? (t.price_mxn || t.suggested_price_mxn || 0) : 0;
                      label = t?.title ?? "Tour";
                    }
                    return (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="text-muted-foreground">{fmt(price)}</span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 flex justify-between font-medium text-sm">
                    <span>Subtotal</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discount input */}
            {subtotal > 0 && (
              <DiscountInput
                subtotal={subtotal}
                discountMxn={discountMxn}
                onChange={handleDiscountChange}
                label="Descuento de la promoción"
              />
            )}

            {/* Total */}
            {subtotal > 0 && (
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="font-semibold">Total promoción</span>
                <span className="text-lg font-bold text-primary">{fmt(total)}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { resetForm(); setDialogOpen(false); }}>
              Cancelar
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Guardando…" : editingId ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
