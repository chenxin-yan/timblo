import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@web/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@web/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@web/components/ui/popover";
import { cn } from "@web/lib/utils";
import { Check, ChevronsUpDown, RotateCcw } from "lucide-react";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface TimezoneComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  minWidth?: number;
  fullWidth?: boolean;
  timezones?: string[];
}

// Cache for formatted timezones to avoid recalculating
const formattedTimezonesCache = new Map<
  string,
  {
    value: string;
    label: string;
    numericOffset: number;
  }
>();

// Format a single timezone
const formatTimezone = (timezone: string) => {
  // Check cache first
  if (formattedTimezonesCache.has(timezone)) {
    const cached = formattedTimezonesCache.get(timezone);
    if (cached !== undefined) {
      return cached;
    }
  }

  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(new Date());
  const offset =
    parts.find((part) => part.type === "timeZoneName")?.value || "";
  const modifiedOffset = offset === "GMT" ? "GMT+0" : offset;

  const result = {
    value: timezone,
    label: `(${modifiedOffset}) ${timezone.replace(/_/g, " ")}`,
    numericOffset: Number.parseInt(
      offset.replace("GMT", "").replace("+", "") || "0",
    ),
  };

  // Store in cache
  formattedTimezonesCache.set(timezone, result);
  return result;
};

// Memoized timezone item component
const TimezoneItem = React.memo(
  ({
    timezone,
    selectedValue,
    onSelect,
  }: {
    timezone: { value: string; label: string };
    selectedValue: string;
    onSelect: (value: string) => void;
  }) => (
    <CommandItem
      value={timezone.value}
      onSelect={onSelect}
      className="flex items-center"
    >
      <span className="flex-grow truncate">{timezone.label}</span>
      <Check
        className={cn(
          "ml-auto h-4 w-4 flex-shrink-0",
          selectedValue === timezone.value ? "opacity-100" : "opacity-0",
        )}
      />
    </CommandItem>
  ),
  (prevProps, nextProps) =>
    prevProps.timezone.value === nextProps.timezone.value &&
    prevProps.selectedValue === nextProps.selectedValue,
);

// Get user's current timezone
function getUserCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback to UTC if browser doesn't support it
    return "UTC";
  }
}

export function TimezoneCombobox({
  value,
  onValueChange,
  onBlur,
  placeholder = "Select timezone...",
  className,
  minWidth = 200,
  fullWidth = false,
  timezones: allTimezones = Intl.supportedValuesOf("timeZone"),
}: TimezoneComboboxProps) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState<number>(minWidth);
  const textRef = useRef<HTMLSpanElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const userTimezone = useMemo(() => getUserCurrentTimezone(), []);

  // Only format the selected timezone initially
  const selectedTimezoneData = useMemo(() => {
    if (!value) return null;
    return formatTimezone(value);
  }, [value]);

  // Format all timezones lazily when dropdown is opened
  const [formattedTimezones, setFormattedTimezones] = useState<
    Array<{
      value: string;
      label: string;
      numericOffset: number;
    }>
  >([]);

  // Filter timezones based on search query
  const filteredTimezones = useMemo(() => {
    if (!searchQuery) return formattedTimezones;

    const lowerQuery = searchQuery.toLowerCase();
    return formattedTimezones.filter((tz) =>
      tz.label.toLowerCase().includes(lowerQuery),
    );
  }, [formattedTimezones, searchQuery]);

  // Setup virtualization for the timezone list
  const virtualizer = useVirtualizer({
    count: filteredTimezones.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 35, // Approximate height of each item
    overscan: 10,
  });

  // Memoize the handler function to prevent recreation
  const handleSelect = useCallback(
    (currentValue: string) => {
      onValueChange(currentValue);
      setOpen(false);
      setSearchQuery("");
    },
    [onValueChange],
  );

  // Lazy load and format timezones only when dropdown is opened
  useEffect(() => {
    if (open && formattedTimezones.length === 0) {
      // Use a small timeout to allow the dropdown to open first
      // This prevents blocking the UI thread during the initial click
      const timeoutId = setTimeout(() => {
        // Process timezones in chunks to avoid blocking the main thread
        const chunkSize = 50;
        let index = 0;

        const processNextChunk = () => {
          const chunk = allTimezones.slice(index, index + chunkSize);
          if (chunk.length === 0) {
            // All chunks processed, sort and update state
            setFormattedTimezones((prev) =>
              [...prev].sort((a, b) => a.numericOffset - b.numericOffset),
            );
            return;
          }

          // Format this chunk
          const newFormatted = chunk.map(formatTimezone);
          setFormattedTimezones((prev) => [...prev, ...newFormatted]);

          // Move to next chunk
          index += chunkSize;
          setTimeout(processNextChunk, 0);
        };

        processNextChunk();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [open, allTimezones, formattedTimezones.length]);

  // Find the selected timezone label
  const selectedTimezoneLabel = useMemo(() => {
    if (!value) return placeholder;
    return selectedTimezoneData?.label || placeholder;
  }, [value, selectedTimezoneData, placeholder]);

  // Update width when the selected timezone changes
  useEffect(() => {
    if (!fullWidth && textRef.current) {
      // Use requestAnimationFrame to avoid layout thrashing
      const rafId = requestAnimationFrame(() => {
        if (textRef.current) {
          // Add some padding to account for the button's padding and the chevron icon
          const textWidth = textRef.current.offsetWidth + 40;
          // Use the larger of the calculated width or the minimum width
          setWidth(Math.max(textWidth, minWidth));
        }
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [selectedTimezoneLabel, minWidth, fullWidth]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle reset to user's current timezone
  const handleResetTimezone = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent opening the dropdown
      onValueChange(userTimezone);
    },
    [onValueChange, userTimezone],
  );

  // Check if current timezone differs from user's timezone
  const showResetButton = value && value !== userTimezone;

  return (
    <>
      {/* Hidden span to measure text width */}
      {!fullWidth && (
        <span
          ref={textRef}
          className="invisible absolute whitespace-nowrap"
          aria-hidden="true"
        >
          {selectedTimezoneLabel}
        </span>
      )}

      <div className="flex select-none items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              // biome-ignore lint/a11y/useSemanticElements: <explanation>
              role="combobox"
              aria-expanded={open}
              className={cn(
                "justify-between",
                fullWidth && "w-full",
                className,
              )}
              // HACK: currently disabled transition animation because there is an unexpected animation on render
              style={
                !fullWidth
                  ? {
                      width: `${width}px`,
                      transitionProperty: "none",
                    }
                  : undefined
              }
              onBlur={onBlur}
            >
              {selectedTimezoneLabel}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          {open && (
            <PopoverContent className="w-[350px] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search timezone..."
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                />
                <CommandList className="max-h-[300px]" ref={listRef}>
                  <CommandEmpty>No timezone found.</CommandEmpty>
                  <CommandGroup>
                    <div
                      style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                      }}
                    >
                      {virtualizer.getVirtualItems().map((virtualItem) => {
                        const timezone = filteredTimezones[virtualItem.index];
                        return (
                          <div
                            key={timezone.value}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <TimezoneItem
                              timezone={timezone}
                              selectedValue={value}
                              onSelect={handleSelect}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
        {showResetButton && !fullWidth && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-1"
            onClick={handleResetTimezone}
            title="Reset to your current timezone"
            aria-label="Reset to your current timezone"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );
}
