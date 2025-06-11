import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@web/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@web/components/ui/card";

import {
  calculatePagination,
  formatDateDisplay,
  generateTimeSlots,
  isHalfHour,
  isHourEnd,
  isHourStart,
  timeTo12hFormat,
} from "../availability.utils";
import type { TimeDisplayFormat } from "../events.types";

export interface BaseAvailabilityGridProps {
  days: string[];
  minTime: number;
  maxTime: number;
  numPerPage?: number;
  timeColumnWidth?: number;
  displayFormat?: TimeDisplayFormat;
  renderFooter?: () => React.ReactNode;
  renderBlocks: (params: RenderBlocks) => React.ReactNode;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export interface RenderBlocks {
  timeSlots: string[];
  visibleDays: string[];
  gridDimensions: {
    width: number;
    columnWidth: number;
    timeColumnWidth: number;
  };
  cellHeight: number;
}

export const BaseAvailabilityGrid = ({
  days,
  minTime,
  maxTime,
  numPerPage = 5,
  timeColumnWidth = 65,
  displayFormat = "12h",
  renderFooter,
  renderBlocks,
  currentPage: externalPage,
  onPageChange,
}: BaseAvailabilityGridProps) => {
  const [internalPage, setInternalPage] = useState(0);
  const currentPage = externalPage !== undefined ? externalPage : internalPage;
  const [gridDimensions, setGridDimensions] = useState({
    width: 0,
    columnWidth: 0,
    timeColumnWidth,
  });

  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Generate time slots (e.g. 09:00, 09:15 ...)
  const timeSlots = useMemo(
    () => generateTimeSlots(minTime, maxTime),
    [minTime, maxTime],
  );

  // Calculate visible days and pagination
  const { visibleDays, totalPages } = useMemo(
    () => calculatePagination(days, numPerPage, currentPage),
    [days, numPerPage, currentPage],
  );

  // Update grid dimensions when the container resizes
  const updateGridDimensions = useCallback(() => {
    if (gridContainerRef.current) {
      const gridWidth = gridContainerRef.current.clientWidth;
      const availableWidth = gridWidth - timeColumnWidth;
      const columnWidth = availableWidth / visibleDays.length;

      setGridDimensions({
        width: gridWidth,
        columnWidth,
        timeColumnWidth,
      });
    }
  }, [visibleDays.length, timeColumnWidth]);

  // Set up resize observer
  useEffect(() => {
    updateGridDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateGridDimensions();
    });

    if (gridContainerRef.current) {
      resizeObserver.observe(gridContainerRef.current);
    }

    window.addEventListener("resize", updateGridDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateGridDimensions);
    };
  }, [updateGridDimensions]);

  // Pagination handlers
  const goToPreviousPage = () => {
    const newPage = Math.max(0, currentPage - 1);
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const goToNextPage = () => {
    const newPage = Math.min(totalPages - 1, currentPage + 1);
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  return (
    <Card className={`${renderFooter ? "pb-0" : ""} w-full gap-0`}>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Header row with dates */}
        <div
          className="grid w-full select-none"
          style={{
            gridTemplateColumns: `${timeColumnWidth}px repeat(${visibleDays.length}, 1fr)`,
          }}
        >
          <div className="p-2" />
          {visibleDays.map((day) => (
            <div key={day} className="p-2 text-center font-medium text-sm">
              {formatDateDisplay(day)}
            </div>
          ))}
        </div>

        {/* Time rows */}
        <div
          className="compact-grid relative"
          ref={gridContainerRef}
          style={{ position: "relative" }}
        >
          {/* Custom blocks from the specific component */}
          {renderBlocks({
            timeSlots,
            visibleDays,
            gridDimensions,
            cellHeight: 16, // h-4 = 16px
          })}

          {/* Grid lines */}
          {timeSlots.map((timeSlot) => {
            const isFirst = isHourStart(timeSlot);
            const isLast = isHourEnd(timeSlot);
            const isHalf = isHalfHour(timeSlot);

            return (
              <div
                key={timeSlot}
                className="grid w-full"
                style={{
                  gridTemplateColumns: `${timeColumnWidth}px repeat(${visibleDays.length}, 1fr)`,
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                <div className="relative flex items-center justify-end pr-3 text-muted-foreground text-xs">
                  {isFirst && (
                    <div className="-top-2 absolute right-3 select-none">
                      {displayFormat === "12h"
                        ? timeTo12hFormat(timeSlot)
                        : timeSlot}
                    </div>
                  )}
                </div>
                {visibleDays.map((day, dayIndex) => (
                  <div
                    key={`${day}-${timeSlot}`}
                    className={`
                      ${isFirst ? "border-t-[0.8px]" : ""} ${
                        isLast ? "border-b-[0.8px]" : ""
                      } ${isHalf ? "border-t-[0.8px] [border-top-style:dashed]" : ""} ${
                        dayIndex < visibleDays.length - 1
                          ? "border-r-[0.8px]"
                          : ""
                      } relative h-4 bg-transparent `}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Footer */}
      {renderFooter && (
        <CardFooter
          className="flex w-full select-none flex-wrap items-center justify-between gap-3 border-border border-t bg-muted/20 text-sm"
          // FIXME: not sure why `py-4` makes top have more padding than bot. This is a work around for now
          style={{ paddingTop: "1rem", paddingBottom: "1rem" }}
        >
          {renderFooter()}
        </CardFooter>
      )}
    </Card>
  );
};
