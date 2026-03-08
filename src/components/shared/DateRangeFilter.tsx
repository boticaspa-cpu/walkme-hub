import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangeFilterProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (d: Date | undefined) => void;
  onDateToChange: (d: Date | undefined) => void;
}

export default function DateRangeFilter({ dateFrom, dateTo, onDateFromChange, onDateToChange }: DateRangeFilterProps) {
  const hasFilter = dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Desde */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-9 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: es }) : "Desde"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={onDateFromChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {/* Hasta */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-9 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            {dateTo ? format(dateTo, "dd MMM yyyy", { locale: es }) : "Hasta"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={onDateToChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-muted-foreground"
          onClick={() => { onDateFromChange(undefined); onDateToChange(undefined); }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
