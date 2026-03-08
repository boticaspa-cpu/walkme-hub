import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Percent, DollarSign } from "lucide-react";

interface DiscountInputProps {
  subtotal: number;
  discountMxn: number;
  onChange: (discountMxn: number) => void;
  label?: string;
}

export default function DiscountInput({ subtotal, discountMxn, onChange, label = "Descuento" }: DiscountInputProps) {
  const [mode, setMode] = useState<"amount" | "percent">("amount");
  const [inputValue, setInputValue] = useState("");

  // Sync input when discountMxn changes externally (e.g. form reset)
  useEffect(() => {
    if (discountMxn === 0) {
      setInputValue("");
      return;
    }
    if (mode === "amount") {
      setInputValue(String(discountMxn));
    } else {
      const pct = subtotal > 0 ? ((discountMxn / subtotal) * 100) : 0;
      setInputValue(String(Math.round(pct * 100) / 100));
    }
  }, [discountMxn === 0]); // only reset when zeroed out

  const handleModeChange = (newMode: string) => {
    if (!newMode) return;
    const m = newMode as "amount" | "percent";
    setMode(m);
    // Convert current value to new mode display
    if (m === "percent" && subtotal > 0) {
      const pct = (discountMxn / subtotal) * 100;
      setInputValue(String(Math.round(pct * 100) / 100));
    } else {
      setInputValue(discountMxn > 0 ? String(discountMxn) : "");
    }
  };

  const handleChange = (raw: string) => {
    setInputValue(raw);
    const val = parseFloat(raw) || 0;
    if (mode === "percent") {
      const amt = Math.round(subtotal * (val / 100) * 100) / 100;
      onChange(Math.min(amt, subtotal));
    } else {
      onChange(Math.min(val, subtotal));
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <ToggleGroup type="single" value={mode} onValueChange={handleModeChange} className="shrink-0">
          <ToggleGroupItem value="amount" aria-label="Monto fijo" className="h-8 w-8 p-0">
            <DollarSign className="h-3.5 w-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="percent" aria-label="Porcentaje" className="h-8 w-8 p-0">
            <Percent className="h-3.5 w-3.5" />
          </ToggleGroupItem>
        </ToggleGroup>
        <Input
          type="number"
          min={0}
          max={mode === "percent" ? 100 : subtotal}
          step={mode === "percent" ? 1 : 0.01}
          className="h-8 text-right flex-1"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={mode === "percent" ? "0 %" : "0.00"}
        />
      </div>
      {discountMxn > 0 && mode === "percent" && (
        <p className="text-xs text-muted-foreground text-right">
          = ${discountMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
        </p>
      )}
    </div>
  );
}
