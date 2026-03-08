/**
 * Robust Sheet/CSV import utilities with alias-based column mapping,
 * delimiter detection, BOM cleanup, and international number parsing.
 */

// ── BOM & whitespace cleanup ──
function cleanText(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// ── Delimiter detection ──
function detectDelimiter(text: string): string {
  const firstLines = text.split("\n").slice(0, 5).join("\n");
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  // Only count outside quotes
  let inQ = false;
  for (const ch of firstLines) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (!inQ && ch in counts) counts[ch]++;
  }
  let best = ",";
  let max = 0;
  for (const [d, c] of Object.entries(counts)) {
    if (c > max) { max = c; best = d; }
  }
  return best;
}

// ── Row parser (handles quoted fields) ──
function parseRow(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === delimiter && !inQ) {
      fields.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

// ── Normalize key: lowercase, strip accents, collapse non-alphanum to _ ──
export function normKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// ── Header row detection: find the row with most alias matches ──
function findHeaderRow(lines: string[], delimiter: string, aliasKeys: string[]): number {
  let bestIdx = 0;
  let bestScore = 0;
  const limit = Math.min(lines.length, 8);
  for (let i = 0; i < limit; i++) {
    const fields = parseRow(lines[i], delimiter).map(normKey);
    let score = 0;
    for (const ak of aliasKeys) {
      if (fields.includes(ak)) score++;
    }
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestIdx;
}

// ── Parse CSV with auto-detection ──
export function parseCSV(text: string, knownAliasKeys?: string[]): Record<string, string>[] {
  const cleaned = cleanText(text);
  const lines = cleaned.split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(cleaned);

  // Find the header row
  let headerIdx = 0;
  if (knownAliasKeys && knownAliasKeys.length > 0) {
    headerIdx = findHeaderRow(lines, delimiter, knownAliasKeys);
  }

  const headers = parseRow(lines[headerIdx], delimiter);
  const rows: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const vals = parseRow(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => { row[h] = vals[j] ?? ""; });
    if (Object.values(row).some((v) => v !== "")) rows.push(row);
  }
  return rows;
}

// ── Parse number with international format support ──
export function parseNum(val: string): number {
  if (!val) return 0;
  let s = val.replace(/[$ \u00a0]/g, "").trim();
  // Detect format: if last separator is comma and has <=2 digits after → comma decimal
  // e.g. "1.234,56" or "101,24"
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    // Comma is the decimal separator
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // Dot is the decimal separator (or no decimal)
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ── Column lookup with expanded aliases ──
// Matches by normalized key against all provided alias variations
export function getCol(row: Record<string, string>, ...keys: string[]): string {
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) normalized[normKey(k)] = v;
  for (const key of keys) {
    const nk = normKey(key);
    // Exact match
    if (normalized[nk] !== undefined && normalized[nk] !== "") return normalized[nk];
  }
  // Fuzzy: check if any normalized header CONTAINS any of the alias keys
  for (const key of keys) {
    const nk = normKey(key);
    if (nk.length < 4) continue; // skip very short keys to avoid false positives
    for (const [hk, hv] of Object.entries(normalized)) {
      if (hv && hk.includes(nk)) return hv;
    }
  }
  return "";
}

// ── Pre-built alias sets for common fields ──

export const PKG_ALIASES = {
  name: ["nombre", "nombre del paquete", "nombre paquete", "paquete", "name", "package_name", "package name"],
  service_type: ["tipo", "tipo servicio", "tipo de servicio", "service_type", "modalidad"],
  pub_adult_usd: [
    "precio publico adulto usd", "precio pub adulto usd", "precio adulto usd",
    "public_price_adult_usd", "precio_adulto_usd", "precio_pub_adulto_usd",
    "adulto usd", "precio publico adulto", "precio adulto",
  ],
  pub_child_usd: [
    "precio publico menor usd", "precio publico nino usd", "precio pub menor usd",
    "precio pub nino usd", "precio nino usd", "precio menor usd",
    "public_price_child_usd", "precio_nino_usd", "precio_pub_nino_usd",
    "menor usd", "nino usd", "precio publico menor", "precio menor", "precio nino",
  ],
  cost_adult: [
    "costo neto adulto usd", "costo neto adulto", "costo adulto usd", "costo adulto",
    "cost_adult_usd", "costo_adulto", "neto adulto",
  ],
  cost_child: [
    "costo neto menor usd", "costo neto nino usd", "costo neto menor", "costo neto nino",
    "costo menor usd", "costo nino usd", "costo menor", "costo nino",
    "cost_child_usd", "costo_nino", "neto menor", "neto nino",
  ],
  tax_adult: [
    "impuesto adulto", "impuesto al abordar adulto", "tax adulto", "tax adult",
    "impuesto adulto usd", "tax_adult_usd",
  ],
  tax_child: [
    "impuesto menor", "impuesto nino", "impuesto al abordar menor", "impuesto al abordar nino",
    "tax menor", "tax nino", "tax child", "impuesto menor usd", "tax_child_usd",
  ],
  fees: ["fees", "mandatory_fees_usd", "fees_usd", "fees al abordar", "muelle", "fees usd"],
  includes: ["incluye", "includes", "que incluye"],
  excludes: ["no incluye", "no_incluye", "excludes", "que no incluye"],
};

export const VARIANT_ALIASES = {
  sale_price: [
    "precio venta", "precio_venta", "sale_price", "precio de venta", "venta",
    "precio venta mxn", "precio",
  ],
  package: ["paquete", "package_name", "nombre paquete", "package"],
  zone: ["zona", "zone"],
  pax_type: ["tipo pax", "tipo_pax", "pax_type", "tipo pasajero", "tipo de pasajero", "adulto nino", "adulto menor"],
  nationality: ["nacionalidad", "nationality", "origen", "nacional extranjero"],
  net_cost: ["costo neto", "costo_neto", "net_cost", "costo", "neto"],
  tax_fee: ["tax", "fee", "tax_fee", "tax/fee", "impuesto", "impuesto fee"],
};

export const GENERAL_ALIASES = {
  title: ["titulo", "tour_name", "nombre", "title", "nombre del tour"],
  description: ["descripcion", "short_description", "descripcion_corta", "descripcion corta"],
  itinerary: ["itinerario", "itinerary"],
  includes: ["incluye", "includes"],
  excludes: ["no_incluye", "excludes", "no incluye"],
  meeting_point: ["punto_de_encuentro", "meeting_point", "punto encuentro", "punto de encuentro"],
  what_to_bring: ["que_llevar", "what_to_bring", "que llevar"],
  recommendations: ["recomendaciones", "recommendations"],
};

/** Collect all alias keys (normalized) for header detection */
export function collectAliasKeys(aliasMap: Record<string, string[]>): string[] {
  const keys: string[] = [];
  for (const aliases of Object.values(aliasMap)) {
    for (const a of aliases) keys.push(normKey(a));
  }
  return keys;
}
