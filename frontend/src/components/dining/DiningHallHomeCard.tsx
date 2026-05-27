import * as React from "react";
import type { Hour } from "@/types/OperationTypes";
import { useOperatingStatus } from "@/hooks/useOperatingStatus";
import type { CrowdLevel, DiningHallMeta, RelativeBusyness } from "@/lib/diningHallMeta";
import { getDiningHallMeta, relativeBusynessLabel } from "@/lib/diningHallMeta";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

function crowdBadgeClasses(level: CrowdLevel): string {
  switch (level) {
    case "low":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case "moderate":
      return "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100";
    case "busy":
      return "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100";
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
}

function crowdLabel(level: CrowdLevel): string {
  switch (level) {
    case "low":
      return "Not too busy";
    case "moderate":
      return "A little busy";
    case "busy":
      return "Busy";
    default:
      return "—";
  }
}

function relativeBusynessBadgeClasses(level: RelativeBusyness): string {
  switch (level) {
    case "quieter_than_usual":
      return "border-emerald-500/35 bg-emerald-500/8 text-emerald-900 dark:text-emerald-100";
    case "about_usual":
      return "border-border bg-muted/50 text-foreground";
    case "busier_than_usual":
      return "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100";
    case "much_busier_than_usual":
      return "border-red-500/40 bg-red-500/10 text-red-950 dark:text-red-100";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

export interface DiningHallHomeCardProps {
  locationName: string;
  operatingTimes: Hour[] | string | null | undefined;
  favoritesHereCount: number;
  hasMenuItems: boolean;
  hallHref?: string;
  className?: string;
  children: React.ReactNode;
}

export function DiningHallHomeCard({
  locationName,
  operatingTimes,
  favoritesHereCount,
  hasMenuItems,
  hallHref,
  className,
  children,
}: DiningHallHomeCardProps) {
  const { isOpen, summary, isInvalid } = useOperatingStatus(operatingTimes);
  const meta = getDiningHallMeta(locationName);

  const paymentLabels: { key: keyof DiningHallMeta["payments"]; label: string }[] = [
    { key: "mealExchange", label: "Meal Exchange" },
    { key: "diningDollars", label: "Dining Dollars" },
    { key: "credit", label: "Credit" },
  ];

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/80 bg-card text-card-foreground",
        "shadow-sm shadow-black/[0.06] dark:shadow-black/25",
        "transition-shadow duration-200 hover:shadow-md",
        !hasMenuItems && "opacity-90",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2.5 sm:px-4">
        <Badge
          className={cn(
            "shrink-0 border font-semibold tracking-tight",
            isInvalid
              ? "border-amber-500/50 bg-amber-500/15 text-amber-900 dark:text-amber-100"
              : isOpen
                ? "border-emerald-500/45 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100"
                : "border-border bg-muted text-muted-foreground"
          )}
        >
          {isInvalid ? "Hours unknown" : isOpen ? "Open" : "Closed"}
        </Badge>
        <Badge
          variant="outline"
          className={cn("shrink-0 gap-1 border font-medium", crowdBadgeClasses(meta.crowdLevel))}
        >
          <Users className="h-3 w-3 opacity-80" aria-hidden />
          Crowd: {crowdLabel(meta.crowdLevel)}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "min-w-0 max-w-full shrink font-medium",
            relativeBusynessBadgeClasses(meta.relativeBusyness)
          )}
        >
          <span className="truncate">{relativeBusynessLabel(meta.relativeBusyness)}</span>
        </Badge>
      </div>

      <div className="px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex gap-3">
          {hallHref ? (
            <Link to={hallHref} className="flex flex-1 items-start gap-3 no-underline hover:opacity-95">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted shadow-inner">
                <img
                  src={meta.thumbnailSrc}
                  alt=""
                  className="h-full w-full object-cover"
                  width={56}
                  height={56}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold leading-tight tracking-tight sm:text-lg">
                  {locationName}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{meta.subtitle}</p>
                {favoritesHereCount > 0 && (
                  <p className="mt-1 text-xs font-medium text-primary">
                    {favoritesHereCount} saved favorite{favoritesHereCount !== 1 ? "s" : ""} available here today
                  </p>
                )}
              </div>
            </Link>
          ) : (
            <>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted shadow-inner">
                <img
                  src={meta.thumbnailSrc}
                  alt=""
                  className="h-full w-full object-cover"
                  width={56}
                  height={56}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold leading-tight tracking-tight sm:text-lg">
                  {locationName}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{meta.subtitle}</p>
                {favoritesHereCount > 0 && (
                  <p className="mt-1 text-xs font-medium text-primary">
                    {favoritesHereCount} saved favorite{favoritesHereCount !== 1 ? "s" : ""} available here today
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {paymentLabels
            .filter(({ key }) => meta.payments[key])
            .map(({ key, label }) => (
              <span
                key={key}
                className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary"
              >
                {label}
              </span>
            ))}
        </div>

        <p className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">{summary}</p>
      </div>

      <div className="border-t border-border/60 px-2 pb-2 pt-1 sm:px-3">{children}</div>
    </article>
  );
}
