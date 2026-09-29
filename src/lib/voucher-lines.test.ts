import { describe, it, expect } from "vitest";
import {
  ageNotes, freeInfantNote, groupPax, hasConsistentUnitPrices, isDatePending,
  operatorCostOf, paxSummary, pickNetCost, totalsOf,
  type NetCostVariant, type VoucherLine,
} from "./voucher-lines";

const line = (over: Partial<VoucherLine> = {}): VoucherLine => ({
  id: "l1",
  reservationId: "r1",
  tourId: "t1",
  folio: "WM-0567",
  title: "Xcaret Plus",
  packageName: null,
  includes: [],
  date: "2026-10-01",
  time: "7:40 AM",
  adults: 2,
  children: 0,
  infants: 1,
  childAges: [],
  infantAges: [4],
  unitAdult: 3977.5,
  unitChild: 0,
  unitInfant: 0,
  amount: 7955,
  discount: 0,
  operatorId: "op1",
  operatorName: "Xcaret",
  ...over,
});

describe("totalsOf", () => {
  it("adds regular amounts and subtracts the promo discount", () => {
    const lines = [
      line({ amount: 7955, discount: 6825 }),
      line({ id: "l2", amount: 6845 }),
      line({ id: "l3", amount: 4625 }),
    ];
    expect(totalsOf(lines)).toEqual({ regular: 19425, discount: 6825, total: 12600 });
  });
});

describe("paxSummary and ages", () => {
  it("describes 2 adults + 1 infant", () => {
    expect(paxSummary(groupPax([line()]), "en")).toBe("2 adults + 1 infant");
    expect(paxSummary(groupPax([line()]), "es")).toBe("2 adultos + 1 infante");
  });

  it("marks free infants as complimentary and ignores age 0", () => {
    expect(ageNotes(line(), "en")).toEqual(["Infant age: 4 (complimentary)"]);
    expect(ageNotes(line({ infantAges: [0] }), "es")).toEqual([]);
  });

  it("does not call an infant complimentary when it pays", () => {
    expect(ageNotes(line({ unitInfant: 500 }), "es")).toEqual(["Edad del infante: 4"]);
  });
});

describe("freeInfantNote", () => {
  it("names the age of a single free infant", () => {
    expect(freeInfantNote([line()], "en")).toContain("The 4-year-old child is included at no charge");
    expect(freeInfantNote([line()], "es")).toContain("El infante de 4 años entra sin costo");
  });

  it("is null when nobody travels free", () => {
    expect(freeInfantNote([line({ infants: 0, infantAges: [] })], "en")).toBeNull();
    expect(freeInfantNote([line({ unitInfant: 300 })], "en")).toBeNull();
  });
});

describe("hasConsistentUnitPrices / isDatePending", () => {
  it("accepts unit prices that add up to the amount", () => {
    expect(hasConsistentUnitPrices(line())).toBe(true);
  });

  it("rejects a line whose amount was spread from a package price", () => {
    expect(hasConsistentUnitPrices(line({ amount: 5000 }))).toBe(false);
  });

  it("flags a missing date", () => {
    expect(isDatePending(line({ date: "" }))).toBe(true);
    expect(isDatePending(line())).toBe(false);
  });
});

describe("operator cost", () => {
  const variants: NetCostVariant[] = [
    { tour_id: "t1", pax_type: "Adulto", net_cost: 1000, package_name: null },
    { tour_id: "t1", pax_type: "Menor", net_cost: 700, package_name: null },
    { tour_id: "t1", pax_type: "Adulto", net_cost: 1200, package_name: "Plus" },
  ];

  it("reads pax_type as Adulto / Menor and prefers the package price", () => {
    expect(pickNetCost(variants, "t1", null, "Adulto")).toBe(1000);
    expect(pickNetCost(variants, "t1", "Plus", "Adulto")).toBe(1200);
    expect(pickNetCost(variants, "t1", "Plus", "Menor")).toBe(700);
  });

  it("charges adults and minors but not free infants", () => {
    expect(operatorCostOf(line({ adults: 2, children: 1, infants: 1 }), variants)).toBe(2700);
  });

  it("is 0 when the operator has no cost loaded", () => {
    expect(operatorCostOf(line({ tourId: "other" }), variants)).toBe(0);
  });
});
