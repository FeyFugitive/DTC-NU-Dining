import { useMemo } from "react"
import { Link } from "react-router-dom"
import { MapPin, Minus, Star, UtensilsCrossed } from "lucide-react"
import { postUserPreferences } from "../util/data"
import { useAuth } from "../context/AuthProvider"
import { useDataStore } from "@/store"
import SEO from "../components/SEO"
import type { DailyItem } from "../types/ItemTypes"
import { getDailyItemsForDate, normalizeHallKey } from "@/util/helper"

function matchesFavoriteName(item: DailyItem, name: string): boolean {
  return item.Name.toLowerCase().trim() === name.toLowerCase().trim()
}

function slotLabel(item: DailyItem): string {
  const hall = normalizeHallKey(item.Location)
  const meal = item.TimeOfDay?.trim() || "Meal"
  const station = item.StationName?.trim()
  return station ? `${hall} · ${meal} · ${station}` : `${hall} · ${meal}`
}

export default function Preferences() {
  const userPreferences = useDataStore((state) => state.UserDataResponse.userPreferences)
  const weeklyItems = useDataStore((state) => state.UserDataResponse.weeklyItems)
  const setUserPreferences = useDataStore((state) => state.setUserPreferences)
  const { token } = useAuth()

  const rows = useMemo(() => {
    if (!userPreferences?.length) return []
    const todayItems = getDailyItemsForDate(weeklyItems, new Date())
    const flatMenu = weeklyItems ? (Object.values(weeklyItems).flat() as DailyItem[]) : []

    return userPreferences.map((name) => {
      const todayMatches = todayItems.filter((i) => matchesFavoriteName(i, name))
      const weekMatches = flatMenu.filter((i) => matchesFavoriteName(i, name))
      const slotsToday = [...new Set(todayMatches.map(slotLabel))]
      const hallsToday = [...new Set(todayMatches.map((i) => normalizeHallKey(i.Location)))]
      const hallsWeek = [...new Set(weekMatches.map((i) => normalizeHallKey(i.Location)))]

      return {
        name,
        slotsToday,
        hallsToday,
        hallsWeek,
        onMenuToday: todayMatches.length > 0,
        seenThisWeek: weekMatches.length > 0,
      }
    })
  }, [userPreferences, weeklyItems])

  const removeFavorite = (name: string) => {
    if (!userPreferences || !token) return
    const key = name.toLowerCase().trim()
    const next = userPreferences.filter((i) => i.toLowerCase().trim() !== key)
    setUserPreferences(next)
    void postUserPreferences(next, token)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-3 pb-28 pt-2 text-foreground sm:px-4">
      <SEO
        title="Favorites & saved items"
        description="Manage your favorite Northwestern University dining items."
        keywords="Northwestern dining favorites, campus dining favorites"
        url="https://nufood.me/preferences"
      />

      <h1 className="mb-1 text-xl font-bold tracking-tight sm:text-2xl">Your favorites</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Saved names are matched to today&apos;s menus when possible. Tap a hall to open its menu.
      </p>

      {userPreferences && userPreferences.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.name}
              className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm"
            >
              <div className="flex items-start gap-2 p-3 sm:p-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-chart-5 text-chart-5" aria-hidden />
                    <p className="text-[15px] font-semibold leading-snug text-foreground">{row.name}</p>
                  </div>

                  {row.onMenuToday ? (
                    <div className="space-y-1.5 pl-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        On today&apos;s menu
                      </p>
                      <ul className="space-y-1">
                        {row.slotsToday.map((slot) => (
                          <li
                            key={slot}
                            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
                          >
                            <UtensilsCrossed className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                            <span>{slot}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {row.hallsToday.map((hall) => (
                          <Link
                            key={hall}
                            to={`/hall/${encodeURIComponent(hall)}`}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                          >
                            <MapPin className="h-3 w-3" aria-hidden />
                            {hall}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : row.seenThisWeek ? (
                    <div className="space-y-1 pl-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Not on today&apos;s menus
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Listed elsewhere in this week&apos;s data:&nbsp;
                        <span className="font-medium text-foreground">{row.hallsWeek.join(", ")}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="pl-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Not in current menu window
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No dish with this exact name appears in loaded menus. Names can differ slightly by hall — save
                        again from the hall menu if needed.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${row.name} from favorites`}
                  disabled={!token}
                  onClick={() => removeFavorite(row.name)}
                  className="mt-0.5 shrink-0 rounded-lg border border-transparent p-2 text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  <Minus className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          You have no favorites yet. Sign in and tap the star next to items on the home or hall menus.
        </p>
      )}
    </div>
  )
}
