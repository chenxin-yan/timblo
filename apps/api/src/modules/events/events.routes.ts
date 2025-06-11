import { createRouter } from "@api/lib/app";
import {
  createEventRoute,
  getEventAvailabilityRoute,
  getEventByIdRoute,
  getEventResponsesRoute,
  updateEventRoute,
} from "./events.doc";
import {
  createNewEvent,
  getAvailabilityByEventId,
  getEventById,
  getResponsesByEventId,
  updateEventById,
} from "./events.service";

const eventRoutes = createRouter()
  .openapi(createEventRoute, async (c) => {
    const event = c.req.valid("json");
    const newEvent = await createNewEvent(c.env, event);
    return c.json(newEvent, 201);
  })
  .openapi(getEventByIdRoute, async (c) => {
    const eventId = c.req.param("eventId");
    const event = await getEventById(c.env, eventId);
    return c.json(event, 200);
  })
  .openapi(getEventResponsesRoute, async (c) => {
    const eventId = c.req.param("eventId");
    const responses = await getResponsesByEventId(c.env, eventId);
    return c.json(responses, 200);
  })
  .openapi(getEventAvailabilityRoute, async (c) => {
    const eventId = c.req.param("eventId");
    const responses = await getAvailabilityByEventId(c.env, eventId);
    return c.json(responses, 200);
  })
  .openapi(updateEventRoute, async (c) => {
    const eventId = c.req.param("eventId");
    const newEvent = c.req.valid("json");
    const event = await updateEventById(c.env, eventId, newEvent);
    return c.json(event, 200);
  });
// TODO: Might add delete event route in the future when auth is implemented
// .delete("/:eventId", async (c) => {
//   const eventId = c.req.param("eventId");
//   await deleteEventById(c.env, eventId);
//   return c.status(204);
// });

export default eventRoutes;
