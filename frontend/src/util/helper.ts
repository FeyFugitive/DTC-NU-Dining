import type { DailyItem, WeeklyItemsMap } from "../types/ItemTypes";
import type { Day, Hour, LocationOperatingTimes, OperationHoursData, OperatingTime } from "../types/OperationTypes";

/** YYYY-MM-DD in the user's local timezone (matches weeklyItems keys from the backend). */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Normalize menu item `Date` from API (ISO date or datetime string). */
export function menuItemDateKey(item: Pick<DailyItem, "Date">): string | null {
  const raw = item.Date?.trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) return toLocalISODate(new Date(t));
  return null;
}

/**
 * Items for a calendar day. Prefer grouping by each row's `Date` when the map keys
 * from the server don't match the user's local date (common after DB reload).
 */
export function getDailyItemsForDate(weeklyItems: WeeklyItemsMap | null | undefined, date: Date): DailyItem[] {
  if (!weeklyItems || typeof weeklyItems !== "object") return [];
  const key = toLocalISODate(date);
  const fromBucket = weeklyItems[key];
  const flat = Object.values(weeklyItems).flat();
  const fromRowDates = flat.filter((item) => menuItemDateKey(item) === key);
  if (fromRowDates.length > 0) return fromRowDates;
  return Array.isArray(fromBucket) ? fromBucket : [];
}

/** Dates that appear in menu payloads (map keys plus each row's `Date`). */
export function getMenuCoverageDates(weeklyItems: WeeklyItemsMap | null | undefined): string[] {
  if (!weeklyItems || typeof weeklyItems !== "object") return [];
  const keys = new Set<string>();
  for (const k of Object.keys(weeklyItems)) {
    if (k) keys.add(k);
  }
  for (const item of Object.values(weeklyItems).flat()) {
    const d = menuItemDateKey(item);
    if (d) keys.add(d);
  }
  return [...keys].sort();
}

/** Match menu/hours rows to short hall keys used in the UI (e.g. "Elder Dining Commons" → "Elder"). */
export function normalizeHallKey(locationFromApi: string): string {
  for (const [shortName, aliases] of Object.entries(locationAliases)) {
    if (locationFromApi === shortName || aliases.includes(locationFromApi)) {
      return shortName;
    }
  }
  return locationFromApi;
}

// Returns
// -- Breakfast if current time is between 7:00 AM and 10:59 AM
// -- Lunch if current time is between 11:00 AM and 4:59 PM
// -- Dinner if current time is between 5:00 PM and 7:59 PM
// -- Empty string if current time is outside of the above ranges
export const getCurrentTimeOfDay = (): string => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  if (currentHour >= 7 && currentHour <= 10) {
    return "Breakfast";
  } else if (currentHour >= 11 && currentHour <= 16) {
    return "Lunch";
  } else if (currentHour >= 17 && currentHour <= 22) {
    return "Dinner";
  }
  return "";
};

export const getWeekday = (dateNum: number): string => {
  switch (dateNum) {
    case 0:
      return "Sunday"
    case 1:
      return "Monday"
    case 2:
      return "Tuesday"
    case 3:
      return "Wednesday"
    case 4:
      return "Thursday"
    case 5:
      return "Friday"
    case 6:
      return "Saturday"
    default:
      return "How did you get here?"
  }
}

// 4/28/2025 encountered Plex West as "Foster Walker Plex West" instead of "Foster Walker Plex West & Market"
// To avoid breaking the app, we will add an alias for it and iterate over which one we find
export const locationAliases: Record<string, string[]> = {
  Elder: ["Elder Dining Commons", "Elder"],
  Sargent: ["Sargent Dining Commons", "Sargent"],
  Allison: ["Allison Dining Commons", "Allison"],
  "Plex East": ["Foster Walker Plex East", "Plex East"],
  "Plex West": [
    "Foster Walker Plex West & Market",
    "Foster Walker Plex West",
    "Plex West",
  ],
};

/** Pick the correct week row for `date` (Week[] order from Dine On Campus is not Sun–Sat index order). */
export function getOperatingHoursForDate(loc: OperationHoursData | undefined, date: Date): Hour[] | null {
  if (!loc?.Week?.length) return null;

  const dateStr = toLocalISODate(date);
  let dayInfo = loc.Week.find((d: Day) => d.Date === dateStr);

  if (!dayInfo) {
    const dow = date.getDay();
    dayInfo = loc.Week.find((d: Day) => Number(d.Day) === dow);
  }

  if (!dayInfo) return null;

  const closed =
    (typeof dayInfo.Status === "string" && dayInfo.Status.toLowerCase() === "closed") ||
    !dayInfo.Hours ||
    dayInfo.Hours.length === 0;

  return closed ? null : dayInfo.Hours;
}

// Take in the data and return a mapping of location to operation times
export function getDailyLocationOperationTimes(
  data: OperationHoursData[],
  date: Date
): LocationOperatingTimes {
  const res: LocationOperatingTimes = {};

  for (const [shortName, aliases] of Object.entries(locationAliases)) {
    const loc = data.find((d) => aliases.includes(d.Name));
    if (!loc) {
      console.warn(`No data for any of: ${aliases.join(", ")}`);
      res[shortName] = null;
      continue;
    }

    res[shortName] = getOperatingHoursForDate(loc, date);
  }

  return res;
}


export const formatTime = (hour: number, minutes: number): string => {
  // Determine AM/PM
  const period = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  // Format the time as "hh:mm"
  const formattedTime = `${formattedHour}:${minutes.toString().padStart(2, "0")}${period}`;

  return formattedTime;
};


export const isLocationOpenNow = (operatingTimes: OperatingTime[] | null): boolean => {
  // No data so we assume it's closed
  if (!operatingTimes) {
    return false;
  }

  const now = new Date();
  return operatingTimes.some(({ StartHour, StartMinutes, EndHour, EndMinutes }) => {
    const start = new Date();
    const end = new Date();
    start.setHours(StartHour, StartMinutes, 0);
    end.setHours(EndHour, EndMinutes, 0);
    return now >= start && now < end;
  });
};

export const getCurrentTimeOfDayWithLocations = (
  locationOperationHours: LocationOperatingTimes
): { timeOfDay: string; openLocations: string[] } => {
  const timeOfDay = getCurrentTimeOfDay();

  const openLocations = Object.entries(locationOperationHours)
    .filter(([_, operatingTimes]) => isLocationOpenNow(operatingTimes))
    .map(([location]) => location);

  return { timeOfDay, openLocations };
};

