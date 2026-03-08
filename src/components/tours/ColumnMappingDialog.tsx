import { useState, useMemo } from "react";
import { CheckCircle2, HelpCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { type ColumnMapping, fieldLabel, normKey, suggestFields } from "@/lib/sheet-import";

const IGNORE_VALUE = "__ignore__";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mappings: ColumnMapping[];
  aliasMap: Record<string, string[]>;
  onConfirm: (finalMappings: ColumnMapping[]) => void;
}

export default function ColumnMappingDialog({ open, onOpenChange, mappings: initialMappings, aliasMap, onConfirm }: Props) {
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings);

  // All available field keys
  const allFields = useMemo(() => Object.keys(aliasMap), [aliasMap]);

  // Currently assigned fields
  const assignedFields = useMemo(
    () => new Set(mappings.filter(m => m.fieldKey).map(m => m.fieldKey!)),
    [mappings]
  );

  const handleChange = (index: number, value: string) => {
    setMappings(prev => prev.map((m, i) => {
      if (i !== index) return m;
      const fieldKey = value === IGNORE_VALUE ? null : value;
      return {
        ...m,
        fieldKey,
        status: fieldKey ? "auto" : "unmapped",
      };
    }));
  };

  const handleConfirm = () => {
    onConfirm(mappings);
    onOpenChange(false);
  };

  const autoCount = mappings.filter(m => m.status === "auto").length;
  const suggestedCount = mappings.filter(m => m.status === "suggested").length;
  const unmappedCount = mappings.filter(m => m.status === "unmapped").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mapeo de Columnas</DialogTitle>
          <div className="flex gap-2 flex-wrap mt-2">
            <Badge variant="default" className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> {autoCount} auto
            </Badge>
            {suggestedCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <HelpCircle className="h-3 w-3" /> {suggestedCount} sugeridas
              </Badge>
            )}
            {unmappedCount > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <MinusCircle className="h-3 w-3" /> {unmappedCount} sin mapear
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-auto max-h-[55dvh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Columna del Sheet</TableHead>
                <TableHead>Campo asignado</TableHead>
                <TableHead className="w-24">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m, idx) => {
                const hn = normKey(m.header);
                const suggestions = suggestFields(hn, aliasMap, undefined);

                return (
                  <TableRow key={idx} className={m.status === "suggested" ? "bg-accent/30" : undefined}>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate" title={m.header}>
                      {m.header}
                    </TableCell>
                    <TableCell>
                      <Select value={m.fieldKey ?? IGNORE_VALUE} onValueChange={(v) => handleChange(idx, v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={IGNORE_VALUE}>— Ignorar —</SelectItem>
                          {/* Show top suggestions first */}
                          {suggestions.slice(0, 5).map(s => (
                            <SelectItem key={`sug-${s.fieldKey}`} value={s.fieldKey}>
                              {fieldLabel(s.fieldKey, aliasMap)}
                              {assignedFields.has(s.fieldKey) && s.fieldKey !== m.fieldKey ? " (ya asignado)" : ""}
                            </SelectItem>
                          ))}
                          {/* Then rest of fields not already in suggestions */}
                          {allFields
                            .filter(f => !suggestions.slice(0, 5).some(s => s.fieldKey === f))
                            .map(f => (
                              <SelectItem key={f} value={f}>
                                {fieldLabel(f, aliasMap)}
                                {assignedFields.has(f) && f !== m.fieldKey ? " (ya asignado)" : ""}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {m.status === "auto" && m.fieldKey && (
                        <Badge variant="default" className="text-[10px]">Auto</Badge>
                      )}
                      {m.status === "suggested" && m.fieldKey && (
                        <Badge variant="secondary" className="text-[10px]">Sugerido</Badge>
                      )}
                      {(!m.fieldKey || m.status === "unmapped") && (
                        <Badge variant="outline" className="text-[10px]">Ignorar</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm}>Importar con este mapeo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}