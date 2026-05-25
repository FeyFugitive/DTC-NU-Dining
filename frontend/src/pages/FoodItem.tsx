import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import AuthPopup from "@/components/AuthPopup";
import { useAuth } from "@/context/AuthProvider";
import { useDataStore } from "@/store";
import type { DailyItem } from "@/types/ItemTypes";
import { canonicalFoodItemKey, findDailyItemByParams } from "@/util/foodItemNav";
import { FoodItemPhotos } from "@/components/FoodItemPhotos";
import { postUserPreferences } from "@/util/data";

function subtitle(item: DailyItem): string {
  const hall = item.Location?.trim() || "Campus dining";
  const station = item.StationName?.trim();
  return station ? `${hall} — ${station}` : hall;
}

export default function FoodItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  const weeklyItems = useDataStore((s) => s.UserDataResponse.weeklyItems);
  const userPreferences = useDataStore((s) => s.UserDataResponse.userPreferences);
  const setUserPreferences = useDataStore((s) => s.setUserPreferences);

  const stateItem = (location.state as { item?: DailyItem } | null)?.item;
  /** Prefer the row from `weeklyItems` + URL params whenever possible so the dish identity (and Firestore photo doc id) matches after refresh; `location.state` alone can differ slightly from the pool row. */
  const item = useMemo(() => {
    const fromParams = findDailyItemByParams(weeklyItems, searchParams);
    if (fromParams) return fromParams;
    if (stateItem?.Name) return stateItem;
    return undefined;
  }, [stateItem, weeklyItems, searchParams]);

  const itemKey = item ? canonicalFoodItemKey(item) : "";

  const isFavorite = useMemo(() => {
    if (!userPreferences || !item) return false;
    const n = item.Name.toLowerCase().trim();
    return userPreferences.some((p) => p.toLowerCase().trim() === n);
  }, [userPreferences, item]);

  function toggleFavorite() {
    if (!item) return;
    if (!token) {
      setShowPopup(true);
      return;
    }
    if (!userPreferences) return;
    const formatted = item.Name.toLowerCase().trim();
    let next = userPreferences;
    if (userPreferences.some((i) => i.toLowerCase().trim() === formatted)) {
      next = userPreferences.filter((i) => i.toLowerCase().trim() !== formatted);
    } else {
      next = [...userPreferences, item.Name];
    }
    setUserPreferences(next);
    void postUserPreferences(next, token);
  }

  const nutrientLines = item?.nutrients?.length
    ? item.nutrients
    : item &&
        (item.calories || item.protein || item.carbs || item.fat)
      ? [
          ...(item.calories ? [{ name: "Calories", value: item.calories }] : []),
          ...(item.protein ? [{ name: "Protein (g)", value: item.protein }] : []),
          ...(item.carbs ? [{ name: "Total Carbohydrates (g)", value: item.carbs }] : []),
          ...(item.fat ? [{ name: "Total Fat (g)", value: item.fat }] : []),
        ]
      : [];

  const cardClass =
    "rounded-2xl border border-border/80 bg-card p-4 shadow-sm";

  if (!item) {
    return (
      <div className="space-y-4 pb-6">
        <SEO title="NU Eats — Item" />
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Back
        </button>
        <p className="text-sm text-muted-foreground">
          This menu item could not be loaded. Open it again from today&apos;s menu or resync data.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10">
      <SEO title={`NU Eats — ${item.Name}`} />

      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="shrink-0 rounded-full border border-border/80 bg-card px-3 py-1.5 text-sm font-semibold hover:bg-accent"
        >
          Back
        </button>
        <button
          type="button"
          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          onClick={toggleFavorite}
          className="rounded-full border border-border/80 bg-card p-2 text-xl leading-none hover:bg-accent"
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{item.Name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle(item)}</p>
        {item.TimeOfDay && (
          <p className="mt-0.5 text-xs text-muted-foreground">{item.TimeOfDay}</p>
        )}
      </div>

      <section className={cardClass}>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Nutrition
        </p>
        {item.portion && (
          <p className="mb-3 text-sm text-foreground">
            <span className="text-muted-foreground">Portion:</span> {item.portion}
          </p>
        )}
        {nutrientLines.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {nutrientLines.map((n, i) => (
              <li
                key={`${n.name}-${i}`}
                className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-muted-foreground">{n.name}</span>
                <span className="font-medium tabular-nums text-foreground">{n.value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No nutrition facts listed for this item.</p>
        )}
      </section>

      <section className={cardClass}>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Ingredients
        </p>
        {item.ingredients?.trim() ? (
          <>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{item.ingredients}</p>
            {item.ingredients.includes("^") && (
              <p className="mt-3 text-xs italic leading-snug text-muted-foreground">
                Disclaimer: ^ These items contain additional ingredients. If you have questions, please ask a
                manager.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ingredients aren&apos;t available from the menu feed for this item yet.
          </p>
        )}
      </section>

      <FoodItemPhotos
        key={itemKey || searchParams.toString()}
        item={item}
        searchParams={searchParams}
        onNeedAuth={() => setShowPopup(true)}
      />

      {showPopup && <AuthPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />}
    </div>
  );
}
