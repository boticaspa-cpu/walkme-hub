import { useState } from "react";
import { Table2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab?: string;
  loading?: boolean;
  onImport: (sheetId: string, tabName: string) => Promise<void>;
}

function extractSheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export default function SheetImportDialog({ open, onOpenChange, defaultTab = "", loading = false, onImport }: Props) {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState(defaultTab);

  // Sync defaultTab when dialog opens
  const handleOpen = (v: boolean) => {
    if (v) setTab(defaultTab);
    if (!v) { setUrl(""); }
    onOpenChange(v);
  };

  const handleImport = async () => {
    const sheetId = extractSheetId(url.trim());
    if (!sheetId) {
      return;
    }
    await onImport(sheetId, tab.trim());
    setUrl("");
    onOpenChange(false);
  };

  const sheetIdOk = !!extractSheetId(url.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table2 className="h-4 w-4" /> Importar desde Google Sheet
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-sm">Link del Google Sheet</Label>
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              El Sheet debe ser público ("Cualquier persona con el link puede ver").
            </p>
            {url && !sheetIdOk && (
              <p className="text-[11px] text-destructive">Link no válido — verifica que sea un link de Google Sheets.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Nombre de la pestaña</Label>
            <Input
              placeholder="Ej: Paquetes"
              value={tab}
              onChange={(e) => setTab(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Debe coincidir exactamente con el nombre de la hoja en el Sheet.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={loading || !sheetIdOk || !tab.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Table2 className="mr-2 h-4 w-4" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
