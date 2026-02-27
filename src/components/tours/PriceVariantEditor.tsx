import { Plus, Trash2, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackageForm } from "./PackageEditor";

export interface VariantForm {
  id?: string;
  tour_package_id: string; // "" means null (no package)
  is_mexican: boolean;
  zone: string;
  price_adult_mxn: string;
  price_child_mxn: string;
}

export const emptyVariant: VariantForm = {
  tour_package_id: "",
  is_mexican: false,
  zone: "Cancun",
  price_adult_mxn: "",
  price_child_mxn: "",
};

const ZONES = ["Cancun", "Playa", "Riviera", "Tulum"];

interface Props {
  variants: VariantForm[];
  onChange: (variants: VariantForm[]) => void;
  packages: PackageForm[];
  childAgeMin: number;
  childAgeMax: number;
}

export default function PriceVariantEditor({ variants, onChange, packages, childAgeMin, childAgeMax }: Props) {
  const hasPackages = packages.length > 0;

  const add = () => {
    onChange([...variants, { ...emptyVariant }]);
  };

  const update = (index: number, field: keyof VariantForm, value: string | boolean) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const fmt = (n: string) => {
    const v = parseFloat(n) || 0;
    return `$${v.toLocaleString("es-MX")}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Grid3X3 className="h-4 w-4" /> Matriz de Precios (Lookup)
        </p>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-1 h-3 w-3" /> Agregar Variante
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Niño: {childAgeMin}–{childAgeMax} años. Precio directo sin fórmulas.
      </p>

      {variants.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
          Sin variantes de precio. El tour usará precios calculados.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {hasPackages && <TableHead className="text-xs">Paquete</TableHead>}
                <TableHead className="text-xs">Zona</TableHead>
                <TableHead className="text-xs w-20">Nacional</TableHead>
                <TableHead className="text-xs">Adulto MXN</TableHead>
                <TableHead className="text-xs">Niño MXN</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v, i) => (
                <TableRow key={i}>
                  {hasPackages && (
                    <TableCell className="py-1.5">
                      <Select value={v.tour_package_id} onValueChange={(val) => update(i, "tour_package_id", val)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Sin paquete" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin paquete</SelectItem>
                          {packages.map((pkg, pi) => (
                            <SelectItem key={pkg.id || `pkg-${pi}`} value={pkg.id || `pkg-${pi}`}>
                              {pkg.name || `Paquete ${pi + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                  <TableCell className="py-1.5">
                    <Select value={v.zone} onValueChange={(val) => update(i, "zone", val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONES.map((z) => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-1.5 text-center">
                    <Checkbox
                      checked={v.is_mexican}
                      onCheckedChange={(checked) => update(i, "is_mexican", !!checked)}
                    />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={v.price_adult_mxn}
                      onChange={(e) => update(i, "price_adult_mxn", e.target.value)}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={v.price_child_mxn}
                      onChange={(e) => update(i, "price_child_mxn", e.target.value)}
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
