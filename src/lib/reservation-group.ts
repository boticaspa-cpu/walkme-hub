import { supabase } from "@/integrations/supabase/client";
import type { VoucherGroup, VoucherLine } from "@/lib/voucher-lines";

interface SiblingRow {
  id: string;
  folio: string | null;
  reservation_date: string;
  reservation_time: string;
  pax_adults: number;
  pax_children: number;
  pax_infants: number | null;
  child_ages: number[] | null;
  infant_ages: number[] | null;
  unit_price_infant_mxn: number | null;
  total_mxn: number;
  discount_mxn: number | null;
  deposit_mxn: number | null;
  balance_mxn: number | null;
  package_name: string | null;
  tour_id: string | null;
  tours?: {
    title: string;
    includes: string[] | null;
    operator_id: string | null;
    operators?: { name: string } | null;
  } | null;
}

interface ItemRow {
  id: string;
  reservation_id: string;
  tour_id: string | null;
  tour_date: string | null;
  qty_adults: number;
  qty_children: number;
  qty_infants: number;
  child_ages: number[] | null;
  infant_ages: number[] | null;
  unit_price_mxn: number;
  unit_price_child_mxn: number;
  unit_price_infant_mxn: number;
  subtotal_mxn: number;
  package_name: string | null;
}

const SIBLING_SELECT =
  "id, folio, reservation_date, reservation_time, pax_adults, pax_children, pax_infants, child_ages, infant_ages, unit_price_infant_mxn, total_mxn, discount_mxn, deposit_mxn, balance_mxn, package_name, tour_id, tours(title, includes, operator_id, operators(name))";

/**
 * A booking with several tours is inserted as one reservation per tour in a
 * single statement, so every row shares client, creator and created_at.
 * That triple is what ties the tours of one voucher together.
 */
async function loadSiblings(r: {
  id: string;
  client_id?: string | null;
  created_at?: string;
  created_by?: string | null;
  status?: string;
}): Promise<SiblingRow[]> {
  const single = async () => {
    const { data } = await supabase.from("reservations").select(SIBLING_SELECT).eq("id", r.id).maybeSingle();
    return data ? [data as unknown as SiblingRow] : [];
  };
  if (!r.client_id || !r.created_at) return single();

  let query = supabase
    .from("reservations")
    .select(SIBLING_SELECT)
    .eq("client_id", r.client_id)
    .eq("created_at", r.created_at);
  if (r.created_by) query = query.eq("created_by", r.created_by);
  // A cancelled tour should not show up on the voucher of the ones still running.
  if (r.status !== "cancelled") query = query.neq("status", "cancelled");

  const { data, error } = await query;
  const rows = (error ? [] : data ?? []) as unknown as SiblingRow[];
  if (rows.some((row) => row.id === r.id)) return rows;
  return [...rows, ...(await single())];
}

function buildLines(siblings: SiblingRow[], items: ItemRow[]): VoucherLine[] {
  const lines: VoucherLine[] = [];

  for (const res of siblings) {
    const resItems = items.filter((i) => i.reservation_id === res.id);
    const common = {
      reservationId: res.id,
      tourId: res.tour_id,
      folio: res.folio,
      title: res.tours?.title ?? "—",
      includes: res.tours?.includes ?? [],
      time: res.reservation_time ?? "",
      operatorId: res.tours?.operator_id ?? null,
      operatorName: res.tours?.operators?.name ?? null,
    };

    if (resItems.length === 0) {
      lines.push({
        ...common,
        id: res.id,
        packageName: res.package_name || null,
        date: res.reservation_date ?? "",
        adults: res.pax_adults,
        children: res.pax_children,
        infants: res.pax_infants ?? 0,
        childAges: res.child_ages ?? [],
        infantAges: res.infant_ages ?? [],
        unitAdult: 0,
        unitChild: 0,
        unitInfant: res.unit_price_infant_mxn ?? 0,
        amount: res.total_mxn + (res.discount_mxn ?? 0),
        discount: res.discount_mxn ?? 0,
      });
      continue;
    }

    resItems.forEach((item, index) => {
      lines.push({
        ...common,
        id: item.id,
        packageName: item.package_name || res.package_name || null,
        date: item.tour_date ?? res.reservation_date ?? "",
        adults: item.qty_adults,
        children: item.qty_children,
        infants: item.qty_infants,
        childAges: item.child_ages ?? [],
        infantAges: item.infant_ages ?? [],
        unitAdult: item.unit_price_mxn,
        unitChild: item.unit_price_child_mxn,
        unitInfant: item.unit_price_infant_mxn,
        // The reservation row is the source of truth for money; the discount
        // is charged once, on the first line of the reservation.
        amount: resItems.length === 1 ? res.total_mxn + (res.discount_mxn ?? 0) : item.subtotal_mxn,
        discount: index === 0 ? res.discount_mxn ?? 0 : 0,
      });
    });
  }

  return lines.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

/** Loads every tour that belongs to the same booking as reservation `r`. */
export async function loadVoucherGroup(r: {
  id: string;
  client_id?: string | null;
  created_at?: string;
  created_by?: string | null;
  status?: string;
}): Promise<VoucherGroup> {
  const siblings = await loadSiblings(r);
  const ids = siblings.map((s) => s.id);

  let items: ItemRow[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("reservation_items")
      .select("*")
      .in("reservation_id", ids)
      .order("created_at");
    items = (data ?? []) as unknown as ItemRow[];
  }

  return {
    lines: buildLines(siblings, items),
    folios: siblings.map((s) => s.folio).filter((f): f is string => !!f),
    deposit: siblings.reduce((sum, s) => sum + (s.deposit_mxn ?? 0), 0),
    balance: siblings.reduce((sum, s) => sum + (s.balance_mxn ?? 0), 0),
  };
}
