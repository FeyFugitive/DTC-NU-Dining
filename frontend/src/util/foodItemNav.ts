import type { DailyItem, WeeklyItemsMap } from "@/types/ItemTypes";
import { getDailyItemsForDate, normalizeHallKey } from "@/util/helper";

/** Stable query string for `/food` so refresh can resolve the row from weekly menus. */
export function foodItemQueryString(item: DailyItem): string {
  const p = new URLSearchParams();
  p.set("name", item.Name);
  p.set("location", item.Location);
  p.set("date", item.Date);
  p.set("station", item.StationName);
  p.set("meal", item.TimeOfDay);
  return p.toString();
}

export function parseMenuDateKey(dateStr: string): Date {
  const parts = dateStr.split("-").map((x) => parseInt(x, 10));
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
}

export function findDailyItemByParams(
  weeklyItems: WeeklyItemsMap | null | undefined,
  params: URLSearchParams,
): DailyItem | undefined {
  const name = params.get("name");
  const location = params.get("location");
  const date = params.get("date");
  const station = params.get("station");
  const meal = params.get("meal");
  if (!name || !location || !date || !station || !meal || !weeklyItems) return undefined;

  const pool = getDailyItemsForDate(weeklyItems, parseMenuDateKey(date));
  const locKey = normalizeHallKey(location);
  return pool.find(
    (i) =>
      i.Name === name &&
      normalizeHallKey(i.Location) === locKey &&
      i.Date === date &&
      i.StationName === station &&
      i.TimeOfDay === meal,
  );
}
