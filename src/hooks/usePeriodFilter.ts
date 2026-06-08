import { useMemo, useState } from "react";
import { buildPeriod, type Period, type PeriodPreset } from "@/components/shared/PeriodFilter";

export function usePeriodFilter(defaultPreset: PeriodPreset = "this_month") {
  const [period, setPeriod] = useState<Period>(() => buildPeriod(defaultPreset));

  const iso = useMemo(
    () => ({
      fromISO: period.from.toISOString(),
      toISO: period.to.toISOString(),
      fromDate: period.from.toISOString().slice(0, 10),
      toDate: period.to.toISOString().slice(0, 10),
    }),
    [period.from, period.to],
  );

  return { period, setPeriod, ...iso };
}

export type { Period, PeriodPreset } from "@/components/shared/PeriodFilter";
