import type { DailyItem } from "@/types/ItemTypes";
import { foodItemQueryString } from "@/util/foodItemNav";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8081";

export interface FoodPhotoMeta {
  id: number;
  createdAt: string;
}

export function foodPhotoImageUrl(photoId: number): string {
  return `${API_URL}/api/foodPhotos/${photoId}/image`;
}

export async function fetchFoodPhotosForItem(item: DailyItem): Promise<FoodPhotoMeta[]> {
  const q = foodItemQueryString(item);
  const res = await fetch(`${API_URL}/api/foodPhotos?${q}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { photos?: FoodPhotoMeta[] };
  return Array.isArray(data.photos) ? data.photos : [];
}

export async function uploadFoodPhoto(item: DailyItem, file: File, token: string): Promise<number> {
  const fd = new FormData();
  fd.set("name", item.Name);
  fd.set("location", item.Location);
  fd.set("date", item.Date);
  fd.set("station", item.StationName);
  fd.set("meal", item.TimeOfDay);
  fd.append("photo", file);

  const res = await fetch(`${API_URL}/api/foodPhotos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { id?: number };
  if (typeof data.id !== "number") throw new Error("Invalid response");
  return data.id;
}
