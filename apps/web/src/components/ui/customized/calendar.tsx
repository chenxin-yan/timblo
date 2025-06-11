import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@web/components/ui/button";
import { cn } from "@web/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const DAYS_PER_WEEK = 7;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = React.useState<number | null>(null);

  const updateCellSize = React.useCallback(() => {
    if (!containerRef.current) return;
    const style = window.getComputedStyle(containerRef.current);
    const width = containerRef.current.offsetWidth;
    const margin =
      Number.parseFloat(style.marginLeft) +
      Number.parseFloat(style.marginRight);
    const padding =
      Number.parseFloat(style.paddingLeft) +
      Number.parseFloat(style.paddingRight);
    const border =
      Number.parseFloat(style.borderLeftWidth) +
      Number.parseFloat(style.borderRightWidth);
    const containerWidth = width + margin - padding + border;

    setCellSize(containerWidth / DAYS_PER_WEEK);
  }, []);

  React.useEffect(() => {
    updateCellSize();
    window.addEventListener("resize", updateCellSize);

    return () => {
      window.removeEventListener("resize", updateCellSize);
    };
  }, [updateCellSize]);

  return (
    <div ref={containerRef} className={cn("w-full p-3", className)}>
      {cellSize && (
        <DayPicker
          showOutsideDays={showOutsideDays}
          styles={{
            cell: {
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            },
            head_cell: {
              width: `${cellSize}px`,
            },
            day: {
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              borderRadius: "50%",
            },
          }}
          classNames={{
            months:
              "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell:
              "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: cn(
              "p-100 relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
              props.mode === "range"
                ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                : "",
            ),
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
            ),
            day_range_start: "day-range-start",
            day_range_end: "day-range-end",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground scale-85",
            day_today: "bg-accent text-accent-foreground",
            day_outside:
              "day-outside text-muted-foreground opacity-50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
            ...classNames,
          }}
          components={{
            IconLeft: () => <ChevronLeftIcon className="h-4 w-4" />,
            IconRight: () => <ChevronRightIcon className="h-4 w-4" />,
          }}
          fromDate={new Date()}
          {...props}
        />
      )}
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
