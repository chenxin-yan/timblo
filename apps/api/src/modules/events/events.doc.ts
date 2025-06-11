import { ZApiErrorResponse } from "@api/middlewares/error.middleware";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { ZAvailabilitySelect } from "../availability";
import { ZResponseSelect } from "../responses";
import {
  ZEventId,
  ZEventInsert,
  ZEventSelect,
  ZEventUpdate,
} from "./events.schemas";

const tags = ["Events"];
const basePath = "/events";

export const createEventRoute = createRoute({
  method: "post",
  path: basePath,
  tags,
  description: "Create a new event, start and end should be in UTC timezone",
  summary: "New event",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ZEventInsert,
        },
      },
      description: "The new event to create",
      required: true,
    },
  },
  responses: {
    201: {
      description: "Event created successfully",
      content: {
        "application/json": {
          schema: ZEventSelect,
        },
      },
    },
    400: {
      description: "Invalid request body",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});

export const getEventByIdRoute = createRoute({
  method: "get",
  path: `${basePath}/{eventId}`,
  tags,
  description: "Get an event by its ID",
  summary: "Get event",
  request: {
    params: z.object({
      eventId: ZEventId,
    }),
  },
  responses: {
    200: {
      description: "Event retrieved successfully",
      content: {
        "application/json": {
          schema: ZEventSelect,
        },
      },
    },
    404: {
      description: "Event not found",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});

export const getEventResponsesRoute = createRoute({
  method: "get",
  path: `${basePath}/{eventId}/responses`,
  tags: ["Events", "Responses"],
  description: "Get all responses for an event",
  summary: "Get event responses",
  request: {
    params: z.object({
      eventId: ZEventId,
    }),
  },
  responses: {
    200: {
      description: "Responses retrieved successfully",
      content: {
        "application/json": {
          schema: z.array(ZResponseSelect),
        },
      },
    },
    404: {
      description: "Event not found",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});

export const getEventAvailabilityRoute = createRoute({
  method: "get",
  path: `${basePath}/{eventId}/availability`,
  tags: ["Events", "Availability"],
  description: "Get all availability for an event",
  summary: "Get event availability",
  request: {
    params: z.object({
      eventId: ZEventId,
    }),
  },
  responses: {
    200: {
      description: "Availability retrieved successfully",
      content: {
        "application/json": {
          schema: z.array(ZAvailabilitySelect),
        },
      },
    },
    404: {
      description: "Event not found",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});

export const updateEventRoute = createRoute({
  method: "put",
  path: `${basePath}/{eventId}`,
  tags,
  description:
    "Update an existing event, start and end should be in UTC timezone",
  summary: "Update event",
  request: {
    params: z.object({
      eventId: ZEventId,
    }),
    body: {
      content: {
        "application/json": {
          schema: ZEventUpdate,
        },
      },
      description: "The updated event data",
      required: true,
    },
  },
  responses: {
    200: {
      description: "Event updated successfully",
      content: {
        "application/json": {
          schema: ZEventSelect,
        },
      },
    },
    400: {
      description: "Invalid request body",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
    404: {
      description: "Event not found",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});
