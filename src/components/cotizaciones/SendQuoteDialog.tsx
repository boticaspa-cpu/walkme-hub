import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Mail, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";

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

  // Fetch client if quote has client_id
  const { data: client } = useQuery({
    queryKey: ["client-send", quote?.client_id],
    queryFn: async () => {
      if (!quote?.client_id) return null;
      const { data } = await supabase.from("clients").select("name, phone, email").eq("id", quote.client_id).single();
      return data;
    },
    enabled: !!quote?.client_id,
  });

  // Fetch items for message body
  const { data: items = [] } = useQuery({
    queryKey: ["quote-items-send", quote?.id],
    queryFn: async () => {
      const { data } = await supabase.from("quote_items").select("*, tours(title)").eq("quote_id", quote.id);
      return data ?? [];
    },
    enabled: !!quote?.id,
  });

  useEffect(() => {
    if (open) {
      setNeedsContact(!quote?.client_id);
      setContactForm({ name: "", phone: "", email: "" });
    }
  }, [open, quote]);

  const createClientMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ name: contactForm.name, phone: contactForm.phone, email: contactForm.email || null, created_by: user?.id })
        .select("id")
        .single();
      if (error) throw error;
      // Link to quote
      await supabase.from("quotes").update({ client_id: data.id, client_name: contactForm.name }).eq("id", quote.id);
      return data;
    },
    onSuccess: () => {
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

  const pdfUrl = `${window.location.origin}/cotizaciones/${quote?.id}/pdf`;
  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  const fmtDate = (d: string) =>
    d ? new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : "";

  const buildMessage = () => {
    const clientName = client?.name || contactForm.name || "Cliente";
    const lines = [
      `Hola ${clientName}! 👋`,
      ``,
      `Te comparto tu cotización de *WalkMe Tours* (${quote?.folio ?? ""}):`,
      ``,
    ];
    items.forEach((it: any) => {
      const sub = it.qty_adults * it.unit_price_mxn + it.qty_children * it.unit_price_child_mxn;
      const fecha = fmtDate(it.tour_date);
      const pax = `${it.qty_adults} adulto${it.qty_adults !== 1 ? "s" : ""}${it.qty_children ? `, ${it.qty_children} menor${it.qty_children !== 1 ? "es" : ""}` : ""}`;
      lines.push(`🏝️ *${it.tours?.title ?? "Tour"}*${fecha ? ` — ${fecha}` : ""}`);
      lines.push(`   ${pax} — ${fmt(sub)} MXN`);
    });
    lines.push(``, `💰 *Total: ${fmt(quote?.total_mxn ?? 0)} MXN*`);
    lines.push(``, `📄 Cotización completa: ${pdfUrl}`);
    lines.push(``, `¡Cualquier duda con gusto te atiendo! 😊`);
    return lines.join("\n");
  };

  const handleWhatsApp = async () => {
    const phone = client?.phone || contactForm.phone;
    const cleanPhone = phone?.replace(/\D/g, "") || "";
    const msg = encodeURIComponent(buildMessage());
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
    await markSent();
    onOpenChange(false);
  };

  const handleEmail = async () => {
    const email = client?.email || contactForm.email;
    const subject = encodeURIComponent(`Cotización ${quote?.folio ?? ""} — WalkMe Tours`);
    const body = encodeURIComponent(buildMessage());
    window.open(`mailto:${email || ""}?subject=${subject}&body=${body}`, "_blank");
    await markSent();
    onOpenChange(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(buildMessage());
    toast.success("Mensaje copiado");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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

            {/* Preview del mensaje */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Vista previa del mensaje</Label>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2" onClick={copyMessage}>
                  <Copy className="h-3 w-3" /> Copiar
                </Button>
              </div>
              <pre className="text-xs bg-green-50 border border-green-200 rounded-md p-3 whitespace-pre-wrap font-sans leading-relaxed max-h-52 overflow-y-auto">
                {buildMessage()}
              </pre>
            </div>

            <p className="text-xs text-muted-foreground">
              💡 Se abrirá WhatsApp Web con este mensaje listo para enviar. Asegúrate de tener el WhatsApp de la agencia conectado en el navegador.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 flex-col gap-1" onClick={handleWhatsApp}>
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span className="text-xs">Enviar por WhatsApp</span>
              </Button>
              <Button variant="outline" className="h-14 flex-col gap-1" onClick={handleEmail}>
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Enviar por Email</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
