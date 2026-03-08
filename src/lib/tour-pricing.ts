/**
 * Shared tour pricing logic.
 * 1) Try exact match in tour_price_variants by tour+zone+nationality+pax_type
 * 2) Fallback to tour.price_mxn (adult) / tour.suggested_price_mxn (child)
 * 3) If price_mxn=0 but public_price_adult_usd>0 → convert USD×TC to MXN
 */

export interface TourPriceResult {
  adultPrice: number;
  childPrice: number;
  source: "variant" | "tour_base" | "tour_usd";
}

interface VariantRow {
  tour_id: string;
  zone: string;
  nationality: string;
  pax_type: string;
  sale_price: number;
  package_name?: string | null;
}

export interface TourPackageRow {
  tour_id: string;
  name: string;
  price_adult_mxn: number;
  price_child_mxn: number;
}

interface TourBase {
  id: string;
  price_mxn: number;
  suggested_price_mxn: number;
  public_price_adult_usd?: number;
  public_price_child_usd?: number;
  exchange_rate_tour?: number;
  tax_adult_usd?: number;
  tax_child_usd?: number;
}

export function computeTourPrice(
  tourId: string,
  zone: string,
  nationality: string,
  variants: VariantRow[],
  toursData: TourBase[],
  packageName?: string,
  tourPackages?: TourPackageRow[]
): TourPriceResult {
  const findVariant = (paxType: string, pkgMatch: (pn: string | null | undefined) => boolean) =>
    variants.find(
      (v) =>
        v.tour_id === tourId &&
        v.zone === zone &&
        v.nationality === nationality &&
        v.pax_type === paxType &&
        pkgMatch(v.package_name)
    );

  // 1) Exact package match
  if (packageName) {
    const adult = findVariant("Adulto", (pn) => pn === packageName);
    if (adult) {
      const child = findVariant("Menor", (pn) => pn === packageName);
      return { adultPrice: adult.sale_price ?? 0, childPrice: child?.sale_price ?? 0, source: "variant" };
    }
  }

  // 2) General (no package) match
  const isGeneral = (pn: string | null | undefined) => !pn || pn === "";
  const adultVariant = findVariant("Adulto", isGeneral);
  if (adultVariant) {
    const childVariant = findVariant("Menor", isGeneral);
    return { adultPrice: adultVariant.sale_price ?? 0, childPrice: childVariant?.sale_price ?? 0, source: "variant" };
  }

  // 3) tour_packages price (middle fallback)
  if (packageName && tourPackages) {
    const pkg = tourPackages.find((p) => p.tour_id === tourId && p.name === packageName);
    if (pkg) {
      return { adultPrice: pkg.price_adult_mxn ?? 0, childPrice: pkg.price_child_mxn ?? 0, source: "tour_base" };
    }
  }

  // Fallback to tour base prices
  const tour = toursData.find((t) => t.id === tourId);
  if (tour) {
    // If MXN prices are filled, use them
    if ((tour.price_mxn ?? 0) > 0) {
      return {
        adultPrice: tour.price_mxn ?? 0,
        childPrice: tour.suggested_price_mxn ?? 0,
        source: "tour_base",
      };
    }

    // Fallback: USD prices × exchange rate
    const usdAdult = tour.public_price_adult_usd ?? 0;
    const usdChild = tour.public_price_child_usd ?? 0;
    const tc = tour.exchange_rate_tour && tour.exchange_rate_tour > 0 ? tour.exchange_rate_tour : 1;
    const taxAdult = tour.tax_adult_usd ?? 0;
    const taxChild = tour.tax_child_usd ?? 0;

    if (usdAdult > 0) {
      return {
        adultPrice: Math.round((usdAdult + taxAdult) * tc * 100) / 100,
        childPrice: Math.round((usdChild + taxChild) * tc * 100) / 100,
        source: "tour_usd",
      };
    }

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
