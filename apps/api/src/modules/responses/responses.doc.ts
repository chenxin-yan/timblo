import { ZApiErrorResponse } from "@api/middlewares/error.middleware";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import {
  ZAvailabilityInsertArray,
  ZAvailabilitySelect,
} from "../availability/availability.schemas";
import {
  ZResponseId,
  ZResponseInsert,
  ZResponseSelect,
  ZResponseUpdate,
} from "./responses.schemas";

const tags = ["Responses"];
const basePath = "/responses";

export const createResponseRoute = createRoute({
  method: "post",
  path: basePath,
  tags,
  description: "Create a new response for an event",
  summary: "New response",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ZResponseInsert,
        },
      },
      description: "The new response to create",
      required: true,
    },
  },
  responses: {
    201: {
      description: "Response created successfully",
      content: {
        "application/json": {
          schema: ZResponseSelect,
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
    409: {
      description: "Response already exists",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});

export const getResponseByIdRoute = createRoute({
  method: "get",
  path: `${basePath}/{responseId}`,
  tags,
  description: "Get a response by its ID",
  summary: "Get response",
  request: {
    params: z.object({
      responseId: ZResponseId,
    }),
  },
  responses: {
    200: {
      description: "Response retrieved successfully",
      content: {
        "application/json": {
          schema: ZResponseSelect,
        },
      },
    },
    404: {
      description: "Response not found",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});

export const updateResponseRoute = createRoute({
  method: "put",
  path: `${basePath}/{responseId}`,
  tags,
  description: "Update an existing response",
  summary: "Update response",
  request: {
    params: z.object({
      responseId: ZResponseId,
    }),
    body: {
      content: {
        "application/json": {
          schema: ZResponseUpdate,
        },
      },
      description: "The updated response data",
      required: true,
    },
  },
  responses: {
    200: {
      description: "Response updated successfully",
      content: {
        "application/json": {
          schema: ZResponseSelect,
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
      description: "Response not found",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});

export const deleteResponseRoute = createRoute({
  method: "delete",
  path: `${basePath}/{responseId}`,
  tags,
  description: "Delete a response",
  summary: "Delete response",
  request: {
    params: z.object({
      responseId: ZResponseId,
    }),
  },
  responses: {
    200: {
      description: "Response deleted successfully",
    },
    404: {
      description: "Response not found",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});

export const addAvailabilityToResponseRoute = createRoute({
  method: "post",
  path: `${basePath}/{responseId}/availability`,
  tags: ["Responses", "Availability"],
  description:
    "Create a new availability for a response. All dates should be in UTC timezone.",
  summary: "New availability",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ZAvailabilityInsertArray,
        },
      },
      description: "The new availability to create",
      required: true,
    },
  },
  responses: {
    201: {
      description: "Availability created successfully",
      content: {
        "application/json": {
          schema: z.array(ZAvailabilitySelect),
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

export const updateResponseAvailabilityRoute = createRoute({
  method: "put",
  path: `${basePath}/{responseId}/availability`,
  tags: ["Responses", "Availability"],
  description:
    "Update availability for a response. All dates should be in UTC timezone.",
  summary: "Update availability",
  request: {
    params: z.object({
      responseId: ZResponseId,
    }),
    body: {
      content: {
        "application/json": {
          schema: ZAvailabilityInsertArray,
        },
      },
      description: "The availability data to update",
      required: true,
    },
  },
  responses: {
    200: {
      description: "Availability updated successfully",
      content: {
        "application/json": {
          schema: z.array(ZAvailabilitySelect),
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
      description: "Response not found",
      content: {
        "application/json": {
          schema: ZApiErrorResponse,
        },
      },
    },
  },
});
