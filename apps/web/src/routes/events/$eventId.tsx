import { createFileRoute } from "@tanstack/react-router";
import EventDetails from "@web/modules/events/event-details.page";

export const Route = createFileRoute("/events/$eventId")({
  component: EventDetailPage,
});
function EventDetailPage() {
  const { eventId } = Route.useParams();
  return <EventDetails eventId={eventId} />;
}
