import { TZDate } from "@date-fns/tz";
import type {
  TAvailabilitySelect as TAvailability,
  TResponseSelect,
} from "@timblo/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@web/components/ui/tooltip";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getNextTimeSlot, getVitualDate } from "../availability.utils";
import type { TimeDisplayFormat } from "../events.types";
import { BaseAvailabilityGrid, type RenderBlocks } from "./availability-base";

interface AvailabilityDisplayProps {
  selections: TAvailability[];
  responses: TResponseSelect[];
  days: string[];
  minTime: number;
  maxTime: number;
  numPerPage?: number;
  displayIfNeeded?: boolean;
  filteredResponseIds?: string[];
  displayBest?: boolean;
  timezone: string;
  displayFormat?: TimeDisplayFormat;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

interface DisplayBlock {
  day: string;
  dayIndex: number;
  startTime: string;
  endTime: string;
  startTimeIndex: number;
  endTimeIndex: number;
  count: number;
  responseIds: Set<string>;
}

const AvailabilityDisplay = ({
  selections,
  responses,
  days,
  minTime,
  maxTime,
  numPerPage = 5,
  displayIfNeeded = false,
  filteredResponseIds,
  displayBest = false,
  timezone,
  displayFormat = "12h",
  currentPage,
  onPageChange,
}: AvailabilityDisplayProps) => {
  const [blocks, setBlocks] = useState<DisplayBlock[]>([]);
  const [maxOverlapCount, setMaxOverlapCount] = useState(1);

  // Get green shade based on overlap count
  const getCellColor = (count: number) => {
    // Base green color
    const r = 34;
    const g = 197;
    const b = 94;

    // Normalize count between 0-1 for consistent shading
    const normalizedCount = Math.min(
      (count - 1) / (maxOverlapCount - 1 || 1),
      1,
    );

    // For count=1, use a light green
    if (count === 1) {
      return `rgba(${r}, ${g}, ${b}, 0.45)`;
    }

    // For higher counts, increase opacity and darken the green
    const opacity = 0.5 + normalizedCount * 0.45;

    // Darken the green color as count increases (reduce brightness)
    const darkenFactor = 1 - normalizedCount * 0.25;
    const darkR = Math.floor(r * darkenFactor);
    const darkG = Math.floor(g * darkenFactor);
    const darkB = Math.floor(b * darkenFactor);

    return `rgba(${darkR}, ${darkG}, ${darkB}, ${opacity})`;
  };

  // Helper function to compare responseIds sets
  const areResponseIdsSetsEqual = (set1: Set<string>, set2: Set<string>) => {
    if (set1.size !== set2.size) return false;
    for (const id of set1) {
      if (!set2.has(id)) return false;
    }
    return true;
  };

  // Create formatted tooltip text for block
  const getTooltipText = (responseIds: Set<string>) => {
    if (!responseIds.size) return "";

    // Number of people
    const count = responseIds.size;
    const peopleText =
      count === 1 ? "1 person available" : `${count} people available`;

    // Get response names from ids
    const cellResponseNames = responses
      .filter((val) => responseIds.has(val.id))
      .map((val) => val.name);

    // Format the names in a more readable way
    const formattedNames = cellResponseNames
      .sort() // Sort alphabetically for consistency
      .map((name) => `• ${name}`) // Add bullet points
      .join("\n"); // Put each name on a new line

    return (
      <div className="flex flex-col gap-1">
        <div className="font-medium">{peopleText}</div>
        <div className="max-h-[150px] overflow-y-auto">
          {formattedNames.split("\n").map((name) => (
            <div key={name}>{name}</div>
          ))}
        </div>
      </div>
    );
  };

  // Process selections and create blocks
  const processSelections = (visibleDays: string[], timeSlots: string[]) => {
    // Create a map to track overlap by time slot
    const timeSlotMap: Record<
      string,
      Record<string, { count: number; responseIds: Set<string> }>
    > = {};
    const allResponseIds = new Set<string>();
    let maxCount = 1;

    // Initialize empty map for all days and time slots
    for (const day of days) {
      timeSlotMap[day] = {};
      for (const timeSlot of timeSlots) {
        timeSlotMap[day][timeSlot] = { count: 0, responseIds: new Set() };
      }
    }

    // Filter selections based on filteredResponseIds if provided
    const effectiveSelections =
      filteredResponseIds && filteredResponseIds.length > 0
        ? selections.filter((s) => filteredResponseIds.includes(s.responseId))
        : selections;

    // Process all selections
    for (const selection of effectiveSelections) {
      const { start, end, responseId, type } = selection;

      // populate and format the date
      const tzStart = new TZDate(start, timezone);
      const tzEnd = new TZDate(end, timezone);
      const date = getVitualDate(minTime, maxTime, tzStart);

      const startTime = format(tzStart, "HH:mm");
      const endTime = format(tzEnd, "HH:mm");

      // Skip if_needed if not displaying them
      if (!displayIfNeeded && type === "if_needed") continue;

      allResponseIds.add(responseId);

      // Skip if date is not in our grid
      if (!timeSlotMap[date]) continue;

      // Fill in time slots for this selection
      let currentTime = startTime;

      // Handle when startTime and endTime span across 24 hours (full day selection)
      const isFullDaySelection = startTime === endTime;

      // For full day selections, we need to process all time slots for the day
      if (isFullDaySelection) {
        // Process all time slots for this day
        for (const timeSlot of timeSlots) {
          if (timeSlotMap[date][timeSlot]) {
            const slot = timeSlotMap[date][timeSlot];

            // Only count each response once per slot
            if (!slot.responseIds.has(responseId)) {
              slot.responseIds.add(responseId);
              slot.count += 1;
              maxCount = Math.max(maxCount, slot.count);
            }
          }
        }
      } else {
        // Normal case for time periods within the same day
        while (currentTime < endTime) {
          if (timeSlotMap[date][currentTime]) {
            const slot = timeSlotMap[date][currentTime];

            // Only count each response once per slot
            if (!slot.responseIds.has(responseId)) {
              slot.responseIds.add(responseId);
              slot.count += 1;
              maxCount = Math.max(maxCount, slot.count);
            }
          }

          // Move to next time slot
          currentTime = getNextTimeSlot(currentTime);
        }
      }
    }

    // Create continuous blocks
    const newBlocks: DisplayBlock[] = [];

    for (let dayIndex = 0; dayIndex < visibleDays.length; dayIndex++) {
      const day = visibleDays[dayIndex];
      let currentBlock: Omit<DisplayBlock, "dayIndex"> | null = null;
      let prevSlot: { count: number; responseIds: Set<string> } | null = null;

      // Process each time slot
      for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
        const timeSlot = timeSlots[timeIndex];
        const slot = timeSlotMap[day][timeSlot];

        // Handle empty slots or changes in availability
        if (
          slot.count === 0 ||
          (prevSlot &&
            (prevSlot.count !== slot.count ||
              !areResponseIdsSetsEqual(prevSlot.responseIds, slot.responseIds)))
        ) {
          // Finalize current block if it exists
          if (currentBlock) {
            newBlocks.push({ ...currentBlock, dayIndex });
            currentBlock = null;
          }

          // Skip empty slots
          if (slot.count === 0) {
            prevSlot = null;
            continue;
          }
        }

        // Start a new block or extend current one
        if (!currentBlock) {
          currentBlock = {
            day: day,
            startTime: timeSlot,
            endTime: getNextTimeSlot(timeSlot),
            startTimeIndex: timeIndex,
            endTimeIndex: timeIndex + 1,
            count: slot.count,
            responseIds: new Set(slot.responseIds),
          };
        } else {
          // Just update the end time/index
          currentBlock.endTime = getNextTimeSlot(timeSlot);
          currentBlock.endTimeIndex = timeIndex + 1;
        }

        prevSlot = slot;
      }

      // Add the final block for this day if it exists
      if (currentBlock) {
        newBlocks.push({ ...currentBlock, dayIndex });
      }
    }

    setBlocks(newBlocks);
    setMaxOverlapCount(maxCount);
  };

