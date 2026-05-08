import { cn } from "@/lib/utils";

export type HomeFilterId = "openNow" | "nearby" | "mealExchange" | "lowWait";

const FILTERS: { id: HomeFilterId; label: string; soon?: boolean }[] = [
  { id: "openNow", label: "Open now" },
  { id: "nearby", label: "Nearby", soon: true },
  { id: "mealExchange", label: "Meal Exchange", soon: true },
  { id: "lowWait", label: "Low wait", soon: true },
];

interface HomeFilterChipsProps {
  activeOpenNow: boolean;
  onOpenNowChange: (on: boolean) => void;
}

export function HomeFilterChips({ activeOpenNow, onOpenNowChange }: HomeFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FILTERS.map(({ id, label, soon }) => {
        const isActive = id === "openNow" ? activeOpenNow : false;
        const isSoon = !!soon;

        return (
          <button
            key={id}
            type="button"
            disabled={isSoon}
            title={isSoon ? "Coming soon" : undefined}
            onClick={() => {
              if (id === "openNow") {
                onOpenNowChange(!activeOpenNow);
              }
            }}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              isSoon &&
                "cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground opacity-70",
              !isSoon &&
                !isActive &&
                "border-border bg-card text-foreground hover:bg-accent/80",
              !isSoon && isActive && "border-primary bg-primary text-primary-foreground shadow-sm"
            )}
          >
            {label}
            {isSoon ? " · soon" : ""}
          </button>
        );
      })}
    </div>
  );
}
