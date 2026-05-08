import React, { useMemo } from "react";
import DailyItemAccordion from "./DailyItemAccordion";
import { LocationOperatingTimes } from "../types/OperationTypes";
import { DailyItem } from "../types/ItemTypes";
import { DiningHallHomeCard } from "./dining/DiningHallHomeCard";
import { normalizeHallKey } from "@/util/helper";

interface LocationState {
  locationOperationHours: LocationOperatingTimes | undefined;
  visibleLocations: string[];
  timesOfDay: string[];
  visibleTimes: string[];
  filteredItems: DailyItem[];
  availableFavorites: DailyItem[];
  expandFolders: boolean;
}

interface LocationActions {
  handleItemClick: (item: DailyItem) => void;
}

interface LocationProps {
  state: LocationState;
  actions: LocationActions;
}

const LocationItemGrid: React.FC<LocationProps> = ({ state, actions }) => {
  const {
    locationOperationHours,
    visibleLocations,
    timesOfDay,
    visibleTimes,
    filteredItems,
    availableFavorites,
    expandFolders,
  } = state;

  const { handleItemClick } = actions;

  const favoritesCountByLocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const loc of visibleLocations) {
      const names = new Set<string>();
      for (const fav of availableFavorites) {
        if (normalizeHallKey(fav.Location) === loc) {
          names.add(fav.Name);
        }
      }
      map.set(loc, names.size);
    }
    return map;
  }, [availableFavorites, visibleLocations]);

  return (
    <div className="flex flex-col gap-3">
      {visibleLocations.length > 0 &&
        visibleLocations
          .sort((a, b) => {
            const aHasItems = timesOfDay.some((timeOfDay) =>
              filteredItems.some(
                (item) => normalizeHallKey(item.Location) === a && item.TimeOfDay === timeOfDay
              )
            );
            const bHasItems = timesOfDay.some((timeOfDay) =>
              filteredItems.some(
                (item) => normalizeHallKey(item.Location) === b && item.TimeOfDay === timeOfDay
              )
            );
            if (aHasItems && !bHasItems) return -1;
            if (!aHasItems && bHasItems) return 1;
            return 0;
          })
          .map((location) => {
            const itemsHere = filteredItems.filter((item) => normalizeHallKey(item.Location) === location);

            const preferredPeriods = timesOfDay.filter((timeOfDay) => visibleTimes.includes(timeOfDay));
            const hasMatchingPreferred = preferredPeriods.some((timeOfDay) =>
              itemsHere.some((item) => item.TimeOfDay === timeOfDay)
            );
            const periodsToRender = hasMatchingPreferred
              ? preferredPeriods.filter((timeOfDay) =>
                  itemsHere.some((item) => item.TimeOfDay === timeOfDay)
                )
              : [...new Set(itemsHere.map((item) => item.TimeOfDay))].sort((x, y) =>
                  x.localeCompare(y)
                );

            const hasItems = itemsHere.length > 0;

            const hours = locationOperationHours?.[location];

            return (
              <DiningHallHomeCard
                key={location}
                locationName={location}
                operatingTimes={hours}
                favoritesHereCount={favoritesCountByLocation.get(location) ?? 0}
                hasMenuItems={hasItems}
                hallHref={`/hall/${encodeURIComponent(location)}`}
              >
                {periodsToRender.map((timeOfDay) => {
                  const itemsByTimeOfDay = filteredItems.filter(
                    (item) => normalizeHallKey(item.Location) === location && item.TimeOfDay === timeOfDay
                  );

                  const filteredAvailableFavorites = Array.from(
                    new Map(
                      availableFavorites
                        .filter(
                          (f) => normalizeHallKey(f.Location) === location && f.TimeOfDay === timeOfDay
                        )
                        .map((f) => [f.Name, f])
                    ).values()
                  );

                  return (
                    itemsByTimeOfDay.length > 0 && (
                      <div key={timeOfDay} className="mb-3 last:mb-0">
                        <h3 className="mb-2 border-b border-border/50 pb-1 text-sm font-semibold text-foreground">
                          {timeOfDay}
                        </h3>
                        <DailyItemAccordion
                          items={itemsByTimeOfDay}
                          availableFavorites={filteredAvailableFavorites}
                          handleItemClick={handleItemClick}
                          expandFolders={expandFolders}
                        />
                      </div>
                    )
                  );
                })}

                {!hasItems && (
                  <p className="px-1 py-3 text-center text-sm text-muted-foreground">
                    No menu items listed for the selected meals.
                  </p>
                )}
              </DiningHallHomeCard>
            );
          })}
    </div>
  );
};

export default LocationItemGrid;
