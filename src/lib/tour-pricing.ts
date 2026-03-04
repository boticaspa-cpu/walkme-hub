/**
 * Shared tour pricing logic.
 * 1) Try exact match in tour_price_variants by tour+zone+nationality+pax_type
 * 2) Fallback to tour.price_mxn (adult) / tour.suggested_price_mxn (child)
 */

export interface TourPriceResult {
  adultPrice: number;
  childPrice: number;
  source: "variant" | "tour_base";
}

interface VariantRow {
  tour_id: string;
  zone: string;
  nationality: string;
  pax_type: string;
  sale_price: number;
}

interface TourBase {
  id: string;
  price_mxn: number;
  suggested_price_mxn: number;
}

export function computeTourPrice(
  tourId: string,
  zone: string,
  nationality: string,
  variants: VariantRow[],
  toursData: TourBase[]
): TourPriceResult {
  const adultVariant = variants.find(
    (v) =>
      v.tour_id === tourId &&
      v.zone === zone &&
      v.nationality === nationality &&
      v.pax_type === "Adulto"
  );
  const childVariant = variants.find(
    (v) =>
      v.tour_id === tourId &&
      v.zone === zone &&
      v.nationality === nationality &&
      v.pax_type === "Niño"
  );

  if (adultVariant) {
    return {
      adultPrice: adultVariant.sale_price ?? 0,
      childPrice: childVariant?.sale_price ?? 0,
      source: "variant",
    };
  }

  // Fallback to tour base prices
  const tour = toursData.find((t) => t.id === tourId);
  if (tour) {
    return {
      adultPrice: tour.price_mxn ?? 0,
      childPrice: tour.suggested_price_mxn ?? 0,
      source: "tour_base",
    };
  }

  return { adultPrice: 0, childPrice: 0, source: "tour_base" };
}

export function computeTotal(
  adultPrice: number,
  childPrice: number,
  paxAdults: number,
  paxChildren: number
): number {
  return paxAdults * adultPrice + paxChildren * childPrice;
}
