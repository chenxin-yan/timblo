import { useForm } from "@tanstack/react-form";
import {
  type TAvailabilityInsert,
  type TAvailabilityType,
  type TResponseSelect,
  ZResponseInsert,
} from "@timblo/api";
import { NotFound } from "@web/components/not-found";
import { TimezoneCombobox } from "@web/components/timezone-combobox";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@web/components/ui/alert-dialog";
import { Button } from "@web/components/ui/button";
import { Checkbox } from "@web/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@web/components/ui/dialog";
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
import { Separator } from "@web/components/ui/separator";
import { Spinner } from "@web/components/ui/spinner";
import { Switch } from "@web/components/ui/switch";
import AvailabilityDisplay from "@web/modules/events/components/availability-display";
import AvailabilityEditor from "@web/modules/events/components/availability-editor";
import { SelectionToggle } from "@web/modules/events/components/selection-toggle";
import {
  availabilityToZonedTime,
  calculateDateRanges,
  extractDatesFromRanges,
  getEventTimeRange,
} from "@web/modules/events/timezone.utils";
import {
  CalendarPlus,
  Copy,
  PenIcon,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ZodError } from "zod";
import EventForm from "./components/event-form";
import {
  useAddResponse,
  useDeleteResponse,
  useEventFullData,
  useUpdateEvent,
  useUpdateResponse,
} from "./events.queries";
import type { TimeDisplayFormat } from "./events.types";

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

