"use client";

import type { TAvailabilityType } from "@timblo/api";
import { RadioGroup, RadioGroupItem } from "@web/components/ui/radio-group";
import * as React from "react";

interface SelectionToggleProps {
  value: TAvailabilityType;
  onValueChange: (value: TAvailabilityType) => void;
  className?: string;
}

const SelectionToggle = ({
  value,
  onValueChange,
  className,
}: SelectionToggleProps) => {
  // Generate unique IDs for radio inputs
  const id1 = React.useId();
  const id2 = React.useId();

  return (
    <div
      className={`inline-flex h-9 max-w-[300px] rounded-lg bg-input/50 p-0.5 ${className}`}
    >
      <RadioGroup
        value={value}
        onValueChange={(v) => onValueChange(v as TAvailabilityType)}
        className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 font-medium text-sm after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:bg-background after:shadow-black/5 after:shadow-sm after:outline-offset-2 after:transition-transform after:duration-300 has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-ring/70 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
        data-state={value === "available" ? "off" : "on"}
      >
        <label
          htmlFor={id1}
          className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=on]:text-muted-foreground/70"
        >
          Available
          <RadioGroupItem id={id1} value="available" className="sr-only" />
        </label>
        <label
          htmlFor={id2}
          className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=off]:text-muted-foreground/70"
        >
          If needed
          <RadioGroupItem id={id2} value="if_needed" className="sr-only" />
        </label>
      </RadioGroup>
    </div>
  );
};

export { SelectionToggle };
