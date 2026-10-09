import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Mail, Copy, Globe, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QuoteImageCard from "./QuoteImageCard";
import { downloadImage, shareImage } from "@/lib/generate-share-image";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
}

export default function SendQuoteDialog({ open, onOpenChange, quote }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "" });
  const [needsContact, setNeedsContact] = useState(false);
  const [view, setView] = useState<"coupon" | "message">("coupon");
  const [imageBusy, setImageBusy] = useState(false);
  const [linkedClient, setLinkedClient] = useState<any>(null);
  const [lang, setLang] = useState<"es" | "en">("es");

  // Fetch client if quote has client_id
  const { data: fetchedClient, isLoading: clientLoading, isError: clientError } = useQuery({
    queryKey: ["client-send", quote?.client_id],
    queryFn: async () => {
      if (!quote?.client_id) return null;
      const { data } = await supabase.from("clients").select("name, phone, email").eq("id", quote.client_id).single();
      return data;
    },
    enabled: !!quote?.client_id,
  });

  const client = linkedClient || fetchedClient;

  // Fetch items for message body
  const { data: items = [], isLoading: itemsLoading, isError: itemsError } = useQuery({
    queryKey: ["quote-items-send", quote?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("quote_items").select("*, tours(title, service_type, tax_adult_usd, tax_child_usd)").eq("quote_id", quote.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!quote?.id,
  });

  useEffect(() => {
    if (open) {
      setNeedsContact(!quote?.client_id);
      setContactForm({ name: "", phone: "", email: "" });
      setLang("es");
      setView("coupon");
      setLinkedClient(null);
    }
  }, [open, quote]);

  const createClientMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ name: contactForm.name, phone: contactForm.phone, email: contactForm.email || null, created_by: user?.id })
        .select("id, name, phone, email")
        .single();
      if (error) throw error;
      // Link to quote
      const { error: linkError } = await supabase.from("quotes").update({ client_id: data.id, client_name: contactForm.name }).eq("id", quote.id);
      if (linkError) throw linkError;
      return data;
    },
    onSuccess: (data) => {
      setLinkedClient(data);
      qc.invalidateQueries({ queryKey: ["quotes"] });
      setNeedsContact(false);
      toast.success("Cliente creado y vinculado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markSent = async () => {
    if (quote.status === "draft") {
      await supabase.from("quotes").update({ status: "sent" }).eq("id", quote.id);
      qc.invalidateQueries({ queryKey: ["quotes"] });
    }
  };

  const imageRef = useRef<HTMLDivElement>(null);
  const [editableMessage, setEditableMessage] = useState("");

  const imageUnavailable = imageBusy || itemsLoading || clientLoading || itemsError || clientError || items.length === 0;
  const handleDownloadImage = async () => {
    if (!imageRef.current || imageUnavailable) return;
    setImageBusy(true);
    try {
      await downloadImage(imageRef.current, `cotizacion-${quote?.folio ?? "walkme"}`);
      toast.success("Cupón descargado");
      await markSent();
    } catch {
      toast.error("No se pudo descargar el cupón. Intenta nuevamente.");
    } finally { setImageBusy(false); }
  };

  const handleShareImage = async () => {
    if (!imageRef.current || imageUnavailable) return;
    setImageBusy(true);
    try {
      await shareImage(imageRef.current, `cotizacion-${quote?.folio ?? "walkme"}`, `${lang === "en" ? "Quote" : "Cotización"} ${quote?.folio ?? ""} — WalkMe Tours`);
      await markSent();
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) toast.error("No se pudo compartir el cupón");
    } finally { setImageBusy(false); }
  };

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  const SEP = "━━━━━━━━━━━━━━━━━━━━";

  const fmtDateNice = (d: string, language: "es" | "en") => {
    if (!d) return "";
    const date = new Date(d + "T12:00:00");
    const str = language === "en"
      ? date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const buildMessage = () => {
    const clientName = client?.name || contactForm.name || (lang === "en" ? "Client" : "Cliente");
    if (lang === "en") {
      const lines = [
        SEP,
        `   🌴 *WALKME TOURS*`,
        `    Playa del Carmen`,
        SEP,
        ``,
        `Hi ${clientName}! 👋`,
        ``,
        `Here's your quote:`,
        `📋 *Folio:* ${quote?.folio ?? ""}`,
        ``,
      ];
      items.forEach((it: any) => {
        const sub = it.qty_adults * it.unit_price_mxn + it.qty_children * it.unit_price_child_mxn;
        const fecha = fmtDateNice(it.tour_date, "en");
        const pax = `${it.qty_adults} adult${it.qty_adults !== 1 ? "s" : ""}${it.qty_children ? `, ${it.qty_children} child${it.qty_children !== 1 ? "ren" : ""}` : ""}`;
        lines.push(`┌─────────────────────`);
        lines.push(`│ 🏝️ *${it.tours?.title ?? "Tour"}*`);
        if (fecha) lines.push(`│ 📅 ${fecha}`);
        lines.push(`│ 👥 ${pax}`);
        lines.push(`│ 💰 Subtotal: ${fmt(sub)} MXN`);
        lines.push(`└─────────────────────`);
        lines.push(``);
      });
      lines.push(`💰 *TOTAL: ${fmt(quote?.total_mxn ?? 0)} MXN*`);
      lines.push(``, SEP);
      lines.push(`📲 WhatsApp: +52 56 3974 8122`);
      lines.push(`📷 Instagram: @walkme_travel`);
      lines.push(``, `Feel free to reach out with any questions! 😊`);
      return lines.join("\n");
    }
    const lines = [
      SEP,
      `   🌴 *WALKME TOURS*`,
      `    Playa del Carmen`,
      SEP,
      ``,
      `Hola ${clientName}! 👋`,
      ``,
      `Te compartimos tu cotización:`,
      `📋 *Folio:* ${quote?.folio ?? ""}`,
      ``,
    ];
    items.forEach((it: any) => {
      const sub = it.qty_adults * it.unit_price_mxn + it.qty_children * it.unit_price_child_mxn;
      const fecha = fmtDateNice(it.tour_date, "es");
      const pax = `${it.qty_adults} adulto${it.qty_adults !== 1 ? "s" : ""}${it.qty_children ? `, ${it.qty_children} menor${it.qty_children !== 1 ? "es" : ""}` : ""}`;
      lines.push(`┌─────────────────────`);
      lines.push(`│ 🏝️ *${it.tours?.title ?? "Tour"}*`);
      if (fecha) lines.push(`│ 📅 ${fecha}`);
      lines.push(`│ 👥 ${pax}`);
      lines.push(`│ 💰 Subtotal: ${fmt(sub)} MXN`);
      lines.push(`└─────────────────────`);
      lines.push(``);
    });
    lines.push(`💰 *TOTAL: ${fmt(quote?.total_mxn ?? 0)} MXN*`);
    lines.push(``, SEP);
    lines.push(`📲 WhatsApp: +52 56 3974 8122`);
    lines.push(`📷 Instagram: @walkme_travel`);
    lines.push(``, `¡Cualquier duda con gusto te atendemos! 😊`);
    return lines.join("\n");
  };

  useEffect(() => {
    if (!needsContact) {
      setEditableMessage(buildMessage());
    }
  }, [lang, items, client, contactForm, needsContact]);

  const handleWhatsApp = async () => {
    const phone = client?.phone || contactForm.phone;
    const cleanPhone = phone?.replace(/\D/g, "") || "";
    const msg = encodeURIComponent(editableMessage);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
    await markSent();
    onOpenChange(false);
  };

  const handleEmail = async () => {
    const email = client?.email || contactForm.email;
    const subjectText = lang === "en"
      ? `Quote ${quote?.folio ?? ""} — WalkMe Tours`
      : `Cotización ${quote?.folio ?? ""} — WalkMe Tours`;
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(editableMessage);
    window.open(`mailto:${email || ""}?subject=${subject}&body=${body}`, "_blank");
    await markSent();
    onOpenChange(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(editableMessage);
    toast.success("Mensaje copiado");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Cotización</DialogTitle>
          <DialogDescription>{quote?.folio ?? ""} — {fmt(quote?.total_mxn ?? 0)} MXN</DialogDescription>
        </DialogHeader>

        {needsContact ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Esta cotización no tiene cliente. Agrega datos de contacto:</p>
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} placeholder="+52..." /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} /></div>
            <Button
              className="w-full"
              onClick={() => createClientMutation.mutate()}
              disabled={!contactForm.name.trim() || (!contactForm.phone.trim() && !contactForm.email.trim()) || createClientMutation.isPending}
            >
              {createClientMutation.isPending ? "Creando…" : "Crear Cliente y Continuar"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {client && (
              <div className="text-sm bg-muted/50 rounded-md p-3 space-y-1">
                <p><span className="font-medium">Para:</span> {client.name}{client.phone ? ` · ${client.phone}` : ""}</p>
              </div>
            )}

            {/* Language toggle */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div className="flex rounded-md border overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                   className={`h-9 rounded-none px-3 py-1 text-xs font-medium transition-colors ${lang === "es" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setLang("es")}
                >
                  🇲🇽 Español
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                   className={`h-9 rounded-none px-3 py-1 text-xs font-medium transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setLang("en")}
                >
                  🇺🇸 English
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant={view === "coupon" ? "default" : "outline"} onClick={() => setView("coupon")} aria-pressed={view === "coupon"}>Cupón</Button>
              <Button variant={view === "message" ? "default" : "outline"} onClick={() => setView("message")} aria-pressed={view === "message"}>Mensaje</Button>
            </div>
            {view === "coupon" && <div className="space-y-3">
              {itemsLoading || clientLoading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : itemsError || clientError ? <p role="alert" className="text-sm text-destructive">No se pudo cargar la cotización. Cierra y vuelve a intentar.</p> : items.length === 0 ? <p className="text-sm text-muted-foreground">Esta cotización no tiene tours.</p> : <QuoteImageCard ref={imageRef} quote={quote} client={client} items={items} lang={lang} />}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" disabled={imageUnavailable} onClick={handleDownloadImage}><Download /> Descargar</Button>
                <Button disabled={imageUnavailable} onClick={handleShareImage}>{imageBusy ? <Loader2 className="animate-spin" /> : <Share2 />} Compartir</Button>
              </div>
            </div>}
            {view === "message" && <>
                {/* Preview del mensaje */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Vista previa del mensaje</Label>
                    <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2" onClick={copyMessage}>
                      <Copy className="h-3 w-3" /> Copiar
                    </Button>
                  </div>
                  <textarea
                    aria-label="Mensaje de cotización"
                     className="text-xs bg-muted text-foreground border border-border rounded-md p-3 whitespace-pre-wrap font-sans leading-relaxed max-h-52 overflow-y-auto w-full resize-none min-h-[200px]"
                    value={editableMessage}
                    onChange={(e) => setEditableMessage(e.target.value)}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  💡 {lang === "en" ? "WhatsApp Web will open with this message ready to send." : "Se abrirá WhatsApp Web con este mensaje listo para enviar."}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-14 flex-col gap-1" onClick={handleWhatsApp}>
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  <Button variant="outline" className="h-14 flex-col gap-1" onClick={handleEmail}>
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-xs">Email</span>
                  </Button>
                </div>

            </>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
