import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VoucherPrintView from "./VoucherPrintView";
import type { VoucherGroup } from "@/lib/voucher-lines";

// The voucher only reads the cancellation-policy settings; none are needed here.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ in: () => Promise.resolve({ data: [] }) }) }),
  },
}));

const group: VoucherGroup = {
  folios: ["WM-0567"],
  deposit: 0,
  balance: 0,
  lines: [
    {
      id: "a", reservationId: "r1", tourId: "t1", folio: "WM-0567",
      title: "Xcaret Plus", packageName: "Entry + Buffet", includes: [],
      date: "2026-10-01", time: "7:40 AM",
      adults: 2, children: 0, infants: 1, childAges: [], infantAges: [4],
      unitAdult: 3977.5, unitChild: 0, unitInfant: 0,
      amount: 7955, discount: 6825, operatorId: "op", operatorName: "Xcaret",
    },
    {
      id: "b", reservationId: "r2", tourId: "t2", folio: "WM-0568",
      title: "Xichén Deluxe", packageName: null, includes: [],
      date: "2026-10-05", time: "7:35 AM",
      adults: 2, children: 0, infants: 1, childAges: [], infantAges: [4],
      unitAdult: 3422.5, unitChild: 0, unitInfant: 0,
      amount: 6845, discount: 0, operatorId: "op", operatorName: "Xcaret",
    },
    {
      id: "c", reservationId: "r3", tourId: "t3", folio: "WM-0569",
      title: "Xenses", packageName: null, includes: [],
      date: "", time: "7:40 AM",
      adults: 2, children: 0, infants: 1, childAges: [], infantAges: [4],
      unitAdult: 2312.5, unitChild: 0, unitInfant: 0,
      amount: 4625, discount: 0, operatorId: "op", operatorName: "Xcaret",
    },
  ],
};

const reservation = {
  id: "r1",
  folio: "WM-0567",
  reservation_date: "2026-10-01",
  reservation_time: "7:40 AM",
  pax_adults: 2,
  pax_children: 0,
  total_mxn: 7955 - 6825,
  modality: "shared",
  zone: "Playa del Carmen",
  nationality: "extranjero",
  notes: null,
  created_at: "2026-09-29T18:00:00Z",
  status: "confirmed",
  operator_folio: "XC-1",
  hotel_name: "Sandos Caracol Eco Resort",
  clients: { name: "James Tulley", phone: "+1 555 0100", email: null },
  voucher_group: group,
};

const renderVoucher = (lang: "es" | "en") =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <VoucherPrintView reservation={reservation} lang={lang} />
    </QueryClientProvider>
  );

describe("VoucherPrintView with several tours", () => {
  it("lists every tour with the regular amount, discount and final total", () => {
    renderVoucher("en");
    expect(screen.getByText("PURCHASE BREAKDOWN")).toBeInTheDocument();
    expect(screen.getByText("Xcaret Plus")).toBeInTheDocument();
    expect(screen.getByText("Xichén Deluxe")).toBeInTheDocument();
    expect(screen.getByText("Xenses")).toBeInTheDocument();
    expect(screen.getByText("$19,425.00 MXN")).toBeInTheDocument();
    expect(screen.getByText("-$6,825.00 MXN")).toBeInTheDocument();
    expect(screen.getByText("$12,600.00 MXN")).toBeInTheDocument();
  });

  it("shows the infant as complimentary and the pending date", () => {
    renderVoucher("en");
    expect(screen.getAllByText("Infant age: 4 (complimentary)").length).toBe(3);
    expect(screen.getByText("DATE PENDING")).toBeInTheDocument();
    expect(screen.getByText(/The 4-year-old child is included at no charge/)).toBeInTheDocument();
  });

  it("renders in Spanish", () => {
    renderVoucher("es");
    expect(screen.getByText("DESGLOSE DE COMPRA")).toBeInTheDocument();
    expect(screen.getByText("FECHA POR CONFIRMAR")).toBeInTheDocument();
  });
});
