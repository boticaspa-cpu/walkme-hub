import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tabRequested: string;
  headers: string[];
  sampleRows: Record<string, string>[];
  matchedCount: number;
  totalFields: number;
  matchedFields: string[];
  onConfirm: () => void;
}

export default function SheetPreviewDialog({
  open, onOpenChange, tabRequested, headers, sampleRows,
  matchedCount, totalFields, matchedFields, onConfirm,
}: Props) {
  const isHtml = headers.length === 0 && sampleRows.length === 0;
  const noMatches = matchedCount === 0 && !isHtml;
  const lowMatches = matchedCount > 0 && matchedCount <= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview de datos del Sheet</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Pestaña solicitada: <span className="font-mono font-semibold">{tabRequested}</span>
          </p>
        </DialogHeader>

        {/* Validation alerts */}
        {isHtml && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Sheet no accesible</AlertTitle>
            <AlertDescription>
              El contenido devuelto parece HTML. Verifica que el Sheet sea público y que la pestaña exista.
            </AlertDescription>
          </Alert>
        )}

        {noMatches && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ninguna columna reconocida</AlertTitle>
            <AlertDescription>
              No se encontró ningún encabezado que coincida con los campos esperados.
              Es posible que Google haya devuelto una pestaña diferente a "{tabRequested}".
              Verifica que el nombre de la pestaña sea exacto (mayúsculas, espacios, acentos).
            </AlertDescription>
          </Alert>
        )}

        {lowMatches && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Pocas columnas reconocidas</AlertTitle>
            <AlertDescription>
              Solo se reconocieron {matchedCount} de {totalFields} campos.
              Verifica que la pestaña "{tabRequested}" sea la correcta.
            </AlertDescription>
          </Alert>
        )}

        {matchedCount > 2 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Columnas reconocidas: {matchedCount} de {totalFields}</AlertTitle>
            <AlertDescription>
              Campos detectados: {matchedFields.join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {/* Headers detected */}
        {headers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {headers.length} columnas detectadas:
            </p>
            <div className="flex flex-wrap gap-1">
              {headers.map((h, i) => (
                <Badge key={i} variant="outline" className="text-[10px] font-mono">
                  {h}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sample data table */}
        {sampleRows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Primeras {sampleRows.length} filas de datos:
            </p>
            <div className="overflow-auto max-h-[30dvh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-8">#</TableHead>
                    {headers.map((h, i) => (
                      <TableHead key={i} className="text-[10px] font-mono whitespace-nowrap">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleRows.map((row, ri) => (
                    <TableRow key={ri}>
                      <TableCell className="text-[10px] text-muted-foreground">{ri + 1}</TableCell>
                      {headers.map((h, ci) => (
                        <TableCell key={ci} className="text-[10px] max-w-[150px] truncate" title={row[h]}>
                          {row[h] || <span className="text-muted-foreground/50">—</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={onConfirm}
            disabled={isHtml}
          >
            {noMatches ? "Continuar de todos modos" : "Continuar con mapeo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
