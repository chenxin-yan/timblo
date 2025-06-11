import { TZDate, tzOffset } from "@date-fns/tz";
import type { TAvailabilityInsert, TDateTimeRange } from "@timblo/api";
import { add } from "date-fns";

// cnverts a date string to UTC in the specified timezone
export const zonedTimeToUtc = (date: string, timezone: string): string => {
  const zonedDate = new TZDate(date, timezone);
  return zonedDate.withTimeZone("UTC").toISOString().replace("+00:00", "Z");
};

// extract dates from date range and format them into an array of strings in yyyy-MM-dd
export const extractDatesFromRanges = (
  dates: TDateTimeRange[],
  timezone: string,
): string[] => {
  const datesSet = new Set<string>();

  for (const range of dates) {
    const zonedDate = new TZDate(range.start, "UTC").withTimeZone(timezone);
    // Format to yyyy-MM-dd to ensure consistent date strings regardless of timezone
    const dateString = zonedDate.toISOString().split("T")[0];
    datesSet.add(dateString);
  }

  return Array.from(datesSet);
};

export const getEventTimeRange = (
  dates: TDateTimeRange[],
  timezone: string,
) => {
  // Convert UTC dates to the user's selected timezone
  const minTime = new TZDate(dates[0].start, "UTC")
    .withTimeZone(timezone)
    .getHours();
  const maxTime = new TZDate(dates[0].end, "UTC")
    .withTimeZone(timezone)
    .getHours();

  return {
    minTime,
    maxTime: maxTime === 0 ? 24 : maxTime,
  };
};

// Convert UTC availability times to the user's timezone
export const availabilityToZonedTime = <
  T extends { start: string; end: string; type: "available" | "if_needed" },
>(
  availability: T[],
  timezone: string,
) => {
  return availability.map((val) => {
    const start = new TZDate(val.start, "UTC");
    const end = new TZDate(val.end, "UTC");
    return {
      ...val,
      start: start.withTimeZone(timezone).toISOString(),
      end: end.withTimeZone(timezone).toISOString(),
    };
  });
};

// Convert user timezone availability times back to UTC for storing in the database
export const zonedTimeToAvailabilityUTC = (
  availability: TAvailabilityInsert[],
  timezone: string,
) => {
  return availability.map((val) => {
    const start = new TZDate(val.start, timezone);
    const end = new TZDate(val.end, timezone);
    return {
      ...val,
      start: start.withTimeZone("UTC").toISOString().replace("+00:00", "Z"),
      end: end.withTimeZone("UTC").toISOString().replace("+00:00", "Z"),
    };
  });
};

// Convert dates to timezone date and add hours. Then, convert back to UTC as date range
export const calculateDateRanges = (
  dates: Date[],
  timezone: string,
  timeRangeStart: number,
  timeRangeEnd: number,
) => {
  const result = dates.map((val) => {
    const date = `${val.toISOString().split("T")[0]}T00:00:00Z`;
    const startUTC = add(new TZDate(date, "UTC"), {
      hours: timeRangeStart,
      minutes: tzOffset(timezone, val) * -1,
    })
      .toISOString()
      .replace("+00:00", "Z");

    const endUTC = add(new TZDate(date, "UTC"), {
      hours: timeRangeEnd,
      minutes: tzOffset(timezone, val) * -1,
    })
      .toISOString()
      .replace("+00:00", "Z");

    return {
      start: startUTC,
      end: endUTC,
    };
  });
  return result;
};
