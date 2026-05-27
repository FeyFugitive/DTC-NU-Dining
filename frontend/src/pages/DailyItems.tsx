import React, { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { postDisplayPreferences, postUserPreferences } from "../util/data"
import LocationItemGrid from "../components/locationGrid"
import { useAuth } from "../context/AuthProvider"
import AuthPopup from "../components/AuthPopup"
import {
  getCurrentTimeOfDayWithLocations,
  getDailyItemsForDate,
  getDailyLocationOperationTimes,
} from "../util/helper"
import { DailyItem, Item } from "../types/ItemTypes"
import ErrorPopup from "../components/error-popup"
import { useDataStore } from "@/store"
import { HeaderControls } from "../components/header-controls"
import SEO from "../components/SEO"
import { foodItemQueryString } from "@/util/foodItemNav"
import { filterDailyItemsBySearch } from "@/util/menuSearch"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const DEFAULT_LOCATIONS = ["Sargent", "Elder", "Allison", "Plex East", "Plex West"]

const DailyItems: React.FC = () => {
  const navigate = useNavigate()
  const [showPopup, setShowPopup] = useState(false)
  const { token, authLoading } = useAuth()

  const locations = DEFAULT_LOCATIONS
  const [visibleLocations, setVisibleLocations] = useState<string[]>(DEFAULT_LOCATIONS)
  const [visibleTimes, setVisibleTimes] = useState<string[]>(["Breakfast", "Lunch", "Dinner"])
  const [expandFolders, setExpandFolders] = useState(false)
  const timesOfDay = ["Breakfast", "Lunch", "Dinner"]
  const [showPreferences, setShowPreferences] = useState(false)
  const [availableFavorites, setAvailableFavorites] = useState<DailyItem[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [openLocations, setOpenLocations] = useState<string[]>([])
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const hasHydratedSignedInDisplayPrefs = useRef(false)

  const staticData = useDataStore((state) => state.UserDataResponse)
  const weeklyItems = staticData.weeklyItems
  const memoizedLocationHours = useMemo(
    () => getDailyLocationOperationTimes(staticData.locationOperationHours, selectedDate),
    [staticData.locationOperationHours, selectedDate]
  )
  const userPreferences = staticData.userPreferences
  const displayPreferences = staticData.displayPreferences
  const setUserPreferences = useDataStore((state) => state.setUserPreferences)
  const [dailyItems, setDailyItems] = useState<DailyItem[]>([])

  useEffect(() => {
    if (!authLoading && !token) {
      setVisibleLocations(DEFAULT_LOCATIONS)
      hasHydratedSignedInDisplayPrefs.current = false
    }
  }, [authLoading, token])

  useEffect(() => {
    if (!token || !displayPreferences || hasHydratedSignedInDisplayPrefs.current) {
      return
    }

    if (displayPreferences.hasSavedDisplayPreferences) {
      setVisibleLocations(displayPreferences.visibleLocations)
    } else {
      setVisibleLocations(DEFAULT_LOCATIONS)
    }

    hasHydratedSignedInDisplayPrefs.current = true
  }, [token, displayPreferences])

  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (memoizedLocationHours && Object.keys(memoizedLocationHours).length > 0) {
      const { timeOfDay, openLocations: open } = getCurrentTimeOfDayWithLocations(memoizedLocationHours)
      if (timeOfDay) {
        setVisibleTimes([timeOfDay])
      } else {
        setVisibleTimes(["Breakfast", "Lunch", "Dinner"])
      }

      if (open) {
        setOpenLocations(open)
      }
    }
  }, [memoizedLocationHours])

  useEffect(() => {
    if (weeklyItems && Object.keys(weeklyItems).length != 0) {
      const todaysItems = getDailyItemsForDate(weeklyItems, selectedDate)
      setDailyItems(todaysItems)
      setShowErrorPopup(!todaysItems?.length && !!memoizedLocationHours)
    }
  }, [weeklyItems, memoizedLocationHours, selectedDate])

  useEffect(() => {
    if (userPreferences && userPreferences.length > 0) {
      const userPrefNames = new Set(userPreferences)
      const favorites = dailyItems.filter((item) => userPrefNames.has(item.Name))
      setAvailableFavorites(favorites)
    } else {
      setAvailableFavorites([])
    }
  }, [dailyItems, userPreferences])

  const filteredItems = useMemo(
    () => filterDailyItemsBySearch(dailyItems, searchQuery),
    [dailyItems, searchQuery],
  )

  const displayedLocations = useMemo(() => {
    return visibleLocations
  }, [visibleLocations])

  const handleItemClick = (item: Item) => {
    if (!token) {
      setShowPopup(true)
      return
    }

    let tempPreferences = userPreferences
    let tempAvailable = availableFavorites
    const formattedItemName = item.Name.toLowerCase().trim()

    if (userPreferences) {
      if (userPreferences.some((i) => i.toLowerCase().trim() === formattedItemName)) {
        tempPreferences = userPreferences.filter((i) => i.toLowerCase().trim() !== formattedItemName)
      } else {
        tempPreferences = [...userPreferences, item.Name]
      }

      if (availableFavorites.some((i) => i.Name.toLowerCase().trim() === formattedItemName)) {
        tempAvailable = availableFavorites.filter((i) => i.Name.toLowerCase().trim() !== formattedItemName)
      } else {
        tempAvailable = [
          ...availableFavorites,
          ...dailyItems.filter((i) => i.Name.toLowerCase().trim() === formattedItemName),
        ]
      }

      setUserPreferences(tempPreferences)
      setAvailableFavorites(tempAvailable)
      postUserPreferences(tempPreferences, token as string)
    }
  }

  const persistVisibleLocations = (nextVisibleLocations: string[]) => {
    if (token) {
      postDisplayPreferences(nextVisibleLocations, token)
    }
  }

  const setVisibleLocationsAndPersist = (nextVisibleLocations: string[]) => {
    setVisibleLocations(nextVisibleLocations)
    persistVisibleLocations(nextVisibleLocations)
  }

  const togglePreferencesItem = (preferenceType: string, preference: string | boolean) => {
    if (preferenceType === "location") {
      setVisibleLocations((prev) => {
        const nextVisibleLocations = prev.includes(preference as string)
          ? prev.filter((loc) => loc !== preference)
          : [...prev, preference as string]
        persistVisibleLocations(nextVisibleLocations)
        return nextVisibleLocations
      })
    } else if (preferenceType === "time") {
      setVisibleTimes((prev) =>
        prev.includes(preference as string)
          ? prev.filter((t) => t !== preference)
          : [...prev, preference as string]
      )
    } else if (preferenceType === "expandFolders") {
      setExpandFolders(preference as boolean)
    }
  }

  const handleTogglePreferences = (show: boolean) => {
    setShowPreferences(show)
    if (!token) {
      sessionStorage.setItem("showPreferences", show.toString())
    }
  }

  return (
    <div className="space-y-3 pb-2 sm:space-y-4">
      <SEO
        title="NU Eats — Today's menus"
        description="Decide where and what to eat at Northwestern. Live-style hall status, menus, and hours for residential dining."
        keywords="Northwestern dining, campus dining, NU dining hall menu, meal exchange"
        url="https://nufood.me/"
      />

      <HeaderControls
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        setDailyItems={setDailyItems}
        showPreferences={showPreferences}
        preferencesState={{
          locations,
          visibleLocations,
          timesOfDay,
          visibleTimes,
          expandFolders,
        }}
        preferencesActions={{
          togglePreferencesItem,
          setVisibleLocations: setVisibleLocationsAndPersist,
          setShowPreferences: handleTogglePreferences,
        }}
        openLocations={openLocations}
      />

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search dining halls or food items…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 rounded-xl border-border bg-card pl-10 shadow-sm"
        />
      </div>

      <div>
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          All dining halls
        </h2>
        <LocationItemGrid
          state={{
            locationOperationHours: memoizedLocationHours,
            visibleLocations: displayedLocations,
            timesOfDay,
            visibleTimes,
            filteredItems,
            availableFavorites,
            expandFolders,
          }}
          actions={{
            handleItemClick,
            onOpenFoodItem: (item) =>
              navigate({ pathname: "/food", search: foodItemQueryString(item) }, { state: { item } }),
          }}
        />
      </div>

      {showPopup && <AuthPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />}
      <ErrorPopup isOpen={showErrorPopup} onClose={() => setShowErrorPopup(false)} />
    </div>
  )
}

export default DailyItems
