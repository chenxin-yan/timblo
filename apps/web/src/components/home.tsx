import { useNavigate } from "@tanstack/react-router";
import { Feature } from "@web/components/features";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import EventForm from "@web/modules/events/components/event-form";
import { useCreateEvent } from "@web/modules/events/events.queries";
import { calculateDateRanges } from "@web/modules/events/timezone.utils";

const Home = () => {
  const navigate = useNavigate({ from: "/" });
  const { mutateAsync: createEvent } = useCreateEvent();
  return (
    <section className="py-10">
      <div className="container px-4 sm:px-6">
        <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-8 md:gap-10 lg:flex-row lg:items-start lg:gap-16">
          <div className="flex max-w-md flex-col justify-between gap-6 text-center lg:text-left">
            <div>
              <h1 className="mb-3 font-semibold text-7xl tracking-tight">
                Timblo
              </h1>
              <p className="mx-auto max-w-sm text-lg text-muted-foreground lg:mx-0">
                Create an event, share a link, and instantly find the best time
                for everyone to meet.
              </p>
            </div>
            <Feature />
          </div>
          <Card className="w-full max-w-sm select-none shadow-lg">
            <CardHeader>
              <CardTitle>New Event</CardTitle>
            </CardHeader>
            <CardContent>
              <EventForm
                varient="new"
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

                    const result = await createEvent(newEvent);

                    navigate({ to: `/events/${result.id}` });
                  } catch (err) {
                    console.error(err);
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export { Home };
