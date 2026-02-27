import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend }: KpiCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <span className="text-2xl font-bold tracking-tight font-display">{value}</span>
          {subtitle && (
            <span className="text-xs text-muted-foreground mt-0.5">{subtitle}</span>
          )}
          {trend && (
            <span
              className={`text-xs mt-1 font-medium ${
                trend.value >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
