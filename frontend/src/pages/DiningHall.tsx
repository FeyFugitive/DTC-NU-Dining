import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import { DiningHallHomeCard } from "@/components/dining/DiningHallHomeCard";
import DailyItemAccordion from "@/components/DailyItemAccordion";
import {
  getCurrentTimeOfDay,
  getDailyItemsForDate,
  getDailyLocationOperationTimes,
  normalizeHallKey,
} from "@/util/helper";
import { useDataStore } from "@/store";
import { useAuth } from "@/context/AuthProvider";
import AuthPopup from "@/components/AuthPopup";
import type { DailyItem } from "@/types/ItemTypes";
import { postUserPreferences } from "@/util/data";
import { foodItemQueryString } from "@/util/foodItemNav";

export default function DiningHall() {
  const navigate = useNavigate();
  const { locationName: locationNameParam } = useParams<{ locationName: string }>();

  const locationName = locationNameParam ? decodeURIComponent(locationNameParam) : "";

  const [showPopup, setShowPopup] = useState(false);
  const { token } = useAuth();

  const staticData = useDataStore((s) => s.UserDataResponse);
  const menuDataUpdatedAt = useDataStore((s) => s.menuDataUpdatedAt);
  const setUserPreferences = useDataStore((s) => s.setUserPreferences);

  const updatedLabel = menuDataUpdatedAt
    ? new Date(menuDataUpdatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  const memoizedLocationHours = useMemo(() => {
    if (!staticData.locationOperationHours || staticData.locationOperationHours.length === 0) return {};
    return getDailyLocationOperationTimes(staticData.locationOperationHours, new Date());
  }, [staticData.locationOperationHours]);

  const operatingTimes = (memoizedLocationHours as any)[locationName] as
    | (ReturnType<typeof getDailyLocationOperationTimes>[string])
    | undefined;

  const todaysItemsForHall = useMemo<DailyItem[]>(() => {
    const items = getDailyItemsForDate(staticData.weeklyItems, new Date());
    return items.filter((i) => normalizeHallKey(i.Location) === locationName);
  }, [staticData.weeklyItems, locationName]);

  const userPreferences = staticData.userPreferences;

  const availableFavorites = useMemo<DailyItem[]>(() => {
    if (!userPreferences || userPreferences.length === 0) return [];
    const favNames = new Set(userPreferences);
    return todaysItemsForHall.filter((item) => favNames.has(item.Name));
  }, [todaysItemsForHall, userPreferences]);

  const favoritesHereCount = useMemo(() => {
    return new Set(availableFavorites.map((f) => f.Name)).size;
  }, [availableFavorites]);

  const hasMenuItems = todaysItemsForHall.length > 0;

  const handleItemClick = (item: DailyItem) => {
    if (!token) {
      setShowPopup(true);
      return;
    }

    if (!userPreferences) return;

    let tempPreferences = userPreferences;
    const formattedItemName = item.Name.toLowerCase().trim();

    if (userPreferences.some((i) => i.toLowerCase().trim() === formattedItemName)) {
      tempPreferences = userPreferences.filter((i) => i.toLowerCase().trim() !== formattedItemName);
    } else {
      tempPreferences = [...userPreferences, item.Name];
    }

    setUserPreferences(tempPreferences);
    // Persisting user preferences happens via the backend utility.
    void postUserPreferences(tempPreferences, token);
  };

  const mealOrderPreferred = ["Breakfast", "Lunch", "Dinner"];
  const periodsOrdered = useMemo(() => {
    const inData = new Set(todaysItemsForHall.map((i) => i.TimeOfDay));
    const preferredFirst = mealOrderPreferred.filter((m) => inData.has(m));
    const rest = [...inData]
      .filter((m) => !mealOrderPreferred.includes(m))
      .sort((a, b) => a.localeCompare(b));
    const base = [...preferredFirst, ...rest];
    const currentMeal = getCurrentTimeOfDay();
    if (currentMeal && base.includes(currentMeal)) {
      return [currentMeal, ...base.filter((m) => m !== currentMeal)];
    }
    return base;
  }, [todaysItemsForHall]);

  if (!locationName) {
    return (
      <div className="space-y-4 pb-4">
        <SEO title="Campus Dining — Hall" />
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Back
        </button>
        <p className="text-sm text-muted-foreground">No hall selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <SEO
        title={`Campus Dining — ${locationName}`}
        description="Live-style dining hall menu with stations by meal time."
        url={`https://nufood.me/hall/${encodeURIComponent(locationName)}`}
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border/80 bg-card px-3 py-1.5 text-sm font-semibold hover:bg-accent"
        >
          Back
        </button>
        {updatedLabel && <p className="text-xs text-muted-foreground">Synced: {updatedLabel}</p>}
      </div>

      <DiningHallHomeCard
        locationName={locationName}
        operatingTimes={operatingTimes}
        favoritesHereCount={favoritesHereCount}
        hasMenuItems={hasMenuItems}
      >
        <div className="flex flex-col gap-3">
          {periodsOrdered.map((timeOfDay) => {
            const itemsByTimeOfDay = todaysItemsForHall.filter((item) => item.TimeOfDay === timeOfDay);
            const filteredAvailableFavorites = availableFavorites.filter((f) => f.TimeOfDay === timeOfDay);

            if (itemsByTimeOfDay.length === 0) return null;

            return (
              <div key={timeOfDay} className="mb-3 last:mb-0">
                <h3 className="mb-2 border-b border-border/50 pb-1 text-sm font-semibold text-foreground">
                  {timeOfDay}
                </h3>
                <DailyItemAccordion
                  items={itemsByTimeOfDay}
                  availableFavorites={filteredAvailableFavorites}
                  handleItemClick={handleItemClick}
                  onOpenItem={(item) =>
                    navigate({ pathname: "/food", search: foodItemQueryString(item) }, { state: { item } })
                  }
                  expandFolders={false}
                />
              </div>
            );
          })}

          {!hasMenuItems && (
            <p className="px-1 py-3 text-center text-sm text-muted-foreground">
              No menu items listed for this hall today.
            </p>
          )}
        </div>
      </DiningHallHomeCard>

      <AuthPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />
    </div>
  );
}

