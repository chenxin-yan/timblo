import { TZDate } from "@date-fns/tz";
import { add, format } from "date-fns";

// Time slot generation
// This works with hour values that have been adjusted to the user's timezone
export const generateTimeSlots = (
  minTime: number,
  maxTime: number,
): string[] => {
  const slots: string[] = [];

  // If minTime is greater than maxTime, we're spanning across midnight
  if (minTime >= maxTime) {
    // Generate slots from minTime to midnight (24)
    for (let hour = minTime; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(
          `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`,
        );
      }
    }

    // Generate slots from midnight (0) to maxTime
    for (let hour = 0; hour < maxTime; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(
          `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`,
        );
      }
    }
  } else {
    // logic for when minTime is less than or equal to maxTime
    for (let hour = minTime; hour < maxTime; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(
          `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`,
        );
      }
    }
  }

  return slots;
};

export const numTimeToString = (hour: number, minutes?: number): string => {
  const formattedHours = hour.toString().padStart(2, "0");
  const formattedMinutes =
    minutes !== undefined ? minutes.toString().padStart(2, "0") : "00";
  return `${formattedHours}:${formattedMinutes}`;
};

// Format time for display in 12h format
export const timeTo12hFormat = (time: string): string => {
  const [hours] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours} ${period}`;
};

// Time slot type checks
export const isHourStart = (time: string): boolean => time.endsWith(":00");
export const isHourEnd = (time: string): boolean => time.endsWith(":45");
export const isHalfHour = (time: string): boolean => time.endsWith(":30");

// Helper function to get next time slot
export const getNextTimeSlot = (timeSlot: string): string => {
  const [hours, minutes] = timeSlot.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + 15;
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, "0")}:${newMinutes
    .toString()
    .padStart(2, "0")}`;
};

// Helper to calculate visible days and total pages
export const calculatePagination = (
  days: string[],
  numPerPage: number,
  currentPage: number,
) => {
  const total = Math.ceil(days.length / numPerPage);

  if (days.length <= numPerPage) {
    return { visibleDays: days, totalPages: 1 };
  }

  const start = currentPage * numPerPage;
  const end = Math.min(start + numPerPage, days.length);
  return {
    visibleDays: days.slice(start, end),
    totalPages: total,
  };
};

// Format date for display
// Date string is already in user's timezone from extractDatesFromRanges
export const formatDateDisplay = (date: string): string => {
  return format(new TZDate(date, "UTC"), "eee, MMM d");
};

export const getVitualDate = (
  minTime: number,
  maxTime: number,
  date: TZDate,
) => {
  // if its a date in standard grid just use the date as it is
  if (minTime < maxTime) {
    return format(date, "yyyy-MM-dd");
  }

  // if a date col span across two days due to timezone change, subtract one day
  return format(add(date, { days: -1 }).toISOString(), "yyyy-MM-dd");
};

// time is hh:mm format string, date is yyyy-MM-dd format string
export const getActualDate = (
  minTime: number,
  maxTime: number,
  time: string,
  date: string,
  timezone: string,
): TZDate => {
  const [hours, minutes] = time.split(":").map((val) => Number.parseInt(val));
  const [year, month, day] = date.split("-").map((val) => Number.parseInt(val));
  const tzDate = new TZDate(year, month - 1, day, timezone);
  const dateTime = add(tzDate, { hours, minutes });

  if (minTime >= maxTime && hours < maxTime) {
    return add(dateTime, { days: +1 });
  }

  return dateTime;
};
