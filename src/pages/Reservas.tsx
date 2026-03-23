import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, FileText, Printer, Send, Pencil, DollarSign, CheckCircle, MoreVertical, Trash2, Tag, Calendar } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import DateRangeFilter from "@/components/shared/DateRangeFilter";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeTourPrice, computeTotal, TourPackageRow } from "@/lib/tour-pricing";
import VoucherPrintView from "@/components/reservations/VoucherPrintView";
import ReservationCheckout from "@/components/reservations/ReservationCheckout";
import { buildWhatsAppMessage, openWhatsApp } from "@/components/reservations/whatsapp-message";
import SendConfirmationDialog from "@/components/reservations/SendConfirmationDialog";
import DiscountInput from "@/components/shared/DiscountInput";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

const ZONES = ["Playa del Carmen", "Riviera Maya"];
const NATIONALITIES = ["Nacional", "Extranjero"];

/* ── status helpers ── */
const statusStyles: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-yellow-100 text-yellow-700",
};
const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No Show",
};

const paymentStyles: Record<string, string> = {
  unpaid: "bg-yellow-100 text-yellow-700",
  deposit: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
};
const paymentLabels: Record<string, string> = {
  unpaid: "Pendiente",
  deposit: "Anticipo",
  paid: "Pagado",
};

/* ── form defaults ── */
const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

/* ── form defaults (edit mode) ── */
const emptyForm = {
  tour_id: "",
  client_id: "",
  modality: "shared",
  reservation_date: "",
  reservation_time: "",
  pax_adults: 1,
  pax_children: 0,
  zone: "",
  nationality: "",
  total_mxn: 0,
  discount_mxn: 0,
  notes: "",
  status: "scheduled",
  hotel_name: "",
  pickup_notes: "",
  pickup_point: "",
  tour_language: "",
  tax_included: false,
  pax_email: "",
  operator_confirmation_code: "",
};

/* ── multi-tour create types ── */
interface ResItem {
  id: string;
  tour_id: string;
  reservation_date: string;
  reservation_time: string;
  pax_adults: number;
  pax_children: number;
  total_mxn: number;
  modality: string;
  package_name: string;
}

const emptyResItem = (): ResItem => ({
  id: crypto.randomUUID(),
  tour_id: "",
  reservation_date: "",
  reservation_time: "",
  pax_adults: 1,
  pax_children: 0,
  total_mxn: 0,
  modality: "shared",
  package_name: "",
});

const emptyShared = {
  client_id: "",
  zone: "",
  nationality: "",
  notes: "",
  discount_mxn: 0,
  hotel_name: "",
  pax_email: "",
  pickup_notes: "",
  pickup_point: "",
  tour_language: "",
  tax_included: false,
  operator_confirmation_code: "",
};

