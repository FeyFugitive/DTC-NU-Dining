const NU_PURPLE = "#401F68";

function hallThumbnailDataUri(label: string): string {
  const short = label
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect fill="${NU_PURPLE}" width="128" height="128" rx="14"/><text x="64" y="78" font-size="36" font-weight="600" fill="white" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif">${short}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export type CrowdLevel = "low" | "moderate" | "busy" | "unknown";

/** Relative line/busyness vs this hall's typical peak (placeholder until live data). */
export type RelativeBusyness =
  | "quieter_than_usual"
  | "about_usual"
  | "busier_than_usual"
  | "much_busier_than_usual"
  | "unknown";

export interface DiningHallPayments {
  mealExchange: boolean;
  diningDollars: boolean;
  credit: boolean;
}

export interface DiningHallMeta {
  subtitle: string;
  thumbnailSrc: string;
  /** How busy lines feel vs this location's usual (Google Maps–style, not minutes). */
  relativeBusyness: RelativeBusyness;
  crowdLevel: CrowdLevel;
  payments: DiningHallPayments;
}

const defaultPayments: DiningHallPayments = {
  mealExchange: false,
  diningDollars: false,
  credit: false,
};

export const DINING_HALL_META: Record<string, DiningHallMeta> = {
  Sargent: {
    subtitle: "Residential · South Campus",
    thumbnailSrc: hallThumbnailDataUri("Sargent"),
    relativeBusyness: "about_usual",
    crowdLevel: "moderate",
    payments: defaultPayments,
  },
  Elder: {
    subtitle: "Residential · North Campus",
    thumbnailSrc: hallThumbnailDataUri("Elder"),
    relativeBusyness: "quieter_than_usual",
    crowdLevel: "low",
    payments: defaultPayments,
  },
  Allison: {
    subtitle: "Residential · East Campus",
    thumbnailSrc: hallThumbnailDataUri("Allison"),
    relativeBusyness: "about_usual",
    crowdLevel: "moderate",
    payments: defaultPayments,
  },
  "Plex East": {
    subtitle: "Residential · East Fairchild",
    thumbnailSrc: hallThumbnailDataUri("Plex East"),
    relativeBusyness: "much_busier_than_usual",
    crowdLevel: "busy",
    payments: defaultPayments,
  },
  "Plex West": {
    subtitle: "Residential · West Fairchild",
    thumbnailSrc: hallThumbnailDataUri("Plex West"),
    relativeBusyness: "busier_than_usual",
    crowdLevel: "busy",
    payments: defaultPayments,
  },
};

export function getDiningHallMeta(locationName: string): DiningHallMeta {
  return (
    DINING_HALL_META[locationName] ?? {
      subtitle: "Campus dining",
      thumbnailSrc: hallThumbnailDataUri(locationName),
      relativeBusyness: "unknown",
      crowdLevel: "unknown",
      payments: defaultPayments,
    }
  );
}

export function relativeBusynessLabel(level: RelativeBusyness): string {
  switch (level) {
    case "quieter_than_usual":
      return "Quieter than usual";
    case "about_usual":
      return "About as busy as usual";
    case "busier_than_usual":
      return "Busier than usual";
    case "much_busier_than_usual":
      return "Much busier than usual";
    default:
      return "Not enough data yet";
  }
}
