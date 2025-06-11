import { TZDate } from "@date-fns/tz";
import type { TAvailabilityInsert, TAvailabilityType } from "@timblo/api";
import { add, compareAsc } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getActualDate,
  getNextTimeSlot,
  getVitualDate,
  numTimeToString,
} from "../availability.utils.ts";
import type { TimeDisplayFormat } from "../events.types.ts";
import { zonedTimeToUtc } from "../timezone.utils.ts";
import {
  BaseAvailabilityGrid,
  type RenderBlocks,
} from "./availability-base.tsx";
import { AvailabilityHelp } from "./availability-help.tsx";

interface AvailabilityEditorProps {
  selections: TAvailabilityInsert[];
  days: string[];
  minTime: number;
  maxTime: number;
  onChange: (selection: TAvailabilityInsert[]) => void;
  numPerPage?: number;
  timezone: string;
  displayFormat?: TimeDisplayFormat;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  selectionType?: TAvailabilityType;
}

interface EditorBlock {
  dateCol: string;
  start: string;
  end: string;
  type: TAvailabilityType;
  startTimeIndex: number;
  endTimeIndex: number;
}

interface SelectionState {
  isDragging: boolean;
  startDate: string | null;
  startTime: string | null;
  startTimeIndex: number | null;
  currentDate: string | null;
  currentTime: string | null;
  currentTimeIndex: number | null;
  selectionType: TAvailabilityType;
  isDeselecting: boolean;
  originalCellStates: Map<string, TAvailabilityType | null> | null;
}

interface CellCoordinate {
  date: string;
  time: string;
  timeIndex: number;
}

