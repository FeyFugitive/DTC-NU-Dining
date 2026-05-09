import { OperationHoursData } from "./OperationTypes";

/** Single nutrient row from Dine-on-Campus-style menus (`nutrients` JSON array). */
export interface MenuNutrient {
  name: string;
  value: string;
}

export interface DailyItem {
  Name: string;
  Description: string;
  Location: string;
  StationName: string;
  Date: string;
  TimeOfDay: string;
  portion?: string;
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
  ingredients?: string;
  nutrients?: MenuNutrient[];
  /** Upstream menu row id (optional; used when enriching nutrition from detail APIs). */
  menuItemId?: string;
}

export interface Item {
  Name: string;
}

export interface FavoriteItem extends Item { }

export interface WeeklyItemsMap {
  [key: string]: DailyItem[];
}

// Nutrition goals interface
export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DisplayPreferences {
  visibleLocations: string[];
  hasSavedDisplayPreferences: boolean;
}

// Base interface for shared properties
interface BaseDataResponse {
  allItems: string[];
  weeklyItems: WeeklyItemsMap;
  locationOperationHours: OperationHoursData[];
}

// Interface for general data without user-specific data
export interface GeneralDataResponse extends BaseDataResponse { }

// Interface for data with user preferences
export interface UserDataResponse extends BaseDataResponse {
  userPreferences: string[] | null;
  mailing: boolean;
  nutritionGoals: NutritionGoals;
  displayPreferences: DisplayPreferences | null;
}
