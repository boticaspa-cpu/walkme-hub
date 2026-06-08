import * as React from "react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subDays, addMonths, isSameDay, isSameMonth, isSameYear } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type PeriodPreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_7"
  | "last_30"
  | "this_year"
  | "custom_month"
  | "custom";

export type Period = {
  from: Date;
  to: Date;
  preset: PeriodPreset;
  label: string;
};

const PRESET_LABELS: Record<PeriodPreset, string> = {
  today: "Hoy",
  this_week: "Esta semana",
  this_month: "Este mes",
  last_month: "Mes anterior",
  last_7: "Últimos 7 días",
  last_30: "Últimos 30 días",
  this_year: "Este año",
  custom_month: "Mes",
  custom: "Personalizado",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatRangeLabel(from: Date, to: Date): string {
  if (isSameDay(from, to)) {
    return capitalize(format(from, "d 'de' MMMM 'de' yyyy", { locale: es }));
  }
  if (isSameMonth(from, to) && isSameYear(from, to)) {
    return `Del ${format(from, "d", { locale: es })} al ${format(to, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
  }
  if (isSameYear(from, to)) {
    return `Del ${format(from, "d 'de' MMMM", { locale: es })} al ${format(to, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
  }
  return `Del ${format(from, "d 'de' MMM yyyy", { locale: es })} al ${format(to, "d 'de' MMM yyyy", { locale: es })}`;
}

export function buildPeriod(preset: PeriodPreset, ref: Date = new Date(), customFrom?: Date, customTo?: Date): Period {
  const now = ref;
  let from: Date;
  let to: Date;
  let label: string;

  switch (preset) {
    case "today":
      from = startOfDay(now);
      to = endOfDay(now);
      label = capitalize(format(now, "EEEE d 'de' MMMM", { locale: es }));
      break;
    case "this_week": {
      from = startOfDay(startOfWeek(now, { weekStartsOn: 1 }));
      to = endOfDay(endOfWeek(now, { weekStartsOn: 1 }));
      label = `Semana del ${format(from, "d MMM", { locale: es })} al ${format(to, "d MMM", { locale: es })}`;
      break;
    }
    case "this_month":
      from = startOfDay(startOfMonth(now));
      to = endOfDay(endOfMonth(now));
      label = capitalize(format(now, "MMMM yyyy", { locale: es }));
      break;
    case "last_month": {
      const lm = subMonths(now, 1);
      from = startOfDay(startOfMonth(lm));
      to = endOfDay(endOfMonth(lm));
      label = capitalize(format(lm, "MMMM yyyy", { locale: es }));
      break;
    }
    case "last_7":
      from = startOfDay(subDays(now, 6));
      to = endOfDay(now);
      label = "Últimos 7 días";
      break;
    case "last_30":
      from = startOfDay(subDays(now, 29));
      to = endOfDay(now);
      label = "Últimos 30 días";
      break;
    case "this_year":
      from = startOfDay(startOfYear(now));
      to = endOfDay(endOfYear(now));
      label = format(now, "yyyy");
      break;
    case "custom_month":
      from = startOfDay(startOfMonth(ref));
      to = endOfDay(endOfMonth(ref));
      label = capitalize(format(ref, "MMMM yyyy", { locale: es }));
      break;
    case "custom":
    default: {
      const f = customFrom ?? startOfMonth(now);
      const t = customTo ?? endOfMonth(now);
      from = startOfDay(f);
      to = endOfDay(t);
      label = formatRangeLabel(from, to);
      break;
    }
  }
  return { from, to, preset, label };
}

interface PeriodFilterProps {
  value: Period;
  onChange: (p: Period) => void;
  className?: string;
  align?: "start" | "center" | "end";
}

export function PeriodFilter({ value, onChange, className, align = "end" }: PeriodFilterProps) {
  const [calOpen, setCalOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>({ from: value.from, to: value.to });

  React.useEffect(() => {
    setRange({ from: value.from, to: value.to });
  }, [value.from, value.to]);

  const isMonthly = value.preset === "this_month" || value.preset === "last_month" || value.preset === "custom_month";

  const goMonth = (delta: number) => {
    const ref = addMonths(value.from, delta);
    onChange(buildPeriod("custom_month", ref));
  };

  const applyPreset = (preset: PeriodPreset) => {
    if (preset === "custom") {
      setCalOpen(true);
      return;
    }
    onChange(buildPeriod(preset));
  };

  const applyCustomRange = () => {
    if (range?.from) {
      onChange(buildPeriod("custom", new Date(), range.from, range.to ?? range.from));
      setCalOpen(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {isMonthly && (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => goMonth(-1)}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <Popover open={calOpen} onOpenChange={setCalOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 font-medium min-w-0">
            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{value.label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            locale={es}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
          <div className="flex items-center justify-between gap-2 border-t p-2">
            <Button variant="ghost" size="sm" onClick={() => setCalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={applyCustomRange} disabled={!range?.from}>
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {isMonthly && (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => goMonth(1)}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            Rango
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-48">
          <DropdownMenuItem onClick={() => applyPreset("today")}>{PRESET_LABELS.today}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => applyPreset("this_week")}>{PRESET_LABELS.this_week}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => applyPreset("this_month")}>{PRESET_LABELS.this_month}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => applyPreset("last_month")}>{PRESET_LABELS.last_month}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => applyPreset("last_7")}>{PRESET_LABELS.last_7}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => applyPreset("last_30")}>{PRESET_LABELS.last_30}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => applyPreset("this_year")}>{PRESET_LABELS.this_year}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => applyPreset("custom")}>{PRESET_LABELS.custom}…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default PeriodFilter;