const AvailabilityEditor = ({
  selections,
  days,
  minTime,
  maxTime,
  onChange,
  numPerPage = 5,
  timezone,
  displayFormat = "12h",
  currentPage,
  onPageChange,
  selectionType = "available",
}: AvailabilityEditorProps) => {
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [selectionState, setSelectionState] = useState<SelectionState>({
    isDragging: false,
    startDate: null,
    startTime: null,
    startTimeIndex: null,
    currentDate: null,
    currentTime: null,
    currentTimeIndex: null,
    selectionType: selectionType,
    isDeselecting: false,
    originalCellStates: null,
  });
  const cellStateMapRef = useRef<Map<string, TAvailabilityType | null>>(
    new Map(),
  );

  // Store the previous selection rectangle to prevent unnecessary updates
  const lastSelectionRectRef = useRef<string | null>(null);

  // Helper to get time slot index
  const getTimeSlotIndex = useCallback(
    (timeSlots: string[], timeSlot: string): number => {
      return timeSlots.indexOf(timeSlot);
    },
    [],
  );

  // Convert grid state to selection ranges after updates and create valid ISO strings
  const buildSelectionRanges = useCallback(() => {
    const validSelections = [];

    for (const block of blocks) {
      try {
        const startDateTime = zonedTimeToUtc(block.start, timezone);
        const endDateTime = zonedTimeToUtc(block.end, timezone);

        validSelections.push({
          start: startDateTime,
          end: endDateTime,
          type: block.type,
        });
      } catch (error) {
        console.error("Error creating date range:", error, block);
      }
    }

    return validSelections;
  }, [blocks, timezone]);

  // Rebuild blocks from the cell state map (extracted to reuse)
  const rebuildBlocks = useCallback(
    (timeSlots: string[]) => {
      const cellBlocks: Record<
        string,
        Record<TAvailabilityType, EditorBlock[]>
      > = {};

      // Initialize empty record for each day and type
      for (const day of days) {
        cellBlocks[day] = {
          available: [],
          if_needed: [],
        };
      }

      // Find all continuous blocks by scanning the map
      for (const day of days) {
        for (const blockType of ["available", "if_needed"]) {
          let currentBlock: Omit<EditorBlock, "end" | "endTimeIndex"> | null =
            null;

          for (let i = 0; i < timeSlots.length; i++) {
            const currentTime = timeSlots[i];
            const key = `${day}|${currentTime}`;
            const cellType = cellStateMapRef.current.get(key);

            // If this cell continues the current block
            if (cellType === blockType) {
              if (!currentBlock) {
                // Start a new block
                currentBlock = {
                  dateCol: day,
                  start: getActualDate(
                    minTime,
                    maxTime,
                    currentTime,
                    day,
                    timezone,
                  ).toISOString(),
                  type: cellType as TAvailabilityType,
                  startTimeIndex: i,
                };
              }
              // Continue extending the block
            } else {
              // End the current block if we have one
              if (currentBlock) {
                const nextTimeIndex = i;
                const nextTime =
                  nextTimeIndex < timeSlots.length
                    ? timeSlots[nextTimeIndex]
                    : getNextTimeSlot(timeSlots[timeSlots.length - 1]);
                const end = getActualDate(
                  minTime,
                  maxTime,
                  nextTime,
                  day,
                  timezone,
                ).toISOString();

                cellBlocks[day][currentBlock.type as TAvailabilityType].push({
                  ...currentBlock,
                  end,
                  endTimeIndex: nextTimeIndex,
                });

                currentBlock = null;
              }
            }
          }

          // Close any remaining block at the end of the day
          if (currentBlock) {
            const nextTimeIndex = timeSlots.length;
            const nextTime = getNextTimeSlot(timeSlots[timeSlots.length - 1]);

            let end = getActualDate(minTime, maxTime, nextTime, day, timezone);
            // HACK: handle when time range span across 24 hours
            // if start is after end, offset end to the next day
            if (compareAsc(new Date(currentBlock.start), end) === 1) {
              end = add(end, { days: +1 });
            }

            cellBlocks[day][currentBlock.type as TAvailabilityType].push({
              ...currentBlock,
              end: end.toISOString(),
              endTimeIndex: nextTimeIndex,
            });
          }
        }
      }

      // Flatten all blocks into a single array
      const newBlocks: EditorBlock[] = [];
      for (const dayBlocks of Object.values(cellBlocks)) {
        for (const typeBlocks of Object.values(dayBlocks)) {
          for (const block of typeBlocks) {
            newBlocks.push(block);
          }
        }
      }

      // Update blocks state
      setBlocks(newBlocks);
    },
    [days, minTime, maxTime, timezone],
  );

  // Initialize blocks and cell state map from selections prop
  const initializeEditor = useCallback(
    (timeSlots: string[]) => {
      // Build blocks from selections - selections are already in the user's chosen timezone
      const newBlocks: EditorBlock[] = selections.map((selection) => {
        try {
          const start = new TZDate(selection.start, timezone);
          const end = new TZDate(selection.end, timezone);

          // calculate time indexes in timeslots
          const startTime = numTimeToString(
            start.getHours(),
            start.getMinutes(),
          );
          const endTime = numTimeToString(end.getHours(), end.getMinutes());

          let startTimeIndex = getTimeSlotIndex(timeSlots, startTime);
          // For endTimeIndex, we need the next slot after endTime
          const directEndTimeIndex = getTimeSlotIndex(timeSlots, endTime);
          // HACK: directEndTimeIndex < startTimeIndex is true when time range span across 24 hours and selection til end of the col
          let endTimeIndex =
            directEndTimeIndex === -1 || directEndTimeIndex <= startTimeIndex
              ? timeSlots.length
              : directEndTimeIndex;

          // Ensure the indices are within valid bounds for the current time slots
          startTimeIndex = Math.max(0, startTimeIndex);
          endTimeIndex = Math.min(timeSlots.length, endTimeIndex);
          const visualDate = getVitualDate(minTime, maxTime, start);

          return {
            dateCol: visualDate,
            start: start.toISOString(),
            end: end.toISOString(),
            type: selection.type,
            startTimeIndex: startTimeIndex,
            endTimeIndex: endTimeIndex,
          };
        } catch (error) {
          console.error("Error processing selection:", error, selection);
          return null;
        }
      }) as EditorBlock[];

      setBlocks(newBlocks);

      // Rebuild the cell state map for quick lookups
      const stateMap = new Map<string, TAvailabilityType | null>();

      for (const day of days) {
        for (const time of timeSlots) {
          const key = `${day}|${time}`;
          stateMap.set(key, null);
        }
      }

      // Fill in the map based on blocks
      for (const block of newBlocks) {
        // Only process if the block is for a valid day
        if (days.includes(block.dateCol)) {
          // Clamp the indices to be within the timeSlots array bounds
          const startIndex = Math.max(0, block.startTimeIndex);
          const endIndex = Math.min(timeSlots.length, block.endTimeIndex);

          for (let i = startIndex; i < endIndex; i++) {
            const time = timeSlots[i];
            const key = `${block.dateCol}|${time}`;
            stateMap.set(key, block.type);
          }
        }
      }

      cellStateMapRef.current = stateMap;
    },
    [selections, days, getTimeSlotIndex, timezone, minTime, maxTime],
  );

  // Helper function to find a cell by coordinates
  const getCellFromPoint = useCallback(
    (x: number, y: number): CellCoordinate | null => {
      const element = document.elementFromPoint(x, y);
      if (!element) return null;

      // Find the nearest element with data-cell attribute
      let cellElement = element;
      while (cellElement && !cellElement.getAttribute("data-cell")) {
        if (cellElement.parentElement) {
          cellElement = cellElement.parentElement;
        } else {
          break;
        }
      }

      // If we found a cell element, extract the date and time
      if (cellElement?.getAttribute("data-cell")) {
        const cellData = cellElement.getAttribute("data-cell")?.split("|");
        if (cellData && cellData.length === 3) {
          return {
            date: cellData[0],
            time: cellData[1],
            timeIndex: Number.parseInt(cellData[2], 10),
          };
        }
      }

      return null;
    },
    [],
  );

  // Get cell state based on cell state map (for background coloring of grid cells)
  const getCellState = useCallback(
    (date: string, timeSlot: string): TAvailabilityType | null => {
      const key = `${date}|${timeSlot}`;
      return cellStateMapRef.current.get(key) || null;
    },
    [],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (selectionState.isDragging) {
      setSelectionState({
        isDragging: false,
        startDate: null,
        startTime: null,
        startTimeIndex: null,
        currentDate: null,
        currentTime: null,
        currentTimeIndex: null,
        selectionType: selectionType,
        isDeselecting: false,
        originalCellStates: null,
      });

      // Reset last selection rectangle
      lastSelectionRectRef.current = null;

      // Notify parent of changes
      const newSelections = buildSelectionRanges();
      onChange(newSelections);
    }
  }, [selectionState, buildSelectionRanges, onChange, selectionType]);

  // Get cell color for display
  const getCellColor = (type: TAvailabilityType | null) => {
    switch (type) {
      case "available":
        return "bg-green-500/80 hover:bg-green-600/80";
      case "if_needed":
        return "bg-amber-400/80 hover:bg-amber-500/80";
      default:
        return "hover:bg-muted/75";
    }
  };

  // Get cell hover effect during dragging
  const getDragHoverColor = () => {
    if (!selectionState.isDragging) return "";

    // Different hover color for selection vs deselection mode
    if (selectionState.isDeselecting) {
      return "hover:bg-gray-200/40";
    }
    switch (selectionState.selectionType) {
      case "available":
        return "hover:bg-green-500/40";
      case "if_needed":
        return "hover:bg-amber-400/40";
      default:
        return "hover:bg-muted/40";
    }
  };

  // Render availability blocks for editor
  const renderBlocks = ({
    timeSlots,
    visibleDays,
    gridDimensions,
    cellHeight,
  }: RenderBlocks) => {
    // Initialize on first render or when selections change
    useEffect(() => {
      initializeEditor(timeSlots);
    }, [selections, timeSlots]);

    // Handle document mouse up
    useEffect(() => {
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [handleMouseUp]);

    // Update selectionState when selectionType prop changes
    useEffect(() => {
      setSelectionState((prev) => ({
        ...prev,
        selectionType: selectionType,
      }));
    }, [selectionType]);

    // Add mouse move handler for rectangle selection
    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (
          !selectionState.isDragging ||
          !selectionState.startDate ||
          !selectionState.startTime ||
          selectionState.startTimeIndex === null ||
          !selectionState.originalCellStates
        )
          return;

        const cell = getCellFromPoint(e.clientX, e.clientY);
        if (!cell) return;

        // Update current cell in state
        setSelectionState((prev) => ({
          ...prev,
          currentDate: cell.date,
          currentTime: cell.time,
          currentTimeIndex: cell.timeIndex,
        }));

        // Start with the original cell states
        const newCellStates = new Map(selectionState.originalCellStates);

        // Get date indices for calculations
        const startDateIndex = days.indexOf(selectionState.startDate);
        const currentDateIndex = days.indexOf(cell.date);

        if (startDateIndex === -1 || currentDateIndex === -1) return;

        // Calculate selection rectangle
        const [minDateIndex, maxDateIndex] =
          startDateIndex <= currentDateIndex
            ? [startDateIndex, currentDateIndex]
            : [currentDateIndex, startDateIndex];

        const [minTimeIndex, maxTimeIndex] =
          selectionState.startTimeIndex <= cell.timeIndex
            ? [selectionState.startTimeIndex, cell.timeIndex]
            : [cell.timeIndex, selectionState.startTimeIndex];

        // For each cell in the rectangle, apply the appropriate action
        for (let dateIdx = minDateIndex; dateIdx <= maxDateIndex; dateIdx++) {
          const date = days[dateIdx];

          for (let timeIdx = minTimeIndex; timeIdx <= maxTimeIndex; timeIdx++) {
            if (timeIdx >= 0 && timeIdx < timeSlots.length) {
              const time = timeSlots[timeIdx];
              const key = `${date}|${time}`;

              // Apply selection or deselection based on the mode
              if (selectionState.isDeselecting) {
                // When deselecting, set to null if the cell has the type we're deselecting
                const cellType = selectionState.originalCellStates.get(key);
                if (cellType === selectionState.selectionType) {
                  newCellStates.set(key, null);
                }
              } else {
                // When selecting, always set the selection type
                newCellStates.set(key, selectionState.selectionType);
              }
            }
          }
        }

        // Apply the updated map and rebuild blocks
        cellStateMapRef.current = newCellStates;
        rebuildBlocks(timeSlots);
      };

      if (selectionState.isDragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.body.classList.add("select-none");
      }

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.body.classList.remove("select-none");
      };
    }, [selectionState, days, rebuildBlocks, getCellFromPoint, timeSlots]);

    // Handlers for mouse interactions
    const handleCellMouseDown = (
      day: string,
      time: string,
      timeIndex: number,
      e: React.MouseEvent,
    ) => {
      // Prevent default browser behavior (text selection)
      e.preventDefault();

      const currentType = getCellState(day, time);

      // Reset the last rectangle ref
      lastSelectionRectRef.current = null;

      // Determine selection mode and type based on current cell state and modifier keys
      let newType: TAvailabilityType = selectionType;
      let isDeselecting = false;

      if (e.ctrlKey || e.metaKey) {
        // Ctrl+click: Use the opposite of the current radio selection
        newType = selectionType === "available" ? "if_needed" : "available";

        // If the cell already has the inverted type, we should deselect it
        if (currentType === newType) {
          isDeselecting = true;
        }
      } else {
        // Regular click: Toggle between selected type and null
        if (currentType === selectionType) {
          isDeselecting = true;
        }
      }

      // Create a copy of the current cell state map
      const originalCellStates = new Map(cellStateMapRef.current);

      // Start dragging with the determined selection type and mode
      setSelectionState({
        isDragging: true,
        startDate: day,
        startTime: time,
        startTimeIndex: timeIndex,
        currentDate: day,
        currentTime: time,
        currentTimeIndex: timeIndex,
        selectionType: newType,
        isDeselecting: isDeselecting,
        originalCellStates: originalCellStates,
      });

      // Update just the initial cell
      const key = `${day}|${time}`;
      const newCellStates = new Map(originalCellStates);

      // Set or clear based on deselect mode
      newCellStates.set(key, isDeselecting ? null : newType);

      // Apply the new map and rebuild blocks
      cellStateMapRef.current = newCellStates;
      rebuildBlocks(timeSlots);
    };

    // Render blocks overlay and interactive cells
    return (
      <>
        {/* Render continuous blocks as overlays FIRST (below grid lines) */}
        {blocks
          .filter((block) => visibleDays.includes(block.dateCol))
          .map((block) => {
            const dayIndex = visibleDays.indexOf(block.dateCol);
            if (dayIndex === -1) return null;

            // Calculate position based on indices with bounds checking
            const startIndex = Math.max(0, block.startTimeIndex);
            const endIndex = Math.min(timeSlots.length, block.endTimeIndex);

            const top = startIndex * cellHeight;
            const height = (endIndex - startIndex) * cellHeight;

            // Calculate left position based on grid
            const left =
              gridDimensions.timeColumnWidth +
              dayIndex * gridDimensions.columnWidth;

            return (
              <div
                key={`block-${block.start}`}
                className={`${getCellColor(block.type)} absolute`}
                style={{
                  top: `${top}px`,
                  left: `${left}px`,
                  height: `${height}px`,
                  width: `${gridDimensions.columnWidth}px`,
                  zIndex: 1,
                }}
              />
            );
          })}

        {/* Interactive cell overlays */}
        {timeSlots.map((timeSlot, timeIndex) => (
          <div
            key={`cells-${timeSlot}`}
            className="grid w-full"
            style={{
              gridTemplateColumns: `${gridDimensions.timeColumnWidth}px repeat(${visibleDays.length}, 1fr)`,
              position: "absolute",
              top: `${timeIndex * cellHeight}px`,
              left: 0,
              height: `${cellHeight}px`,
              width: "100%",
              zIndex: 3,
            }}
          >
            <div /> {/* Time column placeholder */}
            {visibleDays.map((date) => (
              <div
                key={`interact-${date}-${timeSlot}`}
                data-cell={`${date}|${timeSlot}|${timeIndex}`}
                className={`
                  ${
                    selectionState.isDragging ? "cursor-pointer" : "cursor-cell"
                  } ${getDragHoverColor()} h-full w-full transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring `}
                onMouseDown={(e) =>
                  handleCellMouseDown(date, timeSlot, timeIndex, e)
                }
                role="button"
                tabIndex={0}
              />
            ))}
          </div>
        ))}
      </>
    );
  };

  // Render the footer with legend
  const renderFooter = () => (
    <>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-green-500/80" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-amber-400/80" />
          <span>If Needed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm border border-border bg-muted" />
          <span>Unavailable</span>
        </div>
      </div>
      <AvailabilityHelp />
    </>
  );

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

export default AvailabilityEditor;
