import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/e/$eventId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/events/$eventId",
      params: { eventId: params.eventId },
      replace: true,
    });
  },
});
