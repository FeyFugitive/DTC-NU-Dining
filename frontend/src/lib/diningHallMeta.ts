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

export interface DiningHallPayments {
  mealExchange: boolean;
  diningDollars: boolean;
  credit: boolean;
}

export interface DiningHallMeta {
  subtitle: string;
  thumbnailSrc: string;
  walkMinutesFromNorris: number;
  typicalWaitMinutes: number | null;
  crowdLevel: CrowdLevel;
  payments: DiningHallPayments;
}

const defaultPayments: DiningHallPayments = {
  mealExchange: true,
  diningDollars: true,
  credit: true,
};

export const DINING_HALL_META: Record<string, DiningHallMeta> = {
  Sargent: {
    subtitle: "Residential · South Campus",
    thumbnailSrc: hallThumbnailDataUri("Sargent"),
    walkMinutesFromNorris: 7,
    typicalWaitMinutes: 8,
    crowdLevel: "moderate",
    payments: defaultPayments,
  },
  Elder: {
    subtitle: "Residential · North Campus",
    thumbnailSrc: hallThumbnailDataUri("Elder"),
    walkMinutesFromNorris: 9,
    typicalWaitMinutes: 6,
    crowdLevel: "low",
    payments: defaultPayments,
  },
  Allison: {
    subtitle: "Residential · East Campus",
    thumbnailSrc: hallThumbnailDataUri("Allison"),
    walkMinutesFromNorris: 6,
    typicalWaitMinutes: 10,
    crowdLevel: "moderate",
    payments: defaultPayments,
  },
  "Plex East": {
    subtitle: "Residential · East Fairchild",
    thumbnailSrc: hallThumbnailDataUri("Plex East"),
    walkMinutesFromNorris: 5,
    typicalWaitMinutes: 12,
    crowdLevel: "busy",
    payments: defaultPayments,
  },
  "Plex West": {
    subtitle: "Residential · West Fairchild",
    thumbnailSrc: hallThumbnailDataUri("Plex West"),
    walkMinutesFromNorris: 5,
    typicalWaitMinutes: 11,
    crowdLevel: "busy",
    payments: defaultPayments,
  },
};

export function getDiningHallMeta(locationName: string): DiningHallMeta {
  return (
    DINING_HALL_META[locationName] ?? {
      subtitle: "Campus dining",
      thumbnailSrc: hallThumbnailDataUri(locationName),
      walkMinutesFromNorris: 8,
      typicalWaitMinutes: null,
      crowdLevel: "unknown",
      payments: defaultPayments,
    }
  );
}
