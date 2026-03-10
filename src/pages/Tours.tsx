import { useState, useRef, useEffect } from "react";
import { parseCSV, parseCSVPreview, getCol, parseNum, collectAliasKeys, PKG_ALIASES, VARIANT_ALIASES, GENERAL_ALIASES, autoMapColumns, normKey, validateTabContent, type ColumnMapping } from "@/lib/sheet-import";
import ColumnMappingDialog from "@/components/tours/ColumnMappingDialog";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Clock, Plus, Pencil, Upload, DollarSign, Table2 } from "lucide-react";
import SheetImportDialog from "@/components/tours/SheetImportDialog";
import SheetPreviewDialog from "@/components/tours/SheetPreviewDialog";
import PackageEditor, { PackageForm, emptyPackage } from "@/components/tours/PackageEditor";
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
const ALL_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// CSV parsing utilities moved to @/lib/sheet-import

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

interface TourForm {
  title: string;
  operator_id: string;
  category_id: string;
  destination_id: string;
  type: string;
  price_mxn: string;
  price_adult_usd: string;
  price_child_usd: string;
  child_age_min: string;
  child_age_max: string;
  suggested_price_mxn: string;
  mandatory_fees_usd: string;
  public_price_adult_usd: string;
  public_price_child_usd: string;
  tax_adult_usd: string;
  tax_child_usd: string;
  calculation_mode: string;
  commission_percentage: string;
  exchange_rate_tour: string;
  days: string[];
  short_description: string;
  itinerary: string;
  includes: string;
  excludes: string;
  meeting_point: string;
  what_to_bring: string;
  recommendations: string;
  tags: string;
  service_type: string;
}

const emptyForm: TourForm = {
  title: "", operator_id: "", category_id: "", destination_id: "", type: "shared",
  price_mxn: "", price_adult_usd: "", price_child_usd: "",
  child_age_min: "4", child_age_max: "10",
  suggested_price_mxn: "", mandatory_fees_usd: "",
  public_price_adult_usd: "", public_price_child_usd: "",
  tax_adult_usd: "", tax_child_usd: "",
  calculation_mode: "net_cost", commission_percentage: "",
  exchange_rate_tour: "",
  days: [], short_description: "", itinerary: "",
  includes: "", excludes: "", meeting_point: "", what_to_bring: "",
  recommendations: "", tags: "", service_type: "with_transport",
};

function formatPrice(n: number) {
  return `$${n.toLocaleString("es-MX")} MXN`;
}

