import type { DailyItem, WeeklyItemsMap } from "@/types/ItemTypes";
import { getDailyItemsForDate, menuItemDateKey, normalizeHallKey } from "@/util/helper";

/** Normalize any menu date string to YYYY-MM-DD (URL param or API `Date` field). */
export function normalizeMenuDateParam(date: string): string {
  const raw = date?.trim() ?? "";
  if (!raw) return "";
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  }
  return raw.slice(0, 10);
}

/** Canonical identity from explicit fields (stable across refresh when used with `/food` query params). */
export function canonicalFoodItemKeyFromParts(
  name: string,
  location: string,
  date: string,
  station: string,
  meal: string,
): string {
  return [
    normalizeMenuDateParam(date),
    normalizeHallKey(location),
    meal.trim(),
    station.trim(),
    name.trim(),
  ].join("|");
}

/** Canonical identity for a menu row (matches findDailyItemByParams logic). */
export function canonicalFoodItemKey(item: DailyItem): string {
  const date = menuItemDateKey(item) ?? normalizeMenuDateParam(item.Date ?? "");
  return canonicalFoodItemKeyFromParts(item.Name, item.Location, date, item.StationName, item.TimeOfDay);
}

/** Build slot key from `/food` URL search params when present. */
export function canonicalFoodItemKeyFromSearchParams(params: URLSearchParams): string | null {
  const name = params.get("name");
  const location = params.get("location");
  const date = params.get("date");
  const station = params.get("station");
  const meal = params.get("meal");
  if (!name || !location || !date || !station || !meal) return null;
  return canonicalFoodItemKeyFromParts(name, location, date, station, meal);
}

/** Firestore document id for shared photos on this dish slot (SHA-256 hex, URL-safe). */
export async function foodItemPhotoDocIdFromSlotKey(slotKey: string): Promise<string> {
  const enc = new TextEncoder().encode(slotKey);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Firestore document id for shared photos on this dish slot (SHA-256 hex, URL-safe). */
export async function foodItemPhotoDocId(item: DailyItem): Promise<string> {
  return foodItemPhotoDocIdFromSlotKey(canonicalFoodItemKey(item));
}

export async function foodItemPhotoDocIdFromSearchParams(params: URLSearchParams): Promise<string | null> {
  const key = canonicalFoodItemKeyFromSearchParams(params);
  if (!key) return null;
  return foodItemPhotoDocIdFromSlotKey(key);
}

export function foodItemQueryString(item: DailyItem): string {
  const p = new URLSearchParams();
  const dateKey = menuItemDateKey(item) ?? normalizeMenuDateParam(item.Date ?? "");
  p.set("name", item.Name);
  p.set("location", item.Location);
  p.set("date", dateKey);
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

  const dateKey = normalizeMenuDateParam(date);
  const pool = getDailyItemsForDate(weeklyItems, parseMenuDateKey(dateKey));
  const locKey = normalizeHallKey(location);
  return pool.find(
    (i) =>
      i.Name === name &&
      normalizeHallKey(i.Location) === locKey &&
      (menuItemDateKey(i) ?? normalizeMenuDateParam(i.Date ?? "")) === dateKey &&
      i.StationName === station &&
      i.TimeOfDay === meal,
  );
}