export default function Reservas() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = role === "admin";

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  // create-mode multi-tour state
  const [shared, setShared] = useState(emptyShared);
  const [items, setItems] = useState<ResItem[]>([emptyResItem()]);
  const [voucherReservation, setVoucherReservation] = useState<any>(null);
  const voucherRef = useRef<HTMLDivElement>(null);
  const [checkoutReservation, setCheckoutReservation] = useState<any>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [sendConfirmReservation, setSendConfirmReservation] = useState<any>(null);
  // operator folio mini-dialog
  const [folioDialogRes, setFolioDialogRes] = useState<any>(null);
  const [folioInput, setFolioInput] = useState("");
  const [cancFolioInput, setCancFolioInput] = useState("");

  // mini-dialog nuevo cliente
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "" });

  /* ── queries ── */
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, tours(title, includes, meeting_point, short_description, operator_id, operators(name)), clients(name, phone, email)")
        .order("reservation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch operator_payables for prepago blocking
  const { data: payables = [] } = useQuery({
    queryKey: ["operator-payables"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("operator_payables")
        .select("reservation_id, status, payment_rule_snapshot");
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch operators for prepago check
  const { data: operators = [] } = useQuery({
    queryKey: ["operators-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operators")
        .select("id, name, payment_rules, fee_collection_mode");
      if (error) throw error;
      return data;
    },
  });

  const { data: tours = [] } = useQuery({
    queryKey: ["tours-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("id, title, price_mxn, suggested_price_mxn, public_price_adult_usd, public_price_child_usd, exchange_rate_tour, tax_adult_usd, tax_child_usd, mandatory_fees_usd, operator_id")
        .eq("active", true)
        .order("title");
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

  const { data: allTourPackages = [] } = useQuery<TourPackageRow[]>({
    queryKey: ["tour-packages-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_packages")
        .select("tour_id, name, price_adult_mxn, price_child_mxn")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as TourPackageRow[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // ── Auto-pricing (edit mode only) ──
  useEffect(() => {
    if (!editingId || !form.tour_id) return;
    const result = computeTourPrice(form.tour_id, form.zone, form.nationality, allVariants as any, tours as any);
    const total = computeTotal(result.adultPrice, result.childPrice, form.pax_adults, form.pax_children);
    setForm((p) => ({ ...p, total_mxn: total }));
  }, [editingId, form.tour_id, form.zone, form.nationality, form.pax_adults, form.pax_children, allVariants, tours]);

  // ── Detect ?tour_id= query param to open create dialog ──
  useEffect(() => {
    const tourId = searchParams.get("tour_id");
    if (tourId && tours.length > 0) {
      setShared(emptyShared);
      setItems([{ ...emptyResItem(), tour_id: tourId }]);
      setEditingId(null);
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, tours]);

  // ── Detect ?promo_package_id= to pre-fill with Xcaret package tours ──
  useEffect(() => {
    const promoId = searchParams.get("promo_package_id");
    if (!promoId || tours.length === 0) return;

    (async () => {
      try {
        const { data: pkg, error: e1 } = await supabase
          .from("promo_packages")
          .select("name, public_price_adult_usd, public_price_child_usd")
          .eq("id", promoId)
          .single();
        if (e1 || !pkg) return;

        const { data: links, error: e2 } = await supabase
          .from("promo_package_tours")
          .select("tour_id")
          .eq("promo_package_id", promoId);
        if (e2 || !links?.length) return;

        const tourIds = links.map((l: any) => l.tour_id);

        // Distribute package price proportionally
        const toursInPkg = tourIds.map((tid: string) => tours.find((t: any) => t.id === tid)).filter(Boolean);
        const sumBase = toursInPkg.reduce((acc: number, t: any) => acc + ((t as any).price_mxn || (t as any).suggested_price_mxn || 0), 0);

        const newItems: ResItem[] = tourIds.map((tid: string) => {
          const t = tours.find((x: any) => x.id === tid);
          const basePrice = (t as any)?.price_mxn || (t as any)?.suggested_price_mxn || 0;
          const ratio = sumBase > 0 ? basePrice / sumBase : 1 / tourIds.length;
          const totalForItem = Math.round((pkg as any).public_price_adult_usd * ratio * 100) / 100;

          return {
            ...emptyResItem(),
            tour_id: tid,
            pax_adults: 1,
            pax_children: 0,
            total_mxn: totalForItem,
          };
        });

        setShared({ ...emptyShared, notes: `Paquete Xcaret: ${(pkg as any).name}` });
        setItems(newItems);
        setEditingId(null);
        setDialogOpen(true);
      } catch {
        // silently fail
      }
      setSearchParams({}, { replace: true });
    })();
  }, [searchParams, tours]);

  // ── Detect ?promotion_id= to pre-fill with custom promotion tours ──
  useEffect(() => {
    const promoId = searchParams.get("promotion_id");
    if (!promoId || tours.length === 0) return;

    (async () => {
      try {
        const { data: promo, error: e1 } = await supabase
          .from("promotions")
          .select("name, subtotal_mxn, discount_mxn, total_mxn")
          .eq("id", promoId)
          .single();
        if (e1 || !promo) return;

        const { data: links, error: e2 } = await supabase
          .from("promotion_tours")
          .select("tour_id, package_name")
          .eq("promotion_id", promoId);
        if (e2 || !links?.length) return;

        const promoItems = links.map((l: any) => ({ tour_id: l.tour_id, package_name: l.package_name }));
        const sumBase = promoItems.reduce((acc: number, item: any) => {
          const t = tours.find((x: any) => x.id === item.tour_id);
          return acc + ((t as any)?.price_mxn || (t as any)?.suggested_price_mxn || 0);
        }, 0);

        const newItems: ResItem[] = promoItems.map((item: any) => {
          const t = tours.find((x: any) => x.id === item.tour_id);
          const basePrice = (t as any)?.price_mxn || (t as any)?.suggested_price_mxn || 0;
          const ratio = sumBase > 0 ? basePrice / sumBase : 1 / promoItems.length;
          const totalForItem = Math.round((promo as any).total_mxn * ratio * 100) / 100;

          return {
            ...emptyResItem(),
            tour_id: item.tour_id,
            pax_adults: 1,
            pax_children: 0,
            total_mxn: totalForItem,
            package_name: item.package_name ?? "",
          };
        });

        setShared({ ...emptyShared, notes: `Promoción: ${(promo as any).name}` });
        setItems(newItems);
        setEditingId(null);
        setDialogOpen(true);
      } catch {
        // silently fail
      }
      setSearchParams({}, { replace: true });
    })();
  }, [searchParams, tours]);

  // ── Detect ?highlight= from quote acceptance ──
  useEffect(() => {
    const id = searchParams.get("highlight");
    if (!id || reservations.length === 0) return;
    setHighlightId(id);
    setSearchParams({}, { replace: true });
    setTimeout(() => {
      document.getElementById(`res-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    setTimeout(() => setHighlightId(null), 3000);
  }, [searchParams, reservations]);

  /* ── mutations ── */
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        // Edit mode: single update
        const pax = form.pax_adults + form.pax_children;
        const payload = {
          tour_id: form.tour_id || null,
          client_id: form.client_id || null,
          modality: form.modality,
          reservation_date: form.reservation_date,
          reservation_time: form.reservation_time,
          pax,
          pax_adults: form.pax_adults,
          pax_children: form.pax_children,
          zone: form.zone,
          nationality: form.nationality,
          total_mxn: Math.max(0, form.total_mxn - (form.discount_mxn || 0)),
          discount_mxn: form.discount_mxn || 0,
          notes: form.notes || null,
          status: form.status,
          hotel_name: form.hotel_name,
          pickup_notes: form.pickup_notes,
          pickup_point: form.pickup_point || null,
          tour_language: form.tour_language || null,
          tax_included: form.tax_included,
          pax_email: form.pax_email,
          operator_confirmation_code: form.operator_confirmation_code,
        } as any;
        const { error } = await supabase.from("reservations").update(payload).eq("id", editingId);
        if (error) throw error;

        // Auto-create payable and commission when status → confirmed
        if (form.status === "confirmed") {
          try {
            const existingRes = reservations.find((r: any) => r.id === editingId);

            // A) Operator payable
            const { data: existingPayable } = await (supabase as any)
              .from("operator_payables")
              .select("id")
              .eq("reservation_id", editingId)
              .maybeSingle();

            if (!existingPayable) {
              const tour = tours.find((t: any) => t.id === form.tour_id);
              const operatorId = (tour as any)?.operator_id;
              if (operatorId) {
                const operator = operators.find((o: any) => o.id === operatorId);
                const paymentRules: string = (operator as any)?.payment_rules ?? "prepago";
                const svcDate = new Date(form.reservation_date + "T12:00:00");
                let dueDate = new Date(svcDate);
                if (paymentRules === "15days" || paymentRules.includes("15")) {
                  dueDate.setDate(dueDate.getDate() + 15);
                } else if (paymentRules === "monthly" || paymentRules === "mensual") {
                  dueDate = new Date(svcDate.getFullYear(), svcDate.getMonth() + 1, 0);
                }
                const payableMonth = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`;
                await (supabase as any).from("operator_payables").insert({
                  reservation_id: editingId,
                  operator_id: operatorId,
                  service_date: form.reservation_date,
                  payment_rule_snapshot: paymentRules,
                  due_date: dueDate.toISOString().split("T")[0],
                  payable_month: payableMonth,
                  amount_mxn: 0,
                  amount_fx: 0,
                  currency_fx: "USD",
                  status: "pending",
                });
              }
            }

            // B) Seller commission
            const { data: existingComm } = await (supabase as any)
              .from("seller_commissions")
              .select("id")
              .eq("reservation_id", editingId)
              .maybeSingle();

            if (!existingComm && existingRes?.created_by) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("commission_rate")
                .eq("id", existingRes.created_by)
                .single();
              const commRate = profile?.commission_rate ?? 50;
              const saleTotal = Math.max(0, form.total_mxn - (form.discount_mxn || 0));
              const operatorCostMxn = 0;
              const cardFee = 0;
              const profit = saleTotal - operatorCostMxn - cardFee;
              const commAmount = Math.round(profit * (commRate / 100) * 100) / 100;
              const agencyAmount = Math.round((profit - commAmount) * 100) / 100;
              await (supabase as any).from("seller_commissions").insert({
                reservation_id: editingId,
                seller_id: existingRes.created_by,
                sale_total_mxn: saleTotal,
                operator_cost_mxn: operatorCostMxn,
                card_fee_mxn: cardFee,
                card_fee_percentage: 4,
                profit_mxn: profit,
                commission_percentage: commRate,
                commission_amount_mxn: commAmount,
                agency_amount_mxn: agencyAmount,
                status: "pending",
              });
            }
          } catch (e) {
            // Non-blocking: log but don't fail the save
            console.warn("Auto-create payable/commission failed:", e);
          }
        }
      } else {
        // Create mode: insert one row per tour item
        const itemsSubtotal = items.reduce((a, i) => a + i.total_mxn, 0);
        const discountPerItem = items.length > 0 ? (shared.discount_mxn || 0) / items.length : 0;
        const inserts = items.map((item) => ({
          tour_id: item.tour_id || null,
          client_id: shared.client_id || null,
          modality: item.modality,
          reservation_date: item.reservation_date,
          reservation_time: item.reservation_time,
          pax: item.pax_adults + item.pax_children,
          pax_adults: item.pax_adults,
          pax_children: item.pax_children,
          zone: shared.zone,
          nationality: shared.nationality,
          total_mxn: Math.max(0, item.total_mxn - discountPerItem),
          discount_mxn: items.length === 1 ? (shared.discount_mxn || 0) : Math.round(discountPerItem * 100) / 100,
          notes: shared.notes || null,
          created_by: user?.id,
          hotel_name: shared.hotel_name || "",
          pax_email: shared.pax_email || "",
          pickup_notes: shared.pickup_notes || "",
          pickup_point: shared.pickup_point || null,
          tour_language: shared.tour_language || null,
          tax_included: shared.tax_included,
          operator_confirmation_code: shared.operator_confirmation_code || "",
        } as any));
        const { error } = await supabase.from("reservations").insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      const count = editingId ? 1 : items.length;
      toast.success(editingId ? "Reserva actualizada" : `${count} reserva${count > 1 ? "s" : ""} creada${count > 1 ? "s" : ""}`);
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveClientMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ name: clientForm.name, phone: clientForm.phone, email: clientForm.email || null, created_by: user?.id })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      if (editingId) {
        setForm((prev) => ({ ...prev, client_id: data.id }));
      } else {
        setShared((prev) => ({ ...prev, client_id: data.id }));
      }
      toast.success("Cliente creado");
      setClientDialogOpen(false);
      setClientForm({ name: "", phone: "", email: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveFolioMutation = useMutation({
    mutationFn: async () => {
      if (!folioDialogRes) return;
      const update: any = {};
      if (folioInput.trim()) {
        update.operator_folio = folioInput.trim();
        update.confirmation_status = "confirmed";
        update.confirmed_at = new Date().toISOString();
      }
      if (cancFolioInput.trim()) {
        update.cancellation_folio = cancFolioInput.trim();
        update.status = "cancelled";
        update.confirmation_status = "cancelled";
      }
      if (Object.keys(update).length === 0) return;
      const { error } = await supabase.from("reservations").update(update).eq("id", folioDialogRes.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Folio guardado");
      setFolioDialogRes(null);
      setFolioInput("");
      setCancFolioInput("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("reservation_items").delete().eq("reservation_id", id);
      await supabase.from("sales").delete().eq("reservation_id", id);
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reservations"] }); toast.success("Reserva eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ── helpers ── */
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setShared(emptyShared);
    setItems([emptyResItem()]);
  };

  const openCreate = () => {
    setShared(emptyShared);
    setItems([emptyResItem()]);
    setEditingId(null);
    setDialogOpen(true);
  };

  const updateItem = (id: string, field: keyof ResItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "tour_id") updated.package_name = "";
        const recalcFields = ["tour_id", "pax_adults", "pax_children", "package_name"];
        if (recalcFields.includes(field as string) && updated.tour_id) {
          const result = computeTourPrice(
            updated.tour_id, shared.zone, shared.nationality,
            allVariants as any, tours as any,
            updated.package_name || undefined, allTourPackages
          );
          updated.total_mxn = computeTotal(result.adultPrice, result.childPrice, updated.pax_adults, updated.pax_children);
        }
        return updated;
      })
    );
  };

  const updateShared = (field: string, value: string) => {
    setShared((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "zone" || field === "nationality") {
        const newZone = field === "zone" ? value : prev.zone;
        const newNat = field === "nationality" ? value : prev.nationality;
        setItems((prevItems) =>
          prevItems.map((item) => {
            if (!item.tour_id) return item;
            const result = computeTourPrice(
              item.tour_id, newZone, newNat,
              allVariants as any, tours as any,
              item.package_name || undefined, allTourPackages
            );
            return { ...item, total_mxn: computeTotal(result.adultPrice, result.childPrice, item.pax_adults, item.pax_children) };
          })
        );
      }
      return next;
    });
  };

  const openEdit = (r: any) => {
    setForm({
      tour_id: r.tour_id ?? "",
      client_id: r.client_id ?? "",
      modality: r.modality,
      reservation_date: r.reservation_date,
      reservation_time: r.reservation_time,
      pax_adults: r.pax_adults ?? r.pax ?? 1,
      pax_children: r.pax_children ?? 0,
      zone: r.zone ?? "",
      nationality: r.nationality ?? "",
      total_mxn: r.total_mxn,
      discount_mxn: (r as any).discount_mxn ?? 0,
      notes: r.notes ?? "",
      status: r.status,
      hotel_name: r.hotel_name ?? "",
      pickup_notes: r.pickup_notes ?? "",
      pickup_point: (r as any).pickup_point ?? "",
      tour_language: (r as any).tour_language ?? "",
      tax_included: (r as any).tax_included ?? false,
      pax_email: r.pax_email ?? "",
      operator_confirmation_code: r.operator_confirmation_code ?? "",
    });
    setEditingId(r.id);
    setDialogOpen(true);
  };

  /* ── voucher / prepago helpers ── */
  const isPrepagoBlocked = (r: any): boolean => {
    if (!r.tours?.operator_id) return false;
    const op = operators.find((o: any) => o.id === r.tours.operator_id);
    if (!op || op.payment_rules !== "prepago") return false;
    const payable = payables.find((p: any) => p.reservation_id === r.id);
    return !payable || payable.status === "pending";
  };

  const enrichWithPrices = (r: any) => {
    if (!r.tour_id) return r;
    const tour = tours.find((t: any) => t.id === r.tour_id);
    const op = operators.find((o: any) => o.id === tour?.operator_id);

    const lookupPrice = (paxType: string): number => {
      const zone = r.zone;
      const nationality = r.nationality;
      const tourId = r.tour_id;

      if (zone && nationality) {
        const v = allVariants.find(
          (v: any) => v.tour_id === tourId && v.zone === zone && v.nationality === nationality && v.pax_type === paxType && !v.package_name
        );
        if (v?.sale_price) return v.sale_price;
      }

      if (!tour) return 0;
      const baseMxn = paxType === "Menor" ? (tour.suggested_price_mxn ?? 0) : (tour.price_mxn ?? 0);
      if (baseMxn > 0) return baseMxn;

      const baseUsd = paxType === "Menor" ? (tour.public_price_child_usd ?? 0) : (tour.public_price_adult_usd ?? 0);
      const tc = tour.exchange_rate_tour && tour.exchange_rate_tour > 0 ? tour.exchange_rate_tour : 1;
      if (baseUsd > 0) return Math.round(baseUsd * tc * 100) / 100;

      return 0;
    };

    return {
      ...r,
      unit_price_mxn: lookupPrice("Adulto"),
      unit_price_child_mxn: lookupPrice("Menor"),
      _tax_adult_usd: tour?.tax_adult_usd ?? 0,
      _tax_child_usd: tour?.tax_child_usd ?? 0,
      _mandatory_fees_usd: tour?.mandatory_fees_usd ?? 0,
      _exchange_rate: tour?.exchange_rate_tour ?? 1,
      operator_name: op?.name ?? null,
    };
  };

  const hasTourFees = (r: any) => {
    return (r._tax_adult_usd > 0 || r._tax_child_usd > 0);
  };

  const computeOnSiteFees = (r: any) => {
    if (!r) return null;
    const feeAdult = r._tax_adult_usd ?? 0;
    const feeChild = r._tax_child_usd ?? 0;
    if (feeAdult <= 0 && feeChild <= 0) return null;
    return { amountPerAdult: feeAdult, amountPerChild: feeChild, currency: "USD" };
  };

  const handleVoucherWithCheck = (r: any) => {
    if (isPrepagoBlocked(r)) {
      toast.warning("Recuerda: el pago al proveedor (prepago) está pendiente.");
    }
    // Auto-select taxIncluded based on operator's fee_collection_mode
    const tour = tours.find((t: any) => t.id === r.tour_id);
    const op = operators.find((o: any) => o.id === tour?.operator_id);
    const isOnSite = (op as any)?.fee_collection_mode === "on_site";
    setTaxIncluded(!isOnSite);
    setVoucherReservation(enrichWithPrices(r));
  };

  const handlePrint = (r: any) => {
    if (isPrepagoBlocked(r)) {
      toast.warning("Recuerda: el pago al proveedor (prepago) está pendiente.");
    }
    setVoucherReservation(enrichWithPrices(r));
    setTimeout(() => {
      const content = document.getElementById("voucher-content");
      if (!content) return;
      const w = window.open("", "_blank", "width=800,height=900");
      if (!w) return;

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(el => el.outerHTML)
        .join("\n");

      w.document.write(`<!DOCTYPE html><html><head><title>Voucher ${r.folio ?? ""}</title>
        ${styles}
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; margin: 0; background: white; }
          .print\\:hidden { display: none !important; }
          @media print {
            body { padding: 0; }
            .print\\:hidden { display: none !important; }
          }
        </style>
      </head>
      <body>${content.outerHTML}</body></html>`);
      w.document.close();
      setTimeout(() => {
        w.focus();
        w.print();
      }, 500);
      setVoucherReservation(null);
    }, 200);
  };

  const handleSendConfirmation = (r: any) => {
    if (isPrepagoBlocked(r)) {
      toast.warning("Recuerda: el pago al proveedor (prepago) está pendiente.");
    }
    setSendConfirmReservation(enrichWithPrices(r));
  };

  /* ── filter ── */
  const filtered = reservations.filter((r: any) => {
    if (dateFrom && new Date(r.reservation_date) < dateFrom) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(r.reservation_date) > end) return false;
    }
    if (filterStatus !== "all" && (r.confirmation_status || "scheduled") !== filterStatus) return false;
    if (filterPayment !== "all" && (r.payment_status || "unpaid") !== filterPayment) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const folio = (r.folio ?? "").toLowerCase();
    const clientName = (r.clients?.name ?? "").toLowerCase();
    return folio.includes(q) || clientName.includes(q);
  });

  const confirmationStatus = (r: any) => r.confirmation_status || "scheduled";
  const paymentStatus = (r: any) => r.payment_status || "unpaid";

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Reservas</h1>
          <p className="text-sm text-muted-foreground">Gestión de reservas, cobro y vouchers</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /><span className="hidden sm:inline">Nueva Reserva</span><span className="sm:hidden">Nueva</span></Button>
      </div>

      {/* table card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por folio o nombre..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
<SelectTrigger className="h-9 w-full sm:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos estados</SelectItem>
                <SelectItem value="scheduled">Programada</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
<SelectTrigger className="h-9 w-full sm:w-[150px]">
                <SelectValue placeholder="Pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos pagos</SelectItem>
                <SelectItem value="unpaid">Pendiente</SelectItem>
                <SelectItem value="deposit">Anticipo</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <TableSkeleton columns={8} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Calendar} title="No hay reservas aún" description="Crea tu primera reserva para empezar" action={{ label: "Nueva Reserva", onClick: openCreate }} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Folio</TableHead>
                  <TableHead className="hidden lg:table-cell">Folio Op.</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Pago</TableHead>
                  <TableHead className="text-right sticky right-0 bg-background">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  filtered.map((r: any) => {
                    const cStatus = confirmationStatus(r);
                    const pStatus = paymentStatus(r);
                    return (
                      <TableRow key={r.id} id={`res-row-${r.id}`} className={highlightId === r.id ? "bg-green-50 transition-colors" : ""}>
                        <TableCell className="hidden sm:table-cell font-mono text-xs font-bold">{r.folio ?? "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">{(r as any).operator_folio ?? "—"}</TableCell>
                        <TableCell className="text-sm font-medium truncate max-w-[150px]">{r.tours?.title ?? "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{r.clients?.name ?? "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{r.reservation_date} {r.reservation_time}</TableCell>
                        <TableCell>
                          <Badge className={`${statusStyles[cStatus] ?? statusStyles[r.status] ?? ""} border-0 text-xs`}>
                            {statusLabels[cStatus] ?? statusLabels[r.status] ?? r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={`${paymentStyles[pStatus] ?? ""} border-0 text-xs`}>
                            {paymentLabels[pStatus] ?? pStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-background">
                          {/* Desktop: botones individuales */}
                          <div className="hidden sm:flex justify-end gap-1">
                            {pStatus !== "paid" && cStatus !== "cancelled" && (
                              <Button variant="default" size="sm" className="h-7 text-xs" onClick={() => setCheckoutReservation(r)}>
                                <DollarSign className="mr-1 h-3 w-3" />Cobrar
                              </Button>
                            )}
                            {cStatus === "confirmed" && pStatus === "paid" && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleVoucherWithCheck(r)}>
                                <CheckCircle className="mr-1 h-3 w-3" />Ticket
                              </Button>
                            )}
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                            )}
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Folio operador" onClick={() => { setFolioDialogRes(r); setFolioInput((r as any).operator_folio ?? ""); setCancFolioInput((r as any).cancellation_folio ?? ""); }}><Tag className="h-3.5 w-3.5" /></Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleVoucherWithCheck(r)}><FileText className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePrint(r)}><Printer className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSendConfirmation(r)}><Send className="h-3.5 w-3.5" /></Button>
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (window.confirm("¿Eliminar esta reserva? Se borrarán también los cobros y ventas asociadas.")) deleteMutation.mutate(r.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            )}
                          </div>
                          {/* Mobile: menú desplegable */}
                          <div className="sm:hidden flex justify-end gap-1">
                            {pStatus !== "paid" && cStatus !== "cancelled" && (
                              <Button variant="default" size="sm" className="h-8 text-xs px-2" onClick={() => setCheckoutReservation(r)}>
                                <DollarSign className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isAdmin && <DropdownMenuItem onClick={() => openEdit(r)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>}
                                {isAdmin && <DropdownMenuItem onClick={() => { setFolioDialogRes(r); setFolioInput((r as any).operator_folio ?? ""); setCancFolioInput((r as any).cancellation_folio ?? ""); }}><Tag className="mr-2 h-4 w-4" />Folio Op.</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => handleVoucherWithCheck(r)}><FileText className="mr-2 h-4 w-4" />Ver Voucher</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint(r)}><Printer className="mr-2 h-4 w-4" />Imprimir</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendConfirmation(r)}><Send className="mr-2 h-4 w-4" />Enviar</DropdownMenuItem>
                                {cStatus === "confirmed" && pStatus === "paid" && (
                                  <DropdownMenuItem onClick={() => handleVoucherWithCheck(r)}><CheckCircle className="mr-2 h-4 w-4" />Ticket</DropdownMenuItem>
                                )}
                                {isAdmin && (
                                  <DropdownMenuItem className="text-destructive" onClick={() => { if (window.confirm("¿Eliminar esta reserva? Se borrarán también los cobros y ventas asociadas.")) deleteMutation.mutate(r.id); }}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
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
          )}
        </CardContent>
      </Card>

      {/* ── Checkout Dialog ── */}
      {checkoutReservation && (
        <ReservationCheckout
          reservation={checkoutReservation}
          open={!!checkoutReservation}
          onOpenChange={(open) => { if (!open) setCheckoutReservation(null); }}
          onSuccess={() => setCheckoutReservation(null)}
        />
      )}

      {/* ── Send Confirmation Dialog ── */}
      <SendConfirmationDialog
        open={!!sendConfirmReservation}
        onOpenChange={(open) => { if (!open) setSendConfirmReservation(null); }}
        reservation={sendConfirmReservation}
        onSiteFees={sendConfirmReservation ? computeOnSiteFees(sendConfirmReservation) : null}
      />

      {/* ── Dialog Crear / Editar Reserva ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[100dvh] sm:max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Reserva" : "Nueva Reserva"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos de la reserva." : "Completa los datos del cliente y agrega uno o varios tours."}
            </DialogDescription>
          </DialogHeader>

          {editingId ? (
            /* ── EDIT MODE: formulario de un solo tour (igual que antes) ── */
            <div className="grid gap-4 py-2">
              <div className="space-y-1.5">
                <Label>Tour *</Label>
                <Select value={form.tour_id} onValueChange={(v) => setForm((p) => ({ ...p, tour_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tour" /></SelectTrigger>
                  <SelectContent>
                    {tours.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <div className="flex gap-2">
                  <Select value={form.client_id} onValueChange={(v) => setForm((p) => ({ ...p, client_id: v }))}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="outline" onClick={() => setClientDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Zona de pickup</Label>
                  <Select value={form.zone} onValueChange={(v) => setForm((p) => ({ ...p, zone: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar zona" /></SelectTrigger>
                    <SelectContent>{ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nacionalidad</Label>
                  <Select value={form.nationality} onValueChange={(v) => setForm((p) => ({ ...p, nationality: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* New reservation fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hotel</Label>
                  <Input value={form.hotel_name} onChange={(e) => setForm((p) => ({ ...p, hotel_name: e.target.value }))} placeholder="Nombre del hotel" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email del pasajero</Label>
                  <Input type="email" value={form.pax_email} onChange={(e) => setForm((p) => ({ ...p, pax_email: e.target.value }))} placeholder="correo@ejemplo.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Punto de pickup *</Label>
                  <Input value={form.pickup_point} onChange={(e) => setForm((p) => ({ ...p, pickup_point: e.target.value }))} placeholder="Hotel lobby, muelle…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Notas de pickup</Label>
                  <Input value={form.pickup_notes} onChange={(e) => setForm((p) => ({ ...p, pickup_notes: e.target.value }))} placeholder="Señas adicionales…" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Idioma del tour *</Label>
                  <Input value={form.tour_language} onChange={(e) => setForm((p) => ({ ...p, tour_language: e.target.value }))} placeholder="Español, English…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Código confirmación operador</Label>
                  <Input value={form.operator_confirmation_code} onChange={(e) => setForm((p) => ({ ...p, operator_confirmation_code: e.target.value }))} placeholder="XC-78432" />
                </div>
              </div>
              <div className="flex items-center gap-3 py-1">
                <Switch
                  id="tax_included_edit"
                  checked={form.tax_included}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, tax_included: v }))}
                />
                <Label htmlFor="tax_included_edit" className="cursor-pointer">Impuestos incluidos en el total</Label>
              </div>

              <div className="space-y-1.5">
                <Label>Modalidad</Label>
                <Select value={form.modality} onValueChange={(v) => setForm((p) => ({ ...p, modality: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">Compartido</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fecha *</Label>
                  <Input type="date" value={form.reservation_date} onChange={(e) => setForm((p) => ({ ...p, reservation_date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora</Label>
                  <Input placeholder="6:00 AM" value={form.reservation_time} onChange={(e) => setForm((p) => ({ ...p, reservation_time: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label>Adultos</Label>
                  <Input type="number" min={0} value={form.pax_adults} onChange={(e) => setForm((p) => ({ ...p, pax_adults: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                   <Label>Menores</Label>
                   <Input type="number" min={0} value={form.pax_children} onChange={(e) => setForm((p) => ({ ...p, pax_children: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtotal MXN</Label>
                  <Input type="number" min={0} step="0.01" value={form.total_mxn} onChange={(e) => setForm((p) => ({ ...p, total_mxn: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <DiscountInput
                    subtotal={form.total_mxn}
                    discountMxn={form.discount_mxn || 0}
                    onChange={(v) => setForm((p) => ({ ...p, discount_mxn: v }))}
                  />
                </div>
              </div>
              {form.discount_mxn > 0 && (
                <p className="text-sm font-semibold text-right">Total: {fmt(Math.max(0, form.total_mxn - form.discount_mxn))}</p>
              )}

              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Notas</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notas opcionales…" />
              </div>
            </div>
          ) : (
            /* ── CREATE MODE: cliente compartido + múltiples tours ── */
            <div className="grid gap-4 py-2">
              {/* --- Datos compartidos --- */}
              <div className="rounded-lg bg-muted/40 p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos del grupo</p>

                <div className="space-y-1.5">
                  <Label>Cliente *</Label>
                  <div className="flex gap-2">
                    <Select value={shared.client_id} onValueChange={(v) => setShared((p) => ({ ...p, client_id: v }))}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" size="icon" variant="outline" onClick={() => setClientDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Zona de pickup</Label>
                    <Select value={shared.zone} onValueChange={(v) => updateShared("zone", v)}>
                      <SelectTrigger><SelectValue placeholder="Zona" /></SelectTrigger>
                      <SelectContent>{ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nacionalidad</Label>
                    <Select value={shared.nationality} onValueChange={(v) => updateShared("nationality", v)}>
                      <SelectTrigger><SelectValue placeholder="Nacionalidad" /></SelectTrigger>
                      <SelectContent>{NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Hotel</Label>
                    <Input value={shared.hotel_name} onChange={(e) => setShared((p) => ({ ...p, hotel_name: e.target.value }))} placeholder="Nombre del hotel" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email del pasajero</Label>
                    <Input type="email" value={shared.pax_email} onChange={(e) => setShared((p) => ({ ...p, pax_email: e.target.value }))} placeholder="correo@ejemplo.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Punto de pickup *</Label>
                    <Input value={shared.pickup_point} onChange={(e) => setShared((p) => ({ ...p, pickup_point: e.target.value }))} placeholder="Hotel lobby, muelle…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Idioma del tour *</Label>
                    <Input value={shared.tour_language} onChange={(e) => setShared((p) => ({ ...p, tour_language: e.target.value }))} placeholder="Español, English…" />
                  </div>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <Switch
                    id="tax_included_create"
                    checked={shared.tax_included}
                    onCheckedChange={(v) => setShared((p) => ({ ...p, tax_included: v }))}
                  />
                  <Label htmlFor="tax_included_create" className="cursor-pointer">Impuestos incluidos en el total</Label>
                </div>

                <div className="space-y-1.5">
                  <Label>Notas</Label>
                  <Textarea value={shared.notes} onChange={(e) => setShared((p) => ({ ...p, notes: e.target.value }))} placeholder="Notas opcionales…" rows={2} />
                </div>
                <div className="space-y-1.5">
                  <DiscountInput
                    subtotal={items.reduce((a, i) => a + i.total_mxn, 0)}
                    discountMxn={shared.discount_mxn || 0}
                    onChange={(v) => setShared((p) => ({ ...p, discount_mxn: v }))}
                    label="Descuento (global)"
                  />
                </div>
              </div>

              {/* --- Tours --- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tours</p>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setItems((p) => [...p, emptyResItem()])}>
                    <Plus className="mr-1 h-3.5 w-3.5" />Agregar Tour
                  </Button>
                </div>

                {items.map((item, idx) => (
                  <div key={item.id} className="rounded-lg border p-3 space-y-3">
                    {/* header del item */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Tour {idx + 1}</span>
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Selector de tour */}
                    <Select value={item.tour_id} onValueChange={(v) => updateItem(item.id, "tour_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar tour" /></SelectTrigger>
                      <SelectContent>
                        {tours.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {/* Paquete (si el tour tiene paquetes) */}
                    {(() => {
                      const pkgs = allTourPackages.filter((p) => p.tour_id === item.tour_id);
                      if (!pkgs.length) return null;
                      return (
                        <Select value={item.package_name} onValueChange={(v) => updateItem(item.id, "package_name", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar paquete" /></SelectTrigger>
                          <SelectContent>
                            {pkgs.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      );
                    })()}

                    {/* Modalidad */}
                    <div className="space-y-1">
                      <Label className="text-xs">Modalidad</Label>
                      <Select value={item.modality} onValueChange={(v) => updateItem(item.id, "modality", v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shared">Compartido</SelectItem>
                          <SelectItem value="private">Privado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fecha + Hora */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Fecha *</Label>
                        <Input type="date" value={item.reservation_date} onChange={(e) => updateItem(item.id, "reservation_date", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Hora</Label>
                        <Input placeholder="6:00 AM" value={item.reservation_time} onChange={(e) => updateItem(item.id, "reservation_time", e.target.value)} />
                      </div>
                    </div>

                    {/* Adultos + Niños + Total */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Adultos</Label>
                        <Input type="number" min={0} value={item.pax_adults} onChange={(e) => updateItem(item.id, "pax_adults", parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Menores</Label>
                        <Input type="number" min={0} value={item.pax_children} onChange={(e) => updateItem(item.id, "pax_children", parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Total MXN</Label>
                        <Input type="number" min={0} step="0.01" value={item.total_mxn} onChange={(e) => updateItem(item.id, "total_mxn", parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total general */}
                {items.length > 0 && (
                  <div className="space-y-1 pt-1 text-right">
                    {shared.discount_mxn > 0 && (
                      <p className="text-xs text-muted-foreground">Subtotal: {fmt(items.reduce((a, i) => a + i.total_mxn, 0))}</p>
                    )}
                    {shared.discount_mxn > 0 && (
                      <p className="text-xs text-muted-foreground">Descuento: -{fmt(shared.discount_mxn)}</p>
                    )}
                    <p className="text-sm font-semibold text-primary">
                      Total: {fmt(Math.max(0, items.reduce((a, i) => a + i.total_mxn, 0) - (shared.discount_mxn || 0)))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending ||
                (editingId
                  ? !form.tour_id || !form.client_id || !form.reservation_date || !form.reservation_time || !form.nationality || !form.pickup_point || !form.tour_language || form.pax_adults < 1
                  : !shared.client_id || !shared.nationality || !shared.pickup_point || !shared.tour_language || items.some((i) => !i.tour_id || !i.reservation_date || !i.reservation_time || i.pax_adults < 1))
              }
            >
              {saveMutation.isPending ? "Guardando…" : editingId ? "Actualizar" : items.length > 1 ? `Crear ${items.length} Reservas` : "Crear Reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Mini-dialog Nuevo Cliente ── */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>Crea un cliente rápido para asignar a esta reserva.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={clientForm.name} onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={clientForm.phone} onChange={(e) => setClientForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={clientForm.email} onChange={(e) => setClientForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveClientMutation.mutate()} disabled={saveClientMutation.isPending || !clientForm.name.trim()}>
              {saveClientMutation.isPending ? "Guardando…" : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Voucher Dialog ── */}
      <Dialog open={!!voucherReservation} onOpenChange={(open) => { if (!open) setVoucherReservation(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Voucher — {voucherReservation?.folio ?? ""}</DialogTitle>
            <DialogDescription>Previsualiza e imprime el voucher de la reserva.</DialogDescription>
          </DialogHeader>

          {/* Tax toggle — only show if tour has fees */}
          {voucherReservation && hasTourFees(voucherReservation) && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">¿Impuestos incluidos?</Label>
                <p className="text-xs text-muted-foreground">
                  {taxIncluded
                    ? "Los impuestos están incluidos en el total."
                    : "El cliente los paga al abordar en efectivo (USD)."}
                </p>
              </div>
              <Switch checked={taxIncluded} onCheckedChange={setTaxIncluded} />
            </div>
          )}

          {voucherReservation && (() => {
            const onSiteFees = !taxIncluded ? computeOnSiteFees(voucherReservation) : null;
            const displayReservation = !taxIncluded && onSiteFees
              ? {
                  ...voucherReservation,
                  total_mxn: Math.max(0,
                    voucherReservation.total_mxn
                    - (onSiteFees.amountPerAdult * voucherReservation.pax_adults * (voucherReservation._exchange_rate || 1))
                    - (onSiteFees.amountPerChild * voucherReservation.pax_children * (voucherReservation._exchange_rate || 1))
                  ),
                }
              : voucherReservation;
            return (
              <div ref={voucherRef}>
                <VoucherPrintView reservation={displayReservation} onSiteFees={onSiteFees ?? undefined} />
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoucherReservation(null)}>Cerrar</Button>
            <Button onClick={() => handlePrint(voucherReservation)}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden voucher for print */}
      {voucherReservation && (
        <div className="hidden">
          <div id="voucher-print-hidden">
            <VoucherPrintView reservation={voucherReservation} />
          </div>
        </div>
      )}

      {/* ── Mini-dialog Folio Operador ── */}
      <Dialog open={!!folioDialogRes} onOpenChange={(open) => { if (!open) { setFolioDialogRes(null); setFolioInput(""); setCancFolioInput(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Folio del Operador</DialogTitle>
            <DialogDescription>
              Captura el folio que te dio el operador para confirmar la reserva {folioDialogRes?.folio ?? ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Folio del operador</Label>
              <Input placeholder="Ej: XC-78432" value={folioInput} onChange={(e) => setFolioInput(e.target.value)} />
              <p className="text-xs text-muted-foreground">Al guardar, la reserva se marcará como confirmada.</p>
            </div>
            {(folioDialogRes?.status === "cancelled" || cancFolioInput) && (
              <div className="space-y-1.5">
                <Label>Folio de cancelación</Label>
                <Input placeholder="Ej: XC-CANC-123" value={cancFolioInput} onChange={(e) => setCancFolioInput(e.target.value)} />
                <p className="text-xs text-muted-foreground">Al guardar, la reserva se marcará como cancelada.</p>
              </div>
            )}
            {folioDialogRes?.status !== "cancelled" && !cancFolioInput && (
              <button
                type="button"
                className="text-xs text-destructive hover:underline text-left"
                onClick={() => setCancFolioInput("")}
              >
                + Agregar folio de cancelación
              </button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFolioDialogRes(null); setFolioInput(""); setCancFolioInput(""); }}>Cancelar</Button>
            <Button onClick={() => saveFolioMutation.mutate()} disabled={saveFolioMutation.isPending || (!folioInput.trim() && !cancFolioInput.trim())}>
              {saveFolioMutation.isPending ? "Guardando…" : "Guardar Folio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
