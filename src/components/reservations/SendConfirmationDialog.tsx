import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MessageSquare, Mail, QrCode, Copy } from "lucide-react";
import { toast } from "sonner";
import { buildWhatsAppMessage, openWhatsApp } from "./whatsapp-message";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";

interface OnSiteFees {
  amountPerAdult: number;
  amountPerChild: number;
  currency: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: any;
  onSiteFees?: OnSiteFees | null;
}

export default function SendConfirmationDialog({ open, onOpenChange, reservation, onSiteFees }: Props) {
  const [showQR, setShowQR] = useState(false);
  const r = reservation;
  if (!r) return null;

  const fmt = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  const message = buildWhatsAppMessage(r, "es", onSiteFees ?? undefined);
  const voucherUrl = `${window.location.origin}/cotizaciones/${r.id}/pdf`; // placeholder URL for voucher

  const handleWhatsApp = () => {
    openWhatsApp(r.clients?.phone, message);
    onOpenChange(false);
  };

  const handleEmail = () => {
    const email = r.clients?.email || "";
    const subject = encodeURIComponent(`Confirmación Reserva ${r.folio ?? ""} — WalkMe Tours`);
    const body = encodeURIComponent(message);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    onOpenChange(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message);
    toast.success("Mensaje copiado");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Confirmación</DialogTitle>
          <DialogDescription>{r.folio ?? "—"} — {fmt(r.total_mxn ?? 0)} MXN</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {r.clients && (
            <div className="text-sm bg-muted/50 rounded-md p-3 space-y-1">
              <p><span className="font-medium">Para:</span> {r.clients.name}{r.clients.phone ? ` · ${r.clients.phone}` : ""}</p>
            </div>
          )}

          {!showQR && (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Vista previa del mensaje</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2" onClick={copyMessage}>
                    <Copy className="h-3 w-3" /> Copiar
                  </Button>
                </div>
                <pre className="text-xs bg-green-50 border border-green-200 rounded-md p-3 whitespace-pre-wrap font-sans leading-relaxed max-h-52 overflow-y-auto">
                  {message}
                </pre>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" className="h-14 flex-col gap-1" onClick={handleWhatsApp}>
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button variant="outline" className="h-14 flex-col gap-1" onClick={handleEmail}>
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">Email</span>
                </Button>
                <Button variant="outline" className="h-14 flex-col gap-1" onClick={() => setShowQR(true)}>
                  <QrCode className="h-5 w-5 text-foreground" />
                  <span className="text-xs">Código QR</span>
                </Button>
              </div>
            </>
          )}

          {showQR && (
            <div className="space-y-3">
              <QRCodeDisplay url={voucherUrl} />
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowQR(false)}>
                ← Volver a opciones de envío
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