function csvToArray(csv: string) {
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

// ── Tour Image Carousel ──
function TourImageCarousel({ images, title }: { images?: string[] | null; title: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const slides = images?.length ? images : [PLACEHOLDER_IMG];

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="space-y-2">
      <Carousel opts={{ loop: true }} setApi={setApi} className="relative">
        <CarouselContent>
          {slides.map((url, i) => (
            <CarouselItem key={i}>
              <AspectRatio ratio={16 / 9}>
                <img
                  src={url}
                  alt={`${title} - ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg bg-muted"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                />
              </AspectRatio>
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 hover:bg-background" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 hover:bg-background" />
          </>
        )}
      </Carousel>
      {count > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              className={`h-2 rounded-full transition-all ${i === current ? "w-4 bg-primary" : "w-2 bg-muted-foreground/30"}`}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Showroom detail dialog ──
function TourShowroom({ tour, onClose, onCreateReservation, onCreateQuote }: { tour: TourRow; onClose: () => void; onCreateReservation: (tourId: string) => void; onCreateQuote: (tourId: string) => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="text-lg">{tour.title}</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={tour.type === "private" ? "default" : "secondary"} className="text-xs">
              {tour.type === "private" ? "Privado" : "Compartido"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              por {tour.operators?.name ?? "Sin operador"}
            </span>
            <span className="ml-auto font-bold text-primary">{formatPrice(tour.price_mxn)}</span>
          </div>
        </DialogHeader>

        <TourImageCarousel images={tour.image_urls} title={tour.title} />


        {tour.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tour.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {tour.days.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">Días de operación</p>
            <div className="flex gap-1">
              {tour.days.map((d) => (
                <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {tour.itinerary && (
          <div>
            <p className="text-sm font-medium mb-1">Itinerario</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {tour.itinerary.split("\n").filter(l => l.trim()).map((line, i) => (
                <li key={i} className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>{line.trim()}</span></li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-1 text-primary">✓ Incluye</p>
            <ul className="text-sm text-muted-foreground space-y-0.5">
              {tour.includes.map((i) => <li key={i}>• {i}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-1 text-destructive">✗ No incluye</p>
            <ul className="text-sm text-muted-foreground space-y-0.5">
              {tour.excludes.map((e) => <li key={e}>• {e}</li>)}
            </ul>
          </div>
        </div>

        <Separator />

        {tour.meeting_point && (
          <div>
            <p className="text-sm font-medium mb-1">📍 Punto de encuentro</p>
            <p className="text-sm text-muted-foreground">{tour.meeting_point}</p>
          </div>
        )}

        {tour.what_to_bring.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">🎒 Qué llevar</p>
            <div className="flex flex-wrap gap-1.5">
              {tour.what_to_bring.map((w) => (
                <Badge key={w} variant="outline" className="text-xs">{w}</Badge>
              ))}
            </div>
          </div>
        )}

        {tour.recommendations && (
          <div>
            <p className="text-sm font-medium mb-1">💡 Recomendaciones</p>
            <p className="text-sm text-muted-foreground">{tour.recommendations}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={() => { onClose(); onCreateReservation(tour.id); }}>Crear Reserva</Button>
          <Button variant="outline" className="flex-1" onClick={() => { onClose(); onCreateQuote(tour.id); }}>Crear Cotización</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──
export default function Tours() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [selectedTour, setSelectedTour] = useState<TourRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TourForm>(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [parsingDoc, setParsingDoc] = useState(false);
  const [mappingPackages, setMappingPackages] = useState(false);
  const [mappingVariants, setMappingVariants] = useState(false);
  const [sheetImportMode, setSheetImportMode] = useState<"generales" | "paquetes" | "matriz" | null>(null);
  const [sheetImporting, setSheetImporting] = useState(false);
  // Column mapping intermediate state
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [pendingMappings, setPendingMappings] = useState<ColumnMapping[]>([]);
  const [pendingRows, setPendingRows] = useState<Record<string, string>[]>([]);
  const [pendingAliasMap, setPendingAliasMap] = useState<Record<string, string[]>>({});
  const [pendingImportMode, setPendingImportMode] = useState<"generales" | "paquetes" | "matriz" | null>(null);
  // Sheet preview intermediate state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    headers: string[]; sampleRows: Record<string, string>[]; allRows: Record<string, string>[];
    matchedCount: number; totalFields: number; matchedFields: string[];
    tabRequested: string; aliasMap: Record<string, string[]>; mode: "generales" | "paquetes" | "matriz";
  } | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<PackageForm[]>([]);
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [showTaxFields, setShowTaxFields] = useState(false);

  // ── Queries ──
  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["tours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*, operators(name), categories(name), destinations(name)")
        .order("title");
      if (error) throw error;
      return data as unknown as TourRow[];
    },
  });

  const { data: operatorsList = [] } = useQuery({
    queryKey: ["operators-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operators")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const { data: categoriesList = [] } = useQuery({
    queryKey: ["categories-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const { data: destinationsList = [] } = useQuery({
    queryKey: ["destinations-active"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("destinations")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  // Exchange rate from settings
  const { data: exchangeRateUsd = 17.5 } = useQuery({
    queryKey: ["settings-exchange-usd"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings" as any)
        .select("value")
        .eq("key", "exchange_rate_usd")
        .maybeSingle();
      if (error) return 17.5;
      return parseFloat((data as any)?.value ?? "") || 17.5;
    },
  });

  // Auto-calc: commission net cost + MXN prices for adult & child
  useEffect(() => {
    if (!dialogOpen) return;
    const pubAdult = parseFloat(form.public_price_adult_usd) || 0;
    const pubChild = parseFloat(form.public_price_child_usd) || 0;
    const commPct = parseFloat(form.commission_percentage) || 0;
    const taxAdult = parseFloat(form.tax_adult_usd) || 0;
    const taxChild = parseFloat(form.tax_child_usd) || 0;
    const tcTour = parseFloat(form.exchange_rate_tour) || exchangeRateUsd;

    const updates: Partial<TourForm> = {};

    // Commission mode: auto-calc net cost
    if (form.calculation_mode === "commission") {
      const netAdult = pubAdult - (pubAdult * commPct / 100);
      const netChild = pubChild - (pubChild * commPct / 100);
      updates.price_adult_usd = netAdult > 0 ? netAdult.toFixed(2) : "";
      updates.price_child_usd = netChild > 0 ? netChild.toFixed(2) : "";
    }

    // Adulto MXN = (Público Adulto + Tax Adulto) × T.C. Tour
    const adultoMxn = (pubAdult + taxAdult) * tcTour;
    updates.price_mxn = adultoMxn > 0 ? adultoMxn.toFixed(2) : "0";

    // Menor MXN = (Público Niño + Tax Niño) × T.C. Tour
    const menorMxn = (pubChild + taxChild) * tcTour;
    updates.suggested_price_mxn = menorMxn > 0 ? menorMxn.toFixed(2) : "0";

    if (Object.keys(updates).length > 0) {
      setForm(prev => ({ ...prev, ...updates }));
    }
  }, [
    form.public_price_adult_usd, form.public_price_child_usd,
    form.tax_adult_usd, form.tax_child_usd,
    form.commission_percentage, form.calculation_mode,
    form.exchange_rate_tour, exchangeRateUsd, dialogOpen,
  ]);

  // ── Filters ──
  const categoryOptions = [...new Set(tours.map((t) => t.categories?.name).filter(Boolean))] as string[];
  const destinationOptions = [...new Set(tours.map((t) => (t as any).destinations?.name).filter(Boolean))] as string[];

  const filtered = tours.filter((t) => {
    if (categoryFilter !== "all" && t.categories?.name !== categoryFilter) return false;
    if (destinationFilter !== "all" && (t as any).destinations?.name !== destinationFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Toggle active ──
  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("tours").update({ active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Dialog helpers ──
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFiles([]);
    setImagePreviews([]);
    setImageUrlInput("");
    setPackages([]);
    setVariants([]);
    setShowTaxFields(false);
    setDialogOpen(true);
  };

  const openEdit = (tour: TourRow) => {
    setEditingId(tour.id);
    setForm({
      title: tour.title,
      operator_id: tour.operator_id ?? "",
      category_id: tour.category_id ?? "",
      destination_id: (tour as any).destination_id ?? "",
      type: tour.type,
      price_mxn: String(tour.price_mxn),
      price_adult_usd: String(tour.price_adult_usd || ""),
      price_child_usd: String(tour.price_child_usd || ""),
      child_age_min: String(tour.child_age_min ?? 4),
      child_age_max: String(tour.child_age_max ?? 10),
      suggested_price_mxn: String(tour.suggested_price_mxn || ""),
      mandatory_fees_usd: String(tour.mandatory_fees_usd || ""),
      public_price_adult_usd: String(tour.public_price_adult_usd || ""),
      public_price_child_usd: String(tour.public_price_child_usd || ""),
      tax_adult_usd: String(tour.tax_adult_usd || ""),
      tax_child_usd: String(tour.tax_child_usd || ""),
      calculation_mode: tour.calculation_mode || "net_cost",
      commission_percentage: String(tour.commission_percentage || ""),
      exchange_rate_tour: String((tour as any).exchange_rate_tour || ""),
      days: [...tour.days],
      short_description: tour.short_description,
      itinerary: tour.itinerary,
      includes: tour.includes.join(", "),
      excludes: tour.excludes.join(", "),
      meeting_point: tour.meeting_point,
      what_to_bring: tour.what_to_bring.join(", "),
      recommendations: tour.recommendations ?? "",
      tags: tour.tags.join(", "),
      service_type: (tour as any).service_type || "with_transport",
    });
    setShowTaxFields((tour.tax_adult_usd || 0) > 0 || (tour.tax_child_usd || 0) > 0);
    setImageFiles([]);
    setImagePreviews(tour.image_urls ?? []);

    // Load packages for this tour
    (async () => {
      const { data } = await (supabase as any)
        .from("tour_packages")
        .select("*")
        .eq("tour_id", tour.id)
        .order("sort_order");
      if (data && data.length > 0) {
        setPackages(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          service_type: p.service_type,
          public_price_adult_usd: String(p.public_price_adult_usd || ""),
          public_price_child_usd: String(p.public_price_child_usd || ""),
          cost_adult_usd: String(p.cost_adult_usd || ""),
          cost_child_usd: String(p.cost_child_usd || ""),
          tax_adult_usd: String(p.tax_adult_usd || ""),
          tax_child_usd: String(p.tax_child_usd || ""),
          mandatory_fees_usd: String(p.mandatory_fees_usd || ""),
          exchange_rate_tour: String(p.exchange_rate_tour || ""),
          price_adult_mxn: String(p.price_adult_mxn || "0"),
          price_child_mxn: String(p.price_child_mxn || "0"),
          includes: (p.includes || []).join(", "),
          excludes: (p.excludes || []).join(", "),
          active: p.active,
        })));
      } else {
        setPackages([]);
      }
    })();

    // Load variants for this tour (v2 schema)
    (async () => {
      const { data } = await supabase
        .from("tour_price_variants")
        .select("*")
        .eq("tour_id", tour.id)
        .eq("active", true);
      if (data && data.length > 0) {
        
        setVariants(data.map((v: any) => ({
          id: v.id,
          package_name: v.package_name || "",
          zone: v.zone,
          pax_type: v.pax_type || "Adulto",
          nationality: v.nationality || "Extranjero",
          sale_price: String(v.sale_price || ""),
          net_cost: String(v.net_cost || ""),
          tax_fee: String(v.tax_fee || ""),
        })));
      } else {
        setVariants([]);
      }
    })();

    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = 4 - imagePreviews.length;
    const toAdd = files.slice(0, remaining);
    setImageFiles(prev => [...prev, ...toAdd]);
    setImagePreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    if (e.target) e.target.value = "";
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/i.test(url)) {
      toast.error("URL no válida — debe empezar con http:// o https://");
      return;
    }
    if (imagePreviews.length >= 4) {
      toast.error("Máximo 4 imágenes");
      return;
    }
    setImagePreviews(prev => [...prev, url]);
    setImageUrlInput("");
  };

  const removeImage = (index: number) => {
    // imagePreviews = [...existingHttpUrls, ...blobUrlsForNewFiles]
    // imageFiles only contains new File objects, so its index = preview index - httpUrlCount
    const preview = imagePreviews[index];
    if (!preview.startsWith("http")) {
      const httpCount = imagePreviews.slice(0, index).filter(p => p.startsWith("http")).length;
      const fileIndex = index - httpCount;
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingDoc(true);
    try {
      // Compress image before sending
      const { compressImage } = await import("@/lib/compress-image");
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-tour-document`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: formData,
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al analizar documento");
      }
      const data = await res.json();
      // Pre-fill ONLY descriptive fields — never overwrite prices/variants
      setForm(prev => ({
        ...prev,
        title: (!editingId && data.tour_name) ? data.tour_name : prev.title,
        short_description: data.short_description || prev.short_description,
        itinerary: data.itinerary || prev.itinerary,
        includes: data.includes?.join(", ") || prev.includes,
        excludes: data.excludes?.join(", ") || prev.excludes,
        meeting_point: data.meeting_point || prev.meeting_point,
        what_to_bring: data.what_to_bring?.join(", ") || prev.what_to_bring,
        recommendations: data.recommendations || prev.recommendations,
      }));
      toast.success("Documento analizado: campos descriptivos pre-llenados");
    } catch (err: any) {
      toast.error(err.message || "Error al procesar documento");
    } finally {
      setParsingDoc(false);
      if (e.target) e.target.value = "";
    }
  };

  // ── AI mapping: packages ──
  const handlePackageDocUpload = async (file: File) => {
    setMappingPackages(true);
    try {
      const { compressImage } = await import("@/lib/compress-image");
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed);
      fd.append("mode", "packages");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-tour-pricing`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: fd,
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al analizar documento");
      }
      const data = await res.json();
      if (data.packages?.length) {
        const tc = parseFloat(form.exchange_rate_tour) || exchangeRateUsd;
        const taxAdult = parseFloat(form.tax_adult_usd) || 0;
        const taxChild = parseFloat(form.tax_child_usd) || 0;
        const mapped: PackageForm[] = data.packages.map((p: any) => {
          const pubAdult = parseFloat(String(p.public_price_adult_usd)) || 0;
          const pubChild = parseFloat(String(p.public_price_child_usd)) || 0;
          return {
            ...emptyPackage,
            name: p.name || "",
            service_type: p.service_type || "with_transport",
            public_price_adult_usd: String(pubAdult || ""),
            public_price_child_usd: String(pubChild || ""),
            cost_adult_usd: String(p.cost_adult_usd || ""),
            cost_child_usd: String(p.cost_child_usd || ""),
            mandatory_fees_usd: String(p.mandatory_fees_usd || ""),
            includes: (p.includes || []).join(", "),
            excludes: (p.excludes || []).join(", "),
            price_adult_mxn: ((pubAdult + taxAdult) * tc).toFixed(2),
            price_child_mxn: ((pubChild + taxChild) * tc).toFixed(2),
          };
        });
        setPackages(prev => [...prev, ...mapped]);
        toast.success(`${mapped.length} paquete(s) extraído(s) del documento`);
      } else {
        toast.info("No se encontraron paquetes en el documento");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar documento");
    } finally {
      setMappingPackages(false);
    }
  };

  // ── AI mapping: variants ──
  const handleVariantDocUpload = async (file: File) => {
    setMappingVariants(true);
    try {
      const { compressImage } = await import("@/lib/compress-image");
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed);
      fd.append("mode", "variants");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-tour-pricing`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: fd,
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al analizar documento");
      }
      const data = await res.json();
      if (data.variants?.length) {
        const mapped: VariantForm[] = data.variants.map((v: any) => ({
          ...emptyVariant,
          package_name: v.package_name || "",
          zone: v.zone || "Playa del Carmen",
          pax_type: v.pax_type || "Adulto",
          nationality: v.nationality || "Extranjero",
          sale_price: String(v.sale_price || ""),
          net_cost: String(v.net_cost || ""),
          tax_fee: String(v.tax_fee || ""),
        }));
        setVariants(prev => [...prev, ...mapped]);
        toast.success(`${mapped.length} variante(s) extraída(s) del documento`);
      } else {
        toast.info("No se encontraron variantes de precio en el documento");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar documento");
    } finally {
      setMappingVariants(false);
    }
  };

  // ── Google Sheet import ──
  const defaultSheetTabs: Record<string, string> = {
    generales: "Grales",
    paquetes: "Paquetes",
    matriz: "Matriz",
  };

  const handleSheetImport = async (sheetId: string, tabName: string) => {
    if (!sheetImportMode) return;
    const mode = sheetImportMode;
    setSheetImporting(true);
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`No se pudo acceder al Sheet (${res.status}). Verifica que sea público.`);
      const text = await res.text();
      if (text.trim().startsWith("<!") || text.trim().startsWith("<html")) {
        throw new Error("El Sheet no es público o la pestaña no existe. Verifica el nombre exacto.");
      }
      const aliasMap = mode === "generales" ? GENERAL_ALIASES : mode === "paquetes" ? PKG_ALIASES : VARIANT_ALIASES;
      const aliasKeys = collectAliasKeys(aliasMap);
      const { headers, sampleRows, allRows } = parseCSVPreview(text, 3, aliasKeys);
      if (allRows.length === 0) throw new Error("La pestaña está vacía o no tiene el formato esperado.");

      const validation = validateTabContent(headers, aliasMap);

      // Show preview dialog ALWAYS before proceeding
      setPreviewData({
        headers, sampleRows, allRows,
        matchedCount: validation.matchedCount,
        totalFields: validation.totalFields,
        matchedFields: validation.matchedFields,
        tabRequested: tabName,
        aliasMap, mode,
      });
      setPreviewDialogOpen(true);
      setSheetImportMode(null);
    } catch (err: any) {
      toast.error(err.message || "Error al importar Sheet");
    } finally {
      setSheetImporting(false);
    }
  };

  /** Called when user confirms the preview and wants to proceed to mapping */
  const handlePreviewConfirm = () => {
    if (!previewData) return;
    const { headers, allRows, aliasMap, mode } = previewData;
    setPreviewDialogOpen(false);

    const mappings = autoMapColumns(headers, aliasMap);
    const hasSuggested = mappings.some(m => m.status === "suggested");
    const hasUnmapped = mappings.some(m => m.status === "unmapped" && normKey(m.header).length > 0);

    if (hasSuggested || hasUnmapped) {
      setPendingMappings(mappings);
      setPendingRows(allRows);
      setPendingAliasMap(aliasMap);
      setPendingImportMode(mode);
      setMappingDialogOpen(true);
    } else {
      processImport(mode, allRows, mappings, aliasMap);
    }
    setPreviewData(null);
  };

  const handleMappingConfirm = (finalMappings: ColumnMapping[]) => {
    if (!pendingImportMode) return;
    processImport(pendingImportMode, pendingRows, finalMappings, pendingAliasMap);
    setPendingMappings([]);
    setPendingRows([]);
    setPendingAliasMap({});
    setPendingImportMode(null);
  };

  /** Apply column mapping to remap row keys, then use getCol as before */
  const processImport = (
    mode: "generales" | "paquetes" | "matriz",
    rows: Record<string, string>[],
    mappings: ColumnMapping[],
    aliasMap: Record<string, string[]>
  ) => {
    // Build header→fieldKey remap: original header → first alias of the field
    const remap: Record<string, string> = {};
    for (const m of mappings) {
      if (m.fieldKey && aliasMap[m.fieldKey]?.[0]) {
        remap[m.header] = aliasMap[m.fieldKey][0];
      }
    }

    // Remap rows: replace original header keys with canonical alias names
    const remappedRows = rows.map(row => {
      const newRow: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        const mappedKey = remap[key] ?? key;
        newRow[mappedKey] = val;
      }
      return newRow;
    });

    if (mode === "generales") {
      const row = remappedRows[0];
      setForm((prev) => ({
        ...prev,
        title: getCol(row, ...GENERAL_ALIASES.title) || prev.title,
        short_description: getCol(row, ...GENERAL_ALIASES.description) || prev.short_description,
        itinerary: getCol(row, ...GENERAL_ALIASES.itinerary) || prev.itinerary,
        includes: getCol(row, ...GENERAL_ALIASES.includes) || prev.includes,
        excludes: getCol(row, ...GENERAL_ALIASES.excludes) || prev.excludes,
        meeting_point: getCol(row, ...GENERAL_ALIASES.meeting_point) || prev.meeting_point,
        what_to_bring: getCol(row, ...GENERAL_ALIASES.what_to_bring) || prev.what_to_bring,
        recommendations: getCol(row, ...GENERAL_ALIASES.recommendations) || prev.recommendations,
      }));
      toast.success("Campos generales importados del Sheet");

    } else if (mode === "paquetes") {
      const tc = parseFloat(form.exchange_rate_tour) || exchangeRateUsd;
      const taxAdult = parseFloat(form.tax_adult_usd) || 0;
      const taxChild = parseFloat(form.tax_child_usd) || 0;
      const mapped: PackageForm[] = remappedRows
        .map((row) => {
          const name = getCol(row, ...PKG_ALIASES.name);
          if (!name) return null;
          const pubAdult = parseNum(getCol(row, ...PKG_ALIASES.pub_adult_usd));
          const pubChild = parseNum(getCol(row, ...PKG_ALIASES.pub_child_usd));
          const svcRaw = getCol(row, ...PKG_ALIASES.service_type);
          const svcType = svcRaw.toLowerCase().includes("entrada") ? "entry_only" : "with_transport";
          const costAdultRaw = getCol(row, ...PKG_ALIASES.cost_adult);
          const costChildRaw = getCol(row, ...PKG_ALIASES.cost_child);
          const taxAdultRaw = getCol(row, ...PKG_ALIASES.tax_adult);
          const taxChildRaw = getCol(row, ...PKG_ALIASES.tax_child);
          return {
            ...emptyPackage,
            name,
            service_type: svcType,
            public_price_adult_usd: String(pubAdult),
            public_price_child_usd: String(pubChild),
            cost_adult_usd: costAdultRaw ? String(parseNum(costAdultRaw)) : "",
            cost_child_usd: costChildRaw ? String(parseNum(costChildRaw)) : "",
            tax_adult_usd: taxAdultRaw ? String(parseNum(taxAdultRaw)) : "",
            tax_child_usd: taxChildRaw ? String(parseNum(taxChildRaw)) : "",
            mandatory_fees_usd: getCol(row, ...PKG_ALIASES.fees) ? String(parseNum(getCol(row, ...PKG_ALIASES.fees))) : "",
            includes: getCol(row, ...PKG_ALIASES.includes),
            excludes: getCol(row, ...PKG_ALIASES.excludes),
            price_adult_mxn: ((pubAdult + taxAdult) * tc).toFixed(2),
            price_child_mxn: ((pubChild + taxChild) * tc).toFixed(2),
          } as PackageForm;
        })
        .filter(Boolean) as PackageForm[];
      if (!mapped.length) {
        toast.error("No se encontraron paquetes. Verifica los encabezados.");
        return;
      }
      setPackages((prev) => [...prev, ...mapped]);
      toast.success(`${mapped.length} paquete(s) importado(s) del Sheet`);

    } else if (mode === "matriz") {
      const mapped: VariantForm[] = remappedRows
        .map((row) => {
          const salePrice = getCol(row, ...VARIANT_ALIASES.sale_price);
          if (!salePrice) return null;
          const pkgRaw = getCol(row, ...VARIANT_ALIASES.package);
          return {
            ...emptyVariant,
            package_name: pkgRaw || "",
            zone: getCol(row, ...VARIANT_ALIASES.zone) || "Playa del Carmen",
            pax_type: getCol(row, ...VARIANT_ALIASES.pax_type) || "Adulto",
            nationality: getCol(row, ...VARIANT_ALIASES.nationality) || "Extranjero",
            sale_price: String(parseNum(salePrice)),
            net_cost: getCol(row, ...VARIANT_ALIASES.net_cost) ? String(parseNum(getCol(row, ...VARIANT_ALIASES.net_cost))) : "",
            tax_fee: getCol(row, ...VARIANT_ALIASES.tax_fee) ? String(parseNum(getCol(row, ...VARIANT_ALIASES.tax_fee))) : "",
          } as VariantForm;
        })
        .filter(Boolean) as VariantForm[];
      if (!mapped.length) {
        toast.error("No se encontraron variantes. Verifica que haya una columna de precio de venta.");
        return;
      }
      setVariants((prev) => [...prev, ...mapped]);
      toast.success(`${mapped.length} variante(s) importada(s) del Sheet`);
    }
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  };

  // Compute utility % for net_cost mode display
  const utilityPct = (() => {
    if (form.calculation_mode !== "net_cost") return null;
    const pub = parseFloat(form.public_price_adult_usd) || 0;
    const net = parseFloat(form.price_adult_usd) || 0;
    if (pub <= 0) return null;
    return (((pub - net) / pub) * 100).toFixed(1);
  })();

  const isCommissionMode = form.calculation_mode === "commission";

  const csvToArr = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);

  const saveVariants = async (tourId: string) => {
    await supabase.from("tour_price_variants").delete().eq("tour_id", tourId);
    if (variants.length === 0) return;
    const rows = variants.map(v => ({
      tour_id: tourId,
      operator_id: form.operator_id || "",
      package_name: v.package_name || "",
      zone: v.zone,
      pax_type: v.pax_type,
      nationality: v.nationality,
      sale_price: Number(v.sale_price) || 0,
      net_cost: Number(v.net_cost) || 0,
      tax_fee: Number(v.tax_fee) || 0,
      active: true,
    }));
    if (rows.length === 0) return;
    const { error } = await supabase
      .from("tour_price_variants")
      .upsert(rows, { onConflict: "tour_id,operator_id,zone,pax_type,nationality,package_name" });
    if (error) throw error;
  };

  const savePackages = async (tourId: string) => {
    if (packages.length === 0) {
      // Delete all existing packages for this tour
      await (supabase as any).from("tour_packages").delete().eq("tour_id", tourId);
      return;
    }
    // Delete old, insert new
    await (supabase as any).from("tour_packages").delete().eq("tour_id", tourId);
    const rows = packages.map((p, i) => ({
      tour_id: tourId,
      name: p.name.trim() || `Paquete ${i + 1}`,
      service_type: p.service_type,
      public_price_adult_usd: Number(p.public_price_adult_usd) || 0,
      public_price_child_usd: Number(p.public_price_child_usd) || 0,
      cost_adult_usd: Number(p.cost_adult_usd) || 0,
      cost_child_usd: Number(p.cost_child_usd) || 0,
      tax_adult_usd: parseFloat(form.tax_adult_usd) || 0,
      tax_child_usd: parseFloat(form.tax_child_usd) || 0,
      mandatory_fees_usd: Number(p.mandatory_fees_usd) || 0,
      exchange_rate_tour: parseFloat(form.exchange_rate_tour) || exchangeRateUsd,
      price_adult_mxn: Number(p.price_adult_mxn) || 0,
      price_child_mxn: Number(p.price_child_mxn) || 0,
      includes: csvToArr(p.includes),
      excludes: csvToArr(p.excludes),
      active: p.active,
      sort_order: i,
    }));
    const { error } = await (supabase as any).from("tour_packages").insert(rows);
    if (error) throw error;
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("El título es obligatorio"); return; }
    setSaving(true);
    try {
      // Upload new images and build image_urls array
      let finalImageUrls = [...imagePreviews.filter(p => p.startsWith("http"))];
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop();
        const path = `tours/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
        finalImageUrls.push(urlData.publicUrl);
      }

      const payload = {
        title: form.title.trim(),
        operator_id: form.operator_id || null,
        category_id: form.category_id || null,
        destination_id: form.destination_id || null,
        type: form.type,
        price_mxn: Number(form.price_mxn) || 0,
        price_adult_usd: Number(form.price_adult_usd) || 0,
        price_child_usd: Number(form.price_child_usd) || 0,
        child_age_min: Number(form.child_age_min) || 4,
        child_age_max: Number(form.child_age_max) || 10,
        suggested_price_mxn: Number(form.suggested_price_mxn) || 0,
        mandatory_fees_usd: Number(form.mandatory_fees_usd) || 0,
        public_price_adult_usd: Number(form.public_price_adult_usd) || 0,
        public_price_child_usd: Number(form.public_price_child_usd) || 0,
        tax_adult_usd: Number(form.tax_adult_usd) || 0,
        tax_child_usd: Number(form.tax_child_usd) || 0,
        calculation_mode: form.calculation_mode,
        commission_percentage: Number(form.commission_percentage) || 0,
        exchange_rate_tour: Number(form.exchange_rate_tour) || 0,
        days: form.days,
        short_description: form.short_description.trim(),
        itinerary: form.itinerary.trim(),
        includes: csvToArray(form.includes),
        excludes: csvToArray(form.excludes),
        meeting_point: form.meeting_point.trim(),
        what_to_bring: csvToArray(form.what_to_bring),
        recommendations: form.recommendations.trim() || null,
        tags: csvToArray(form.tags),
        image_urls: finalImageUrls,
        service_type: form.service_type,
      };

      if (editingId) {
        const { error } = await supabase.from("tours").update(payload as any).eq("id", editingId);
        if (error) throw error;
        toast.success("Tour actualizado");

        // Save packages & variants
        const tourId = editingId;
        await savePackages(tourId);
        await saveVariants(tourId);
      } else {
        const { data: newTour, error } = await supabase.from("tours").insert(payload as any).select("id").single();
        if (error) throw error;
        toast.success("Tour creado");

        // Save packages & variants
        if (newTour) {
          await savePackages(newTour.id);
          await saveVariants(newTour.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["tours"] });
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
          <h1 className="text-2xl font-bold font-display">Catálogo de Tours</h1>
          <p className="text-sm text-muted-foreground">Fichas técnicas para mostrador</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /><span className="hidden sm:inline">Nuevo Tour</span><span className="sm:hidden">Nuevo</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar tour..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <p className="text-center text-muted-foreground py-8">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No se encontraron tours</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tour) => (
            <Card
              key={tour.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTour(tour)}
            >
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={tour.image_urls?.[0] || PLACEHOLDER_IMG}
                  alt={tour.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                />
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">{tour.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Badge variant={tour.type === "private" ? "default" : "secondary"} className="text-[10px]">
                      {tour.type === "private" ? "Privado" : "Compartido"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {(tour as any).service_type === "entry_only" ? "Solo Entrada" : "Con Transporte"}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{tour.short_description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tour.operators?.name ?? "—"}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tour.days.length} días/sem</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-primary">{formatPrice(tour.price_mxn)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{tour.categories?.name ?? ""}</span>
                    {isAdmin && (
                      <>
                        <Switch
                          checked={tour.active}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={(checked) => {
                            toggleActive.mutate({ id: tour.id, active: checked });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); openEdit(tour); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
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

      {/* Showroom Dialog */}
      {selectedTour && <TourShowroom tour={selectedTour} onClose={() => setSelectedTour(null)} onCreateReservation={(tourId) => navigate(`/reservas?tour_id=${tourId}`)} onCreateQuote={(tourId) => navigate(`/cotizaciones?tour_id=${tourId}`)} />}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto w-full">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Tour" : "Nuevo Tour"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos del tour." : "Completa la ficha técnica del tour."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Row 1 */}
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operador</Label>
                <Select value={form.operator_id} onValueChange={(v) => setForm({ ...form, operator_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {operatorsList.map((op) => (
                      <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {categoriesList.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Destino</Label>
                <Select value={form.destination_id} onValueChange={(v) => setForm({ ...form, destination_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {destinationsList.map((dest) => (
                      <SelectItem key={dest.id} value={dest.id}>{dest.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">Compartido</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Servicio</Label>
                <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="with_transport">Con Transporte</SelectItem>
                    <SelectItem value="entry_only">Solo Entrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Tipo de Cambio y Precios Finales (MXN) ── */}
            <Separator />
            <p className="text-sm font-semibold">💱 Tipo de Cambio y Precios Finales (MXN)</p>
            <div className="space-y-1.5">
              <Label>T.C. del Tour</Label>
              <Input type="number" value={form.exchange_rate_tour} onChange={(e) => setForm({ ...form, exchange_rate_tour: e.target.value })} placeholder={String(exchangeRateUsd)} />
              <p className="text-xs text-muted-foreground">Se usa el global ${exchangeRateUsd} si se deja vacío</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio Público Adulto (MXN)</Label>
                <Input type="number" value={form.price_mxn} disabled className="bg-muted" />
                <p className="text-[10px] text-muted-foreground">= (Pub USD + Tax USD) × T.C.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Precio Público Menor (MXN)</Label>
                <Input type="number" value={form.suggested_price_mxn} disabled className="bg-muted" />
                <p className="text-[10px] text-muted-foreground">= (Pub USD + Tax USD) × T.C.</p>
              </div>
            </div>

            {/* ── Precios Operador (USD) — Calculadora Dual ── */}
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Precios Operador (USD)</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{isCommissionMode ? "Modo Comisión" : "Modo Costo Neto"}</span>
                <Switch
                  checked={isCommissionMode}
                  onCheckedChange={(checked) => setForm({ ...form, calculation_mode: checked ? "commission" : "net_cost" })}
                />
              </div>
            </div>

            {isCommissionMode ? (
              <>
                {/* Commission Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Precio Público Adulto USD</Label>
                    <Input type="number" value={form.public_price_adult_usd} onChange={(e) => setForm({ ...form, public_price_adult_usd: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>% Comisión</Label>
                    <Input type="number" value={form.commission_percentage} onChange={(e) => setForm({ ...form, commission_percentage: e.target.value })} placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Costo Neto Adulto USD</Label>
                    <Input type="number" value={form.price_adult_usd} disabled className="bg-muted" placeholder="Auto" />
                    <p className="text-[10px] text-muted-foreground">= Público − (Público × %)</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Precio Público Niño USD</Label>
                    <Input type="number" value={form.public_price_child_usd} onChange={(e) => setForm({ ...form, public_price_child_usd: e.target.value })} placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Costo Neto Niño USD</Label>
                    <Input type="number" value={form.price_child_usd} disabled className="bg-muted" placeholder="Auto" />
                  </div>
                  <div />
                </div>
              </>
            ) : (
              <>
                {/* Net Cost Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Costo Neto Adulto USD</Label>
                    <Input type="number" value={form.price_adult_usd} onChange={(e) => setForm({ ...form, price_adult_usd: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Precio Público Adulto USD</Label>
                    <Input type="number" value={form.public_price_adult_usd} onChange={(e) => setForm({ ...form, public_price_adult_usd: e.target.value })} placeholder="0" />
                  </div>
                </div>
                {utilityPct !== null && (
                  <p className="text-sm text-muted-foreground">% Utilidad: <span className="font-semibold text-primary">{utilityPct}%</span></p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Costo Neto Niño USD</Label>
                    <Input type="number" value={form.price_child_usd} onChange={(e) => setForm({ ...form, price_child_usd: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Precio Público Niño USD</Label>
                    <Input type="number" value={form.public_price_child_usd} onChange={(e) => setForm({ ...form, public_price_child_usd: e.target.value })} placeholder="0" />
                  </div>
                </div>
              </>
            )}

            {/* Tax toggle + conditional fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>¿Impuestos se pagan al abordar?</Label>
                  <p className="text-xs text-muted-foreground">Activado = el cliente paga impuestos en efectivo al abordar</p>
                </div>
                <Switch checked={showTaxFields} onCheckedChange={(checked) => {
                  setShowTaxFields(checked);
                  if (!checked) {
                    setForm({ ...form, tax_adult_usd: "", tax_child_usd: "" });
                  }
                }} />
              </div>
              {showTaxFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Impuesto Adulto USD</Label>
                    <Input type="number" value={form.tax_adult_usd} onChange={(e) => setForm({ ...form, tax_adult_usd: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Impuesto Niño USD</Label>
                    <Input type="number" value={form.tax_child_usd} onChange={(e) => setForm({ ...form, tax_child_usd: e.target.value })} placeholder="0" />
                  </div>
                </div>
              )}
            </div>

            {/* Edad menor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Edad mín. menor</Label>
                <Input type="number" value={form.child_age_min} onChange={(e) => setForm({ ...form, child_age_min: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Edad máx. menor</Label>
                <Input type="number" value={form.child_age_max} onChange={(e) => setForm({ ...form, child_age_max: e.target.value })} />
              </div>
            </div>

            {/* ── Paquetes del Tour ── */}
            <Separator />
            <PackageEditor
              packages={packages}
              onChange={setPackages}
              tourExchangeRate={parseFloat(form.exchange_rate_tour) || exchangeRateUsd}
              tourTaxAdultUsd={parseFloat(form.tax_adult_usd) || 0}
              tourTaxChildUsd={parseFloat(form.tax_child_usd) || 0}
              onDocUpload={isAdmin ? handlePackageDocUpload : undefined}
              isMapping={mappingPackages}
              onSheetImport={isAdmin ? () => setSheetImportMode("paquetes") : undefined}
            />

            <Separator />

            <PriceVariantEditor
              variants={variants}
              onChange={setVariants}
              packages={packages.map(p => ({ id: p.id, name: p.name }))}
              isAdmin={isAdmin}
              onDocUpload={isAdmin ? handleVariantDocUpload : undefined}
              isMapping={mappingVariants}
              onSheetImport={isAdmin ? () => setSheetImportMode("matriz") : undefined}
            />

            <Separator />

            {/* Days */}
            <div className="space-y-1.5">
              <Label>Días de operación</Label>
              <div className="flex flex-wrap gap-3">
                {ALL_DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={form.days.includes(day)} onCheckedChange={() => toggleDay(day)} />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Descripción corta</Label>
              <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label>Itinerario</Label>
              <Textarea rows={3} value={form.itinerary} onChange={(e) => setForm({ ...form, itinerary: e.target.value })} />
            </div>

            {/* Comma-separated fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Incluye (separado por coma)</Label>
                <Input value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>No incluye (separado por coma)</Label>
                <Input value={form.excludes} onChange={(e) => setForm({ ...form, excludes: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Punto de encuentro</Label>
              <Input value={form.meeting_point} onChange={(e) => setForm({ ...form, meeting_point: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Qué llevar (separado por coma)</Label>
                <Input value={form.what_to_bring} onChange={(e) => setForm({ ...form, what_to_bring: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tags (separado por coma)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Recomendaciones</Label>
              <Input value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} />
            </div>

            {/* Image upload - up to 4 photos */}
            <div className="space-y-1.5">
              <Label>Imágenes (hasta 4)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-video rounded border overflow-hidden bg-muted">
                    <img src={preview} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                    <Button
                      type="button" variant="destructive" size="icon"
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => removeImage(idx)}
                    >×</Button>
                  </div>
                ))}
                {imagePreviews.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              {imagePreviews.length < 4 && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddImageUrl())}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddImageUrl} disabled={!imageUrlInput.trim()}>
                    + URL
                  </Button>
                </div>
              )}
            </div>

            {/* AI Document Mapping (admin only) */}
            {isAdmin && (
              <div className="space-y-1.5">
                <Label>Mapeo Inteligente — Generales</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()} disabled={parsingDoc}>
                    {parsingDoc ? "Analizando…" : "📄 Mapear PDF"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSheetImportMode("generales")} disabled={parsingDoc}>
                    <Table2 className="mr-1 h-3 w-3" /> Importar Sheet
                  </Button>
                  <p className="text-[11px] text-muted-foreground">Pre-llena los campos descriptivos del tour.</p>
                </div>
                <input ref={docInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocUpload} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Sheet import dialog (shared across all 3 modes) */}
      <SheetImportDialog
        open={sheetImportMode !== null}
        onOpenChange={(v) => { if (!v) setSheetImportMode(null); }}
        defaultTab={sheetImportMode ? defaultSheetTabs[sheetImportMode] : ""}
        loading={sheetImporting}
        onImport={handleSheetImport}
      />

      {/* Sheet preview dialog */}
      <SheetPreviewDialog
        open={previewDialogOpen}
        onOpenChange={(v) => { if (!v) { setPreviewDialogOpen(false); setPreviewData(null); } }}
        tabRequested={previewData?.tabRequested ?? ""}
        headers={previewData?.headers ?? []}
        sampleRows={previewData?.sampleRows ?? []}
        matchedCount={previewData?.matchedCount ?? 0}
        totalFields={previewData?.totalFields ?? 0}
        matchedFields={previewData?.matchedFields ?? []}
        onConfirm={handlePreviewConfirm}
      />

      {/* Column mapping dialog */}
      <ColumnMappingDialog
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        mappings={pendingMappings}
        aliasMap={pendingAliasMap}
        onConfirm={handleMappingConfirm}
        sampleRow={pendingRows[0]}
      />
    </div>
  );
}
