import { useForm } from "@tanstack/react-form";
import { ZEventInsert } from "@timblo/api";
import { TimezoneCombobox } from "@web/components/timezone-combobox";
import { Button } from "@web/components/ui/button";
import { Calendar } from "@web/components/ui/customized/calendar";
import FormInput from "@web/components/ui/form/form-input";
import ValidationError from "@web/components/ui/form/validation-error-text";
import { Label } from "@web/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web/components/ui/select";
import { type ZodError, z } from "zod";

export interface EventFormFields {
  title: string;
  timeRangeStart: number;
  timeRangeEnd: number;
  dates: Date[];
  timezone: string;
}

interface EventFormProps {
  varient: "new" | "edit";
  event?: {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    dates: Date[];
    timezone: string;
  };
  onSubmit: ({ value }: { value: EventFormFields }) => Promise<void>;
}

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

const TIME_OPTIONS = [
  { value: "0", label: "00:00 AM" },
  { value: "1", label: "01:00 AM" },
  { value: "2", label: "02:00 AM" },
  { value: "3", label: "03:00 AM" },
  { value: "4", label: "04:00 AM" },
  { value: "5", label: "05:00 AM" },
  { value: "6", label: "06:00 AM" },
  { value: "7", label: "07:00 AM" },
  { value: "8", label: "08:00 AM" },
  { value: "9", label: "09:00 AM" },
  { value: "10", label: "10:00 AM" },
  { value: "11", label: "11:00 AM" },
  { value: "12", label: "12:00 PM" },
  { value: "13", label: "01:00 PM" },
  { value: "14", label: "02:00 PM" },
  { value: "15", label: "03:00 PM" },
  { value: "16", label: "04:00 PM" },
  { value: "17", label: "05:00 PM" },
  { value: "18", label: "06:00 PM" },
  { value: "19", label: "07:00 PM" },
  { value: "20", label: "08:00 PM" },
  { value: "21", label: "09:00 PM" },
  { value: "22", label: "10:00 PM" },
  { value: "23", label: "11:00 PM" },
  { value: "24", label: "12:00 AM" },
];

const EventForm = ({ varient, event, onSubmit }: EventFormProps) => {
  const form = useForm({
    defaultValues: {
      title: event?.title ?? "",
      timeRangeStart: event?.startTime ?? 9,
      timeRangeEnd: event?.endTime ?? 17,
      dates: event?.dates ?? ([] as Date[]),
      timezone: event?.timezone ?? userTimezone,
    },
    validators: {
      onChange: ({ value }) => {
        if (value.timeRangeEnd <= value.timeRangeStart) {
          const message = "The start time must be earlier than the end time";
          return {
            fields: {
              timeRangeStart: [{ message }],
              timeRangeEnd: [{ message }],
            },
          };
        }
      },
    },
    onSubmit,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-8 font-xl"
    >
      <div className="space-y-3">
        <form.Field
          validators={{
            onChange: ZEventInsert.sourceType().shape.title,
          }}
          name="title"
        >
          {(field) => (
            <>
              <Label htmlFor={field.name}>Event Title:</Label>
              <FormInput field={field} placeholder="My Event" />
              <ValidationError errors={field.state.meta.errors as ZodError[]} />
            </>
          )}
        </form.Field>
      </div>

      <div className="flex flex-col space-y-3">
        <Label>What times might work?</Label>
        <div className="flex flex-row space-x-4">
          <div className="w-full">
            {/* TODO: it might be better to create a seperate component for FormSelect */}
            <form.Field name="timeRangeStart">
              {(field) => {
                const hasError = field.state.meta.errors?.length > 0;
                return (
                  <>
                    <Select
                      value={String(field.state.value)}
                      onValueChange={(value) =>
                        field.handleChange(Number(value))
                      }
                      onOpenChange={() => field.handleBlur()}
                    >
                      <SelectTrigger
                        id={field.name}
                        className={`w-full ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        aria-invalid={hasError}
                      >
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* // HACK: skip the last option: 12:00 AM*/}
                        {TIME_OPTIONS.filter(
                          (_, i) => i + 1 !== TIME_OPTIONS.length,
                        ).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                );
              }}
            </form.Field>
          </div>

          <span className="self-center text-sm">to</span>

          <div className="w-full">
            <form.Field name="timeRangeEnd">
              {(field) => {
                const hasError = field.state.meta.errors?.length > 0;
                return (
                  <Select
                    value={String(field.state.value)}
                    onValueChange={(value) => field.handleChange(Number(value))}
                    onOpenChange={() => field.handleBlur()}
                  >
                    <SelectTrigger
                      id={field.name}
                      className={`w-full ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      aria-invalid={hasError}
                    >
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* // HACK: skip the fisrt option: 00:00 AM*/}
                      {TIME_OPTIONS.filter((_, i) => i !== 0).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            </form.Field>
          </div>
        </div>

        <form.Subscribe selector={(state) => state.fieldMeta.timeRangeEnd}>
          {(timeRangeEnd) => (
            <ValidationError errors={timeRangeEnd?.errors as ZodError[]} />
          )}
        </form.Subscribe>
      </div>

      <div className="space-y-3">
        <form.Field
          name="dates"
          validators={{
            onChange: z.date().array().nonempty().min(1, {
              message: "Please select at least one available day.",
            }),
          }}
        >
          {(field) => {
            const hasError = field.state.meta.errors?.length > 0;
            return (
              <>
                <Label htmlFor={field.name}>What days might work?</Label>
                {/* // TODO: It might be a good idea to implement mouse drag for date selection*/}
                <Calendar
                  mode="multiple"
                  selected={field.state.value}
                  onSelect={(dates) => field.handleChange(dates || [])}
                  numberOfMonths={1}
                  onDayBlur={field.handleBlur}
                  className={`flex h-full w-full rounded-md border shadow-sm ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  aria-invalid={hasError}
                />
                <ValidationError
                  errors={field.state.meta.errors as ZodError[]}
                />
              </>
            );
          }}
        </form.Field>
      </div>

      <div className="space-y-3">
        <form.Field name="timezone">
          {(field) => {
            return (
              <>
                <Label htmlFor={field.name}>Timezone:</Label>
                <TimezoneCombobox
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="Select timezone..."
                  fullWidth={true}
                />
              </>
            );
          }}
        </form.Field>
      </div>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            variant={canSubmit ? "default" : "outline"}
            disabled={!canSubmit}
            className="w-full"
          >
            {isSubmitting ? "..." : varient === "new" ? "Create Event" : "Save"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
};

export default EventForm;