const EventDetails = ({ eventId }: { eventId: string }) => {
  const { event, responses, availability, isLoading, isError } =
    useEventFullData(eventId);

  const { mutateAsync: addResponse } = useAddResponse();
  const { mutateAsync: updateResponse } = useUpdateResponse();
  const { mutateAsync: deleteResponse } = useDeleteResponse();
  const { mutateAsync: updateEvent } = useUpdateEvent();

  const [filteredResponseIds, setFilteredResponseIds] = useState<string[]>([]);
  const [userAvailability, setUserAvailability] = useState<
    TAvailabilityInsert[]
  >([]);

  const [selectionType, setSelectionType] =
    useState<TAvailabilityType>("available");
  const [isShowIfNeeded, setIsShowIfNeeded] = useState(false);
  const [isShowBest, setIsShowBest] = useState(false);
  const [timezone, setTimezone] = useState<string>(userTimezone);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [displayFormat, setDisplayFormat] = useState<TimeDisplayFormat>(
    (localStorage.getItem("timblo-displayFormat") as TimeDisplayFormat) ??
      "12h",
  );
  const [currentPage, setCurrentPage] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editingResponse, setEditingResponse] =
    useState<TResponseSelect | null>(null);

  // Set timezone from event data or localStorage
  useEffect(() => {
    if (event) {
      const localTimezone = localStorage.getItem("timblo-timezone");
      if (localTimezone) {
        setTimezone(localTimezone);
      } else {
        setTimezone(event.timezone);
      }
    }
  }, [event]);

  const responseForm = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    onSubmit: editingResponse
      ? async ({ value }) => {
          try {
            setDialogOpen(false);

            await updateResponse({
              responseId: editingResponse.id,
              eventId,
              name: value.name,
              email: value.email,
              availability: userAvailability,
              timezone,
            });

            setIsEditing(false);
            setEditingResponse(null);
          } catch (err) {
            console.error(err);
          }
        }
      : async ({ value }) => {
          try {
            setDialogOpen(false);

            await addResponse({
              eventId,
              name: value.name,
              email: value.email,
              availability: userAvailability,
              timezone,
            });

            setIsEditing(false);
            setEditingResponse(null);
          } catch (err) {
            console.error(err);
          }
        },
  });

  // Reset responseForm and userAvailability when user leaves editing mode or when editing response changes
  useEffect(() => {
    if (!isEditing) {
      setUserAvailability([]);
      responseForm.reset();
      setEditingResponse(null);
    } else if (editingResponse !== null && availability) {
      // If editing an existing response, prefill the form with that response's data
      responseForm.reset();

      responseForm.setFieldValue("name", editingResponse.name);
      responseForm.setFieldValue("email", editingResponse.email ?? "");

      // Find and set the availability for this response
      const responseAvailability = availability
        .filter((avail) => avail.responseId === editingResponse.id)
        .map(({ id, responseId, ...rest }) => rest);

      setUserAvailability(responseAvailability);
    }
  }, [isEditing, editingResponse, availability]);

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner variant="ellipsis" size={40} />
      </div>
    );
  if (isError || !event)
    return (
      <div className="relative flex w-full flex-col justify-center bg-background p-6 md:p-18">
        <div className="relative mx-auto w-full max-w-5xl">
          <NotFound
            title="Event not found"
            description="The event you're looking for doesn't exist"
          />
        </div>
      </div>
    );

  function SubmitResponseDialog({ className }: { className?: string }) {
    const isEditing = editingResponse !== null;
    const dialogTitle = isEditing ? "Edit Response" : "Add Response";
    const dialogDescription = isEditing
      ? "Update your information and availability for this event."
      : "Enter your information to respond to this event and share your availability.";

    return (
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          // Only allow opening the dialog if userAvailability is not empty
          if (open && userAvailability.length === 0) {
            toast.error(
              "Please select your availability before adding a response",
            );
            return;
          }
          setDialogOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <Button className={className}>
            <CalendarPlus /> {`${editingResponse ? "Update" : "Save"}`}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <form
            id="response-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              responseForm.handleSubmit();
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-start gap-x-4 gap-y-1">
              <responseForm.Field
                name="name"
                validators={{
                  onChange: ZResponseInsert.shape.name,
                }}
              >
                {(field) => (
                  <>
                    <Label
                      htmlFor={field.name}
                      className="justify-end self-center text-right"
                    >
                      Name:
                    </Label>
                    <FormInput
                      field={field}
                      placeholder="John Doe"
                      className="col-span-3"
                    />
                    <div className="col-span-1" />{" "}
                    <ValidationError
                      errors={field.state.meta.errors as ZodError[]}
                      className="col-span-3 mt-1"
                    />
                  </>
                )}
              </responseForm.Field>
            </div>
            <div className="grid grid-cols-4 items-start gap-x-4 gap-y-1">
              <responseForm.Field
                name="email"
                validators={{
                  onChange: ZResponseInsert.shape.email,
                }}
              >
                {(field) => (
                  <>
                    <Label
                      htmlFor={field.name}
                      className="justify-end self-center text-right"
                    >
                      Email
                    </Label>
                    <FormInput
                      field={field}
                      placeholder="example@domain.com"
                      className="col-span-3"
                    />
                    <div className="col-span-1" />{" "}
                    <ValidationError
                      errors={field.state.meta.errors as ZodError[]}
                      className="col-span-3 mt-1"
                    />
                  </>
                )}
              </responseForm.Field>
            </div>
          </form>

          <DialogFooter>
            <responseForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  form="response-form"
                  type="submit"
                  variant={canSubmit ? "default" : "outline"}
                  disabled={!canSubmit}
                >
                  {isSubmitting ? "..." : isEditing ? "Update" : "Save"}
                </Button>
              )}
            </responseForm.Subscribe>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  function AvailabilityCard({ className }: { className?: string }) {
    return (
      <>
        {event && (
          <div className={className}>
            {isEditing ? (
              <>
                <AvailabilityEditor
                  selections={availabilityToZonedTime(
                    userAvailability,
                    timezone,
                  )}
                  days={extractDatesFromRanges(event.dates, timezone)}
                  minTime={getEventTimeRange(event.dates, timezone).minTime}
                  maxTime={getEventTimeRange(event.dates, timezone).maxTime}
                  onChange={setUserAvailability}
                  timezone={timezone}
                  displayFormat={displayFormat}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  selectionType={selectionType}
                />
              </>
            ) : (
              <AvailabilityDisplay
                selections={availabilityToZonedTime(availability, timezone)}
                responses={responses}
                days={extractDatesFromRanges(event.dates, timezone)}
                minTime={getEventTimeRange(event.dates, timezone).minTime}
                maxTime={getEventTimeRange(event.dates, timezone).maxTime}
                displayIfNeeded={isShowIfNeeded}
                displayBest={isShowBest}
                filteredResponseIds={filteredResponseIds}
                timezone={timezone}
                displayFormat={displayFormat}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </>
    );
  }

  function OptionsSideBar({ className }: { className?: string }) {
    return (
      <div className={className}>
        {!isEditing ? (
          <>
            <h2 className="font-medium text-xl">
              {`Responses (${(responses?.length || 0) - filteredResponseIds.length}/${responses?.length || 0})`}
            </h2>
            <Separator className="mt-2 mb-4" />
            {!responses || responses.length <= 0 ? (
              <p className="text-base">No responses yet</p>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {responses.map((response) => {
                    const isChecked = filteredResponseIds.includes(response.id);
                    const shouldDim =
                      filteredResponseIds.length > 0 && !isChecked;

                    return (
                      <div
                        key={response.id}
                        className="group relative grid h-4 w-full grid-cols-5 items-center gap-2"
                      >
                        {/* First column - shows User icon by default, changes to Checkbox on hover or when checked */}
                        <div className="flex w-full items-center justify-center">
                          {isChecked ? (
                            <Checkbox
                              id={response.id}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilteredResponseIds((prev) => [
                                    ...prev,
                                    response.id,
                                  ]);
                                } else {
                                  setFilteredResponseIds((prev) =>
                                    prev.filter((id) => id !== response.id),
                                  );
                                }
                              }}
                            />
                          ) : (
                            <>
                              {/* User icon (shown when not checked and not hovering) */}
                              <div className="flex items-center justify-center group-hover:hidden">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>

                              {/* Checkbox (shown when hovering) */}
                              <div className="hidden items-center justify-center group-hover:flex">
                                <Checkbox
                                  id={response.id}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFilteredResponseIds((prev) => [
                                        ...prev,
                                        response.id,
                                      ]);
                                    } else {
                                      setFilteredResponseIds((prev) =>
                                        prev.filter((id) => id !== response.id),
                                      );
                                    }
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Label - spans now consistently 3 columns */}
                        <label
                          htmlFor={response.id}
                          className={`${shouldDim ? "opacity-40" : "opacity-100"} col-span-4 truncate font-medium text-base leading-none transition-all group-hover:col-span-3`}
                          title={response.name}
                        >
                          {response.name}
                        </label>

                        {/* Button - only visible on hover */}
                        <div className="hidden justify-end group-hover:flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex h-4 w-4 items-center justify-center p-0"
                            onClick={() => {
                              setEditingResponse(response);
                              setIsEditing(true);
                            }}
                          >
                            <PenIcon />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Separator className="mt-4 mb-4" />
                <div className="flex flex-col gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-if-needed"
                      checked={isShowIfNeeded}
                      onCheckedChange={() => {
                        setIsShowIfNeeded(!isShowIfNeeded);
                      }}
                    />
                    <Label htmlFor="show-if-needed">Show if needed times</Label>
                  </div>
                  {responses.length > 1 && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-best"
                        checked={isShowBest}
                        onCheckedChange={() => {
                          setIsShowBest(!isShowBest);
                        }}
                      />
                      <Label htmlFor="show-best">Show best times</Label>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : editingResponse ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-muted-foreground">
              Editing as "{editingResponse.name}"
            </h2>
            <div className="flex flex-col gap-2">
              <SelectionToggle
                value={selectionType}
                onValueChange={setSelectionType}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant={"ghost"}
                  className="w-full border-red-500 text-red-500 hover:bg-red-100 hover:text-red-600 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Response
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete your response from this
                    event?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant={"destructive"}
                    onClick={async () => {
                      try {
                        await deleteResponse({
                          responseId: editingResponse.id,
                          eventId,
                        });

                        // Exit editing mode
                        setIsEditing(false);
                        setEditingResponse(null);
                      } catch (error) {
                        console.error("Error deleting response:", error);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h2 className="text-muted-foreground">Editing new response</h2>
            <div className="flex flex-col items-baseline gap-2">
              <SelectionToggle
                value={selectionType}
                onValueChange={setSelectionType}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-12 flex select-none flex-col">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="font-bold text-4xl">{event?.title}</h1>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant={"ghost"} size={"sm"}>
                <Pencil /> Edit Event
              </Button>
            </DialogTrigger>
            <DialogContent className="w-sm">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
              </DialogHeader>
              {event && (
                <EventForm
                  varient="edit"
                  event={{
                    id: event.id,
                    title: event.title,
                    startTime: getEventTimeRange(event.dates, event.timezone)
                      .minTime,
                    endTime: getEventTimeRange(event.dates, event.timezone)
                      .maxTime,
                    dates: event.dates.map((val) => new Date(val.start)),
                    timezone: event.timezone,
                  }}
                  onSubmit={async ({ value }) => {
                    try {
                      const dateRanges = calculateDateRanges(
                        value.dates,
                        value.timezone,
                        value.timeRangeStart,
                        value.timeRangeEnd,
                      );

                      // Create the event data with the correct type structure
                      const newEvent = {
                        title: value.title,
                        timezone: value.timezone,
                        dates: dateRanges,
                      };

                      await updateEvent({
                        eventId: event.id,
                        event: newEvent,
                      });

                      setEditDialogOpen(false);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={"ghost"}
            className="font-medium"
            onClick={() => {
              navigator.clipboard.writeText(
                window.location.href
                  .replace(/^https?:\/\//, "") // Remove http:// or https://
                  .replace("/events/", "/e/"),
              );
              toast.success("Link copied to clipboard!");
            }}
          >
            <Copy className="ml-2 h-4 w-4" />
            Copy Link
          </Button>
          <div className="flex w-[176px] items-center justify-stretch gap-2">
            {isEditing ? (
              <>
                <Button
                  variant={"outline"}
                  onClick={() => {
                    setIsEditing(false);
                    setEditingResponse(null);
                  }}
                >
                  Cancel
                </Button>
                <SubmitResponseDialog />
              </>
            ) : (
              <Button
                className="w-full"
                onClick={() => {
                  setIsEditing(true);
                }}
              >
                Add Availability
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Main UI*/}
      <div className="grid grid-cols-8 items-center gap-12">
        <div className="col-span-6 flex select-none flex-col gap-6">
          <AvailabilityCard />
          <div className="flex items-center space-x-2">
            <Label htmlFor="timezone" className="whitespace-nowrap">
              Shown in
            </Label>
            <TimezoneCombobox
              value={timezone}
              onValueChange={(val) => {
                setTimezone(val);
                localStorage.setItem("timblo-timezone", val);
              }}
            />
            <Select
              value={displayFormat}
              onValueChange={(val) => {
                setDisplayFormat(val as TimeDisplayFormat);
                localStorage.setItem("timblo-displayFormat", val);
              }}
            >
              <SelectTrigger className="w-[75px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <OptionsSideBar className="col-span-2 h-10/12 select-none" />
      </div>
    </div>
  );
};

export default EventDetails;
