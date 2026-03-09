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
    // Strict exact match only — no fuzzy fallback to avoid cross-column contamination
    if (normalized[nk] !== undefined && normalized[nk] !== "") return normalized[nk];
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
  image_url: ["image_url", "imagen", "foto", "url imagen", "image", "images", "fotos", "url foto", "url_imagen", "photo", "picture"],
};

/** Collect all alias keys (normalized) for header detection */
export function collectAliasKeys(aliasMap: Record<string, string[]>): string[] {
  const keys: string[] = [];
  for (const aliases of Object.values(aliasMap)) {
    for (const a of aliases) keys.push(normKey(a));
  }
  return keys;
}

// ── Fuzzy matching utilities ──

/** Compute longest common substring length between two strings */
function lcsLength(a: string, b: string): number {
  let max = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let k = 0;
      while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++;
      if (k > max) max = k;
    }
  }
  return max;
}

/** Score how well a header matches a field alias (0 = no match, higher = better).
 *  Only exact and contains matches — NO fuzzy LCS to avoid false positives. */
function matchScore(headerNorm: string, aliasNorm: string): number {
  if (headerNorm === aliasNorm) return 1000; // exact
  if (headerNorm.includes(aliasNorm) || aliasNorm.includes(headerNorm)) {
    return 500 + Math.min(headerNorm.length, aliasNorm.length);
  }
  return 0;
}

export interface ColumnMapping {
  /** Original header from the sheet */
  header: string;
  /** Assigned system field key (e.g. "name", "pub_adult_usd") or null if ignored */
  fieldKey: string | null;
  /** Match status */
  status: "auto" | "suggested" | "unmapped";
  /** Best score (for sorting) */
  score: number;
}

/**
 * Auto-map CSV headers to system fields using alias matching + fuzzy fallback.
 * Returns one ColumnMapping per header.
 */
export function autoMapColumns(
  headers: string[],
  aliasMap: Record<string, string[]>
): ColumnMapping[] {
  const result: ColumnMapping[] = [];
  const usedFields = new Set<string>();

  // Build flattened alias index: { normalizedAlias → fieldKey }
  const aliasIndex: { norm: string; fieldKey: string }[] = [];
  for (const [fieldKey, aliases] of Object.entries(aliasMap)) {
    for (const a of aliases) {
      aliasIndex.push({ norm: normKey(a), fieldKey });
    }
  }

  for (const header of headers) {
    const hn = normKey(header);
    if (!hn) {
      result.push({ header, fieldKey: null, status: "unmapped", score: 0 });
      continue;
    }

    let bestField: string | null = null;
    let bestScore = 0;
    let isExact = false;

    for (const { norm, fieldKey } of aliasIndex) {
      if (usedFields.has(fieldKey)) continue;
      const s = matchScore(hn, norm);
      if (s > bestScore) {
        bestScore = s;
        bestField = fieldKey;
        isExact = s >= 1000;
      }
    }

    if (bestField && bestScore >= 500) {
      usedFields.add(bestField);
      result.push({ header, fieldKey: bestField, status: "auto", score: bestScore });
    } else if (bestField && bestScore > 0) {
      usedFields.add(bestField);
      result.push({ header, fieldKey: bestField, status: "suggested", score: bestScore });
    } else {
      result.push({ header, fieldKey: null, status: "unmapped", score: 0 });
    }
  }

  return result;
}

/**
 * Get top N field suggestions for a given header, sorted by score descending.
 */
export function suggestFields(
  headerNorm: string,
  aliasMap: Record<string, string[]>,
  excludeFields?: Set<string>
): { fieldKey: string; score: number; label: string }[] {
  const suggestions: { fieldKey: string; score: number; label: string }[] = [];

  for (const [fieldKey, aliases] of Object.entries(aliasMap)) {
    if (excludeFields?.has(fieldKey)) continue;
    let best = 0;
    for (const a of aliases) {
      const s = matchScore(headerNorm, normKey(a));
      if (s > best) best = s;
    }
    if (best > 0) {
      suggestions.push({ fieldKey, score: best, label: aliases[0] });
    }
  }

  return suggestions.sort((a, b) => b.score - a.score);
}

/** Get human-readable label for a field key from alias map */
export function fieldLabel(fieldKey: string, aliasMap: Record<string, string[]>): string {
  const aliases = aliasMap[fieldKey];
  return aliases?.[0] ?? fieldKey;
}

/** Validate that fetched CSV actually contains recognizable columns for the chosen alias set.
 *  Returns match stats to help detect wrong-tab scenarios. */
export function validateTabContent(
  headers: string[],
  aliasMap: Record<string, string[]>
): { valid: boolean; matchedCount: number; totalFields: number; matchedFields: string[] } {
  const totalFields = Object.keys(aliasMap).length;
  const matchedFields: string[] = [];

  for (const [fieldKey, aliases] of Object.entries(aliasMap)) {
    const aliasNorms = aliases.map(normKey);
    const found = headers.some(h => {
      const hn = normKey(h);
      return aliasNorms.some(an => hn === an || (an.length >= 4 && (hn.includes(an) || an.includes(hn))));
    });
    if (found) matchedFields.push(fieldKey);
  }

  return {
    valid: matchedFields.length > 0,
    matchedCount: matchedFields.length,
    totalFields,
    matchedFields,
  };
}

/** Parse CSV text and return headers + first N sample rows (for preview) */
export function parseCSVPreview(text: string, maxRows = 3, knownAliasKeys?: string[]): {
  headers: string[];
  sampleRows: Record<string, string>[];
  allRows: Record<string, string>[];
} {
  const aliasKeys = knownAliasKeys;
  const allRows = parseCSV(text, aliasKeys);
  if (allRows.length === 0) return { headers: [], sampleRows: [], allRows };
  const headers = Object.keys(allRows[0]);
  const sampleRows = allRows.slice(0, maxRows);
  return { headers, sampleRows, allRows };
}
