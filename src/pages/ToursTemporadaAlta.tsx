import { useState, useRef, useEffect } from "react";
import { parseCSV, parseCSVPreview, getCol, parseNum, collectAliasKeys, PKG_ALIASES, VARIANT_ALIASES, GENERAL_ALIASES, autoMapColumns, normKey, validateTabContent, type ColumnMapping } from "@/lib/sheet-import";
import ColumnMappingDialog from "@/components/tours/ColumnMappingDialog";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Clock, Plus, Pencil, Upload, DollarSign, Table2, Trash2, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import SheetImportDialog from "@/components/tours/SheetImportDialog";
import SheetPreviewDialog from "@/components/tours/SheetPreviewDialog";
import PackageEditor, { PackageForm, emptyPackage } from "@/components/tours/PackageEditor";
import MappingCards from "@/components/tours/MappingCards";
import PriceVariantEditor, { VariantForm, emptyVariant, GENERAL_PACKAGE } from "@/components/tours/PriceVariantEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PLACEHOLDER_IMG = "/placeholder.svg";

function formatPrice(n: number) {
  return `$${n.toLocaleString("es-MX")} MXN`;
}

interface TourRow {
  id: string;
  title: string;
  type: string;
  price_mxn: number;
  price_adult_usd: number;
  price_child_usd: number;
  child_age_min: number;
  child_age_max: number;
  suggested_price_mxn: number;
  mandatory_fees_usd: number;
  public_price_adult_usd: number;
  public_price_child_usd: number;
  tax_adult_usd: number;
  tax_child_usd: number;
  calculation_mode: string;
  commission_percentage: number;
  exchange_rate_tour: number;
  days: string[];
  image_urls: string[];
  short_description: string;
  itinerary: string;
  includes: string[];
  excludes: string[];
  meeting_point: string;
  what_to_bring: string[];
  recommendations: string | null;
  tags: string[];
  active: boolean;
  operator_id: string | null;
  category_id: string | null;
  destination_id: string | null;
  operators: { name: string } | null;
  categories: { name: string } | null;
  destinations: { name: string } | null;
}

export default function ToursTemporadaAlta() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");

  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["tours-alta"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("tours")
        .select("*, operators(name), categories(name), destinations(name)") as any)
        .eq("season", "alta")
        .order("title");
      if (error) throw error;
      return data as unknown as TourRow[];
    },
  });

  const categoryOptions = [...new Set(tours.map((t) => t.categories?.name).filter(Boolean))] as string[];
  const destinationOptions = [...new Set(tours.map((t) => (t as any).destinations?.name).filter(Boolean))] as string[];

  const filtered = tours.filter((t) => {
    if (categoryFilter !== "all" && t.categories?.name !== categoryFilter) return false;
    if (destinationFilter !== "all" && (t as any).destinations?.name !== destinationFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t as any).operators?.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("tours").update({ active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours-alta"] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("tour_price_variants").delete().eq("tour_id", id);
      await (supabase as any).from("tour_packages").delete().eq("tour_id", id);
      const { error } = await supabase.from("tours").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours-alta"] });
      toast.success("Tour eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Sun className="h-6 w-6 text-amber-500" />
            Tours Temporada Alta
          </h1>
          <p className="text-sm text-muted-foreground">Tours duplicados con precios de temporada alta</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar tour u operador..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={destinationFilter} onValueChange={setDestinationFilter}>
          <SelectTrigger className="w-40">
            <MapPin className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Destino" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {destinationOptions.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tour grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-0 overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Sun}
          title="No hay tours de temporada alta"
          description="Duplica tours desde el catálogo regular usando el botón de copiar"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tour) => (
            <Card
              key={tour.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/tours?edit=${tour.id}`)}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={tour.image_urls?.[0] || PLACEHOLDER_IMG}
                  alt={tour.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                />
                <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px]">
                  TEMP. ALTA
                </Badge>
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">{tour.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Badge variant={tour.type === "private" ? "default" : "secondary"} className="text-[10px]">
                      {tour.type === "private" ? "Privado" : "Compartido"}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{tour.short_description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tour.operators?.name ?? "—"}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tour.days.length} días/sem</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">
                      {tour.price_mxn > 0 ? formatPrice(tour.price_mxn) : <span className="text-muted-foreground text-xs">Sin precio</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{tour.categories?.name ?? ""}</span>
                    {isAdmin && (
                      <>
                        <Switch
                          checked={tour.active}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={(checked) => toggleActive.mutate({ id: tour.id, active: checked })}
                        />
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("¿Eliminar este tour de temporada alta?")) deleteMutation.mutate(tour.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
