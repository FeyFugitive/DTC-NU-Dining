import type { DailyItem } from "@/types/ItemTypes";

function normalizeTokens(raw: string): string[] {
  return raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/** Build one searchable blob per menu row. */
function dailyItemHaystack(item: DailyItem): string {
  return [item.Name, item.Location, item.StationName, item.Description ?? ""].join(" ").toLowerCase();
}

/**
 * Token-wise substring search: every word you type must appear somewhere in the combined
 * name + hall + station + description (all matches are literal substrings, case-insensitive).
 * Avoids loose fuzzy matches (e.g. "grape" no longer surfaces unrelated dishes).
 */
export function filterDailyItemsBySearch(items: DailyItem[], rawQuery: string): DailyItem[] {
  const tokens = normalizeTokens(rawQuery);
  if (tokens.length === 0) return items;

  return items.filter((item) => {
    const hay = dailyItemHaystack(item);
    return tokens.every((t) => hay.includes(t));
  });
}

/** All-items list: same behavior on dish names only. */
export function filterItemsByNameOnly<T extends { Name: string }>(items: T[], rawQuery: string): T[] {
  const tokens = normalizeTokens(rawQuery);
  if (tokens.length === 0) return items;

  return items.filter((item) => {
    const name = item.Name.toLowerCase();
    return tokens.every((t) => name.includes(t));
  });
}