  // Render the availability blocks
  const renderBlocks = ({
    timeSlots,
    visibleDays,
    gridDimensions,
    cellHeight,
  }: RenderBlocks) => {
    useEffect(() => {
      processSelections(visibleDays, timeSlots);
    }, [
      visibleDays,
      timeSlots,
      selections,
      displayIfNeeded,
      filteredResponseIds,
      displayBest,
    ]);

    // Filter blocks to only show those with maximum overlap count if displayBest is true
    const visibleBlocks = displayBest
      ? blocks.filter((block) => block.count === maxOverlapCount)
      : blocks;

    return (
      <TooltipProvider>
        {visibleBlocks.map((block) => {
          // Calculate position based on indices
          const top = block.startTimeIndex * cellHeight;
          const height =
            (block.endTimeIndex - block.startTimeIndex) * cellHeight;

          // Calculate left position based on current grid dimensions
          const left =
            gridDimensions.timeColumnWidth +
            block.dayIndex * gridDimensions.columnWidth;

          return (
            <Tooltip key={`block-${block.startTime}`}>
              <TooltipTrigger asChild>
                <div
                  className="absolute cursor-pointer"
                  style={{
                    top: `${top}px`,
                    left: `${left}px`,
                    height: `${height}px`,
                    width: `${gridDimensions.columnWidth}px`,
                    backgroundColor: getCellColor(block.count),
                    zIndex: 1,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                {getTooltipText(block.responseIds)}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    );
  };

  // Render the footer/legend
  const renderFooter = () => {
    return <></>;
  };

  return (
    <BaseAvailabilityGrid
      days={days}
      minTime={minTime}
      maxTime={maxTime}
      numPerPage={numPerPage}
      renderBlocks={renderBlocks}
      renderFooter={renderFooter}
      displayFormat={displayFormat}
      currentPage={currentPage}
      onPageChange={onPageChange}
    />
  );
};

export default AvailabilityDisplay;
