import { useEffect, useState } from "react";
import type { Hour } from "@/types/OperationTypes";

const formatTimeToAmPm = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

export type OperatingStatusSnapshot = {
  isOpen: boolean;
  summary: string;
  isInvalid: boolean;
};

export function computeOperatingStatus(
  operatingTimes: Hour[] | string | null | undefined,
  now: Date
): OperatingStatusSnapshot {
  if (!operatingTimes || (typeof operatingTimes === "string" && operatingTimes === "closed")) {
    return { isOpen: false, summary: "Closed", isInvalid: false };
  }
  if (typeof operatingTimes === "string") {
    return { isOpen: false, summary: "Invalid hours data", isInvalid: true };
  }

  let nextOpenTime: Date | null = null;
  let nextCloseTime: Date | null = null;
  let currentlyOpen = false;

  for (const { StartHour, StartMinutes, EndHour, EndMinutes } of operatingTimes) {
    const start = new Date();
    const end = new Date();
    const startHour = typeof StartHour === "string" ? parseInt(StartHour, 10) : StartHour;
    const startMinutes = typeof StartMinutes === "string" ? parseInt(StartMinutes, 10) : StartMinutes;
    const endHour = typeof EndHour === "string" ? parseInt(EndHour, 10) : EndHour;
    const endMinutes = typeof EndMinutes === "string" ? parseInt(EndMinutes, 10) : EndMinutes;

    start.setHours(startHour, startMinutes, 0);
    end.setHours(endHour, endMinutes, 0);

    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1);
    }

    if (now >= start && now < end) {
      currentlyOpen = true;
      if (!nextCloseTime || end < nextCloseTime) {
        nextCloseTime = end;
      }
    } else if (now < start) {
      if (!nextOpenTime || start < nextOpenTime) {
        nextOpenTime = start;
      }
    }
  }

  if (currentlyOpen) {
    if (nextCloseTime) {
      const diffMs = nextCloseTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const summary =
        diffMins < 60
          ? `Closes in ${diffMins} minute${diffMins !== 1 ? "s" : ""}`
          : `Open until ${formatTimeToAmPm(nextCloseTime)}`;
      return { isOpen: true, summary, isInvalid: false };
    }
    return { isOpen: true, summary: "Open", isInvalid: false };
  }

  if (nextOpenTime) {
    const diffMs = nextOpenTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const summary =
      diffMins < 60
        ? `Opens in ${diffMins} minute${diffMins !== 1 ? "s" : ""}`
        : `Closed · opens ${formatTimeToAmPm(nextOpenTime)}`;
    return { isOpen: false, summary, isInvalid: false };
  }

  return { isOpen: false, summary: "Closed", isInvalid: false };
}

export function useOperatingStatus(operatingTimes: Hour[] | string | null | undefined) {
  const [snapshot, setSnapshot] = useState<OperatingStatusSnapshot>(() =>
    computeOperatingStatus(operatingTimes, new Date())
  );

  useEffect(() => {
    const tick = () => setSnapshot(computeOperatingStatus(operatingTimes, new Date()));
    tick();
    const intervalId = setInterval(tick, 60_000);
    return () => clearInterval(intervalId);
  }, [operatingTimes]);

  return snapshot;
}
