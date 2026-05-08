import { format } from "date-fns"
import PreferencesDialog from "./preferences"
import { DatePicker } from "@/components/calendar"

interface HeaderControlsProps {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  setDailyItems: (items: any) => void
  showPreferences: boolean
  preferencesState: {
    locations: string[]
    visibleLocations: string[]
    timesOfDay: string[]
    visibleTimes: string[]
    expandFolders: boolean
  }
  preferencesActions: {
    togglePreferencesItem: (type: string, item: any) => void
    setVisibleLocations: (locations: string[]) => void
    setShowPreferences: (show: boolean) => void
  }
  openLocations: string[]
}

export function HeaderControls({
  selectedDate,
  setSelectedDate,
  setDailyItems,
  showPreferences,
  preferencesState,
  preferencesActions,
  openLocations,
}: HeaderControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Today
          </p>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {format(selectedDate, "EEEE, MMM d")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {openLocations.length > 0
              ? `${openLocations.length} hall${openLocations.length !== 1 ? "s" : ""} open right now`
              : "No residential halls open for this period"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DatePicker
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setDailyItems={setDailyItems}
          />
        </div>
      </div>
      <PreferencesDialog
        showPreferences={showPreferences}
        state={preferencesState}
        actions={preferencesActions}
      />
    </div>
  )
}
