import { Button } from "@web/components/ui/button.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@web/components/ui/popover.tsx";
import { HelpCircle } from "lucide-react";

interface AvailabilityHelpProps {
  className?: string;
}

export const AvailabilityHelp = ({ className }: AvailabilityHelpProps) => {
  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex w-full items-center justify-center gap-1"
          >
            <HelpCircle className="h-2 w-2" />
            Help
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80"
          align="center"
          side="top"
          sideOffset={10}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-medium text-sm">
                Understanding Availability Options
              </h3>
            </div>

            <div className="space-y-3 rounded-md bg-muted/50 p-3">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded">
                  <div className="h-3 w-3 rounded-sm bg-green-500/80" />
                </div>
                <div>
                  <p className="font-medium text-sm">Available</p>
                  <p className="text-muted-foreground text-xs">
                    Times when you can definitely attend the event
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded">
                  <div className="h-3 w-3 rounded-sm bg-amber-400/80" />
                </div>
                <div>
                  <p className="font-medium text-sm">If Needed</p>
                  <p className="text-muted-foreground text-xs">
                    Times when you could attend, but prefer not to if there are
                    better options
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded">
                  <div className="h-3 w-3 rounded-sm border border-border bg-background" />
                </div>
                <div>
                  <p className="font-medium text-sm">Unavailable</p>
                  <p className="text-muted-foreground text-xs">
                    Times when you cannot attend the event
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-3 text-xs dark:bg-blue-950/30">
              <p className="mb-1 font-medium text-blue-700 dark:text-blue-400">
                How to use:
              </p>
              <ul className="list-disc space-y-2 pl-4 text-blue-600 dark:text-blue-300">
                <li>
                  <span className="font-medium">Click and drag</span> to mark
                  times using your selected availability type
                </li>
                <li>
                  Hold{" "}
                  <kbd className="rounded-sm border bg-blue-100 px-1 py-0.5 font-semibold text-[10px] dark:bg-blue-900">
                    Ctrl
                  </kbd>{" "}
                  while dragging to invert your selection ("Available" becomes
                  "If Needed" and vice versa)
                </li>
                <li>
                  <span className="font-medium">Click</span> on already selected
                  times to clear them
                </li>
                <li>
                  You can adjust your selection in any direction while dragging
                  to fine-tune your availability
                </li>
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
