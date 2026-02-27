import { Plus, Trash2, Grid3X3, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface VariantForm {
  id?: string;
  operator_id: string;
  zone: string;
  pax_type: string; // "Adulto" | "Niño"
  nationality: string; // "Mexicano" | "Extranjero"
  sale_price: string;
  net_cost: string;
  tax_fee: string;
}

export const emptyVariant: VariantForm = {
  operator_id: "",
  zone: "Cancun",
  pax_type: "Adulto",
  nationality: "Extranjero",
  sale_price: "",
  net_cost: "",
  tax_fee: "",
};

const ZONES = ["Cancun", "Playa", "Tulum", "Riviera Maya"];
const PAX_TYPES = ["Adulto", "Niño"];
const NATIONALITIES = ["Mexicano", "Extranjero"];

interface Operator {
  id: string;
  name: string;
}

interface Props {
  variants: VariantForm[];
  onChange: (variants: VariantForm[]) => void;
  operators: Operator[];
  isAdmin: boolean;
}

export default function PriceVariantEditor({ variants, onChange, operators, isAdmin }: Props) {
  const add = () => {
    onChange([...variants, { ...emptyVariant }]);
  };

  const update = (index: number, field: keyof VariantForm, value: string) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const generateAll = () => {
    if (operators.length === 0) return;
    const opId = operators[0].id;
    const combos: VariantForm[] = [];
    for (const pax of PAX_TYPES) {
      for (const zone of ZONES) {
        for (const nat of NATIONALITIES) {
          combos.push({
            operator_id: opId,
            zone,
            pax_type: pax,
            nationality: nat,
            sale_price: "",
            net_cost: "",
            tax_fee: "",
          });
        }
      }
    }
    onChange([...variants, ...combos]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Grid3X3 className="h-4 w-4" /> Matriz de Precios v2
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={generateAll} disabled={operators.length === 0}>
            <Wand2 className="mr-1 h-3 w-3" /> Generar Combinaciones
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="mr-1 h-3 w-3" /> Agregar
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Cada fila = 1 precio para una combinación de zona + nacionalidad + tipo de pasajero.
      </p>

      {variants.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
          Sin variantes de precio. Usa "Generar Combinaciones" para crear 16 filas automáticamente.
        </p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Operador</TableHead>
                <TableHead className="text-xs">Zona</TableHead>
                <TableHead className="text-xs">Tipo Pax</TableHead>
                <TableHead className="text-xs">Nacionalidad</TableHead>
                <TableHead className="text-xs">Precio Venta</TableHead>
                {isAdmin && <TableHead className="text-xs">Costo Neto</TableHead>}
                <TableHead className="text-xs">Tax/Fee</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="py-1.5">
                    <Select value={v.operator_id} onValueChange={(val) => update(i, "operator_id", val)}>
                      <SelectTrigger className="h-8 text-xs w-32">
                        <SelectValue placeholder="Operador" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Select value={v.zone} onValueChange={(val) => update(i, "zone", val)}>
                      <SelectTrigger className="h-8 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONES.map((z) => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Select value={v.pax_type} onValueChange={(val) => update(i, "pax_type", val)}>
                      <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAX_TYPES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Select value={v.nationality} onValueChange={(val) => update(i, "nationality", val)}>
                      <SelectTrigger className="h-8 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NATIONALITIES.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Input
                      type="number"
                      className="h-8 text-xs w-24"
                      value={v.sale_price}
                      onChange={(e) => update(i, "sale_price", e.target.value)}
                      placeholder="0"
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="py-1.5">
                      <Input
                        type="number"
                        className="h-8 text-xs w-24"
                        value={v.net_cost}
                        onChange={(e) => update(i, "net_cost", e.target.value)}
                        placeholder="0"
                      />
                    </TableCell>
                  )}
                  <TableCell className="py-1.5">
                    <Input
                      type="number"
                      className="h-8 text-xs w-24"
                      value={v.tax_fee}
                      onChange={(e) => update(i, "tax_fee", e.target.value)}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
