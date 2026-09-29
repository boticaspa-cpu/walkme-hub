/**
 * Pure helpers shared by the client voucher and the operator request.
 * A "line" is one tour of a booking; a booking with several tours is stored as
 * one reservation row per tour, so the views work on lines instead of rows.
 */

export type VoucherLang = "es" | "en";

export interface VoucherLine {
  id: string;
  reservationId: string;
  tourId: string | null;
  folio: string | null;
  title: string;
  packageName: string | null;
  includes: string[];
  date: string; // yyyy-mm-dd, empty when the date is still pending
  time: string;
  adults: number;
  children: number;
  infants: number;
  childAges: number[];
  infantAges: number[];
  unitAdult: number;
  unitChild: number;
  unitInfant: number;
  amount: number; // regular amount before any discount
  discount: number;
  operatorId: string | null;
  operatorName: string | null;
}

export interface VoucherGroup {
  lines: VoucherLine[];
  folios: string[];
  deposit: number;
  balance: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Ages of 0 are the form default ("not captured"), so they are not real ages. */
const realAges = (ages: number[]) => ages.filter((a) => a > 0);

export function isDatePending(line: VoucherLine): boolean {
  return !line.date;
}

export function totalsOf(lines: VoucherLine[]) {
  const regular = round2(lines.reduce((sum, l) => sum + l.amount, 0));
  const discount = round2(lines.reduce((sum, l) => sum + l.discount, 0));
  return { regular, discount, total: round2(regular - discount) };
}

/** Passengers of the whole booking: the largest count per category across tours. */
export function groupPax(lines: VoucherLine[]) {
  return {
    adults: Math.max(0, ...lines.map((l) => l.adults)),
    children: Math.max(0, ...lines.map((l) => l.children)),
    infants: Math.max(0, ...lines.map((l) => l.infants)),
  };
}

export function paxSummary(
  pax: { adults: number; children: number; infants: number },
  lang: VoucherLang
): string {
  const word = (n: number, es: [string, string], en: [string, string]) => {
    const [one, many] = lang === "es" ? es : en;
    return `${n} ${n === 1 ? one : many}`;
  };
  const parts: string[] = [];
  if (pax.adults > 0) parts.push(word(pax.adults, ["adulto", "adultos"], ["adult", "adults"]));
  if (pax.children > 0) parts.push(word(pax.children, ["menor", "menores"], ["child", "children"]));
  if (pax.infants > 0) parts.push(word(pax.infants, ["infante", "infantes"], ["infant", "infants"]));
  return parts.join(" + ");
}

/** Infants travel free when their unit price is 0. */
export function infantsAreFree(line: VoucherLine): boolean {
  return line.infants > 0 && line.unitInfant === 0;
}

export function ageNotes(line: VoucherLine, lang: VoucherLang): string[] {
  const notes: string[] = [];
  const childAges = realAges(line.childAges);
  const infantAges = realAges(line.infantAges);
  const free = infantsAreFree(line);

  if (childAges.length > 0) {
    const label =
      lang === "es"
        ? childAges.length === 1 ? "Edad del menor" : "Edades de menores"
        : childAges.length === 1 ? "Child age" : "Child ages";
    notes.push(`${label}: ${childAges.join(", ")}`);
  }
  if (infantAges.length > 0) {
    const label =
      lang === "es"
        ? infantAges.length === 1 ? "Edad del infante" : "Edades de infantes"
        : infantAges.length === 1 ? "Infant age" : "Infant ages";
    const suffix = free ? (lang === "es" ? " (cortesía)" : " (complimentary)") : "";
    notes.push(`${label}: ${infantAges.join(", ")}${suffix}`);
  }
  return notes;
}

/**
 * The per-person prices only make sense on the voucher when they add up to the
 * line amount; promos that spread a package price across tours do not.
 */
export function hasConsistentUnitPrices(line: VoucherLine): boolean {
  if (line.unitAdult <= 0 && line.unitChild <= 0) return false;
  const computed =
    line.adults * line.unitAdult + line.children * line.unitChild + line.infants * line.unitInfant;
  return Math.abs(computed - line.amount) <= 1;
}

/** Text shown when at least one infant travels free; null when there is none. */
export function freeInfantNote(lines: VoucherLine[], lang: VoucherLang): string | null {
  const free = lines.filter(infantsAreFree);
  if (free.length === 0) return null;

  const count = Math.max(...free.map((l) => l.infants));
  const ages = realAges(free.flatMap((l) => l.infantAges));
  const uniqueAges = [...new Set(ages)];

  if (lang === "es") {
    if (count === 1 && uniqueAges.length === 1) {
      return `El infante de ${uniqueAges[0]} años entra sin costo y debe aparecer en todos los manifiestos de servicio y transporte.`;
    }
    const agePart = uniqueAges.length > 0 ? ` (edades: ${uniqueAges.join(", ")})` : "";
    return `Los infantes${agePart} entran sin costo y deben aparecer en todos los manifiestos de servicio y transporte.`;
  }
  if (count === 1 && uniqueAges.length === 1) {
    return `The ${uniqueAges[0]}-year-old child is included at no charge and must appear on every service and transportation manifest.`;
  }
  const agePart = uniqueAges.length > 0 ? ` (ages: ${uniqueAges.join(", ")})` : "";
  return `The infants${agePart} are included at no charge and must appear on every service and transportation manifest.`;
}

export function hasMinors(lines: VoucherLine[]): boolean {
  return lines.some((l) => l.children > 0 || l.infants > 0);
}

export interface NetCostVariant {
  tour_id: string;
  pax_type: string;
  net_cost: number;
  package_name: string | null;
}

/**
 * What WalkMe pays the operator for one tour. Variants store pax_type as
 * "Adulto" / "Menor"; the package-specific cost wins over the general one.
 */
export function pickNetCost(
  variants: NetCostVariant[],
  tourId: string,
  packageName: string | null,
  paxType: "Adulto" | "Menor"
): number {
  const list = variants.filter((v) => v.tour_id === tourId && v.pax_type === paxType);
  const match =
    (packageName ? list.find((v) => v.package_name === packageName) : undefined) ??
    list.find((v) => !v.package_name) ??
    list[0];
  return Number(match?.net_cost ?? 0);
}

/** Operator cost of the whole line; free infants never add to it. */
export function operatorCostOf(line: VoucherLine, variants: NetCostVariant[]): number {
  const adult = pickNetCost(variants, line.tourId ?? "", line.packageName, "Adulto");
  const child = pickNetCost(variants, line.tourId ?? "", line.packageName, "Menor");
  return round2(line.adults * adult + line.children * child);
}
