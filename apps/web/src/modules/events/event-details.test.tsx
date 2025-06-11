import { render } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { nanoid } from "nanoid";
import { describe, it } from "vitest";
import EventDetails from "./event-details.page";

const eventId = "abcde12345";
const response1Id = nanoid();
const response2Id = nanoid();
const response3Id = nanoid();

const handlers = [
  http.get(`/api/events/${eventId}`, () => {
    return HttpResponse.json({
      id: eventId,
      title: "Test Event",
      dates: [
        {
          start: new Date(2000, 1, 5, 9).toISOString(),
          end: new Date(2000, 1, 5, 17).toISOString(),
        },
        {
          start: new Date(2000, 1, 6, 9).toISOString(),
          end: new Date(2000, 1, 6, 17).toISOString(),
        },
        {
          start: new Date(2000, 1, 8, 9).toISOString(),
          end: new Date(2000, 1, 8, 17).toISOString(),
        },
        {
          start: new Date(2000, 1, 9, 9).toISOString(),
          end: new Date(2000, 1, 9, 17).toISOString(),
        },
        {
          start: new Date(2000, 1, 11, 9).toISOString(),
          end: new Date(2000, 1, 11, 17).toISOString(),
        },
        {
          start: new Date(2000, 1, 12, 9).toISOString(),
          end: new Date(2000, 1, 12, 17).toISOString(),
        },
        {
          start: new Date(2000, 1, 13, 9).toISOString(),
          end: new Date(2000, 1, 13, 17).toISOString(),
        },
      ],
      timezone: "America/New_York",
      createdAt: new Date(2000, 1, 1).getTime(),
      updatedAt: new Date(2000, 1, 1).getTime(),
    });
  }),

  http.get(`/api/events/${eventId}/responses`, () => {
    return HttpResponse.json([
      {
        id: response1Id,
        eventId,
        name: "response 1",
        createdAt: new Date(2000, 1, 2, 1).getTime(),
        updatedAt: new Date(2000, 1, 2, 1).getTime(),
        email: "response1@gmail.com",
      },
      {
        id: response2Id,
        eventId,
        name: "response 2",
        createdAt: new Date(2000, 1, 2, 1).getTime(),
        updatedAt: new Date(2000, 1, 2, 1).getTime(),
        email: "response1@gmail.com",
      },
      {
        id: response3Id,
        eventId,
        name: "response 2",
        createdAt: new Date(2000, 1, 2, 1).getTime(),
        updatedAt: new Date(2000, 1, 2, 1).getTime(),
        email: "response1@gmail.com",
      },
    ]);
  }),

  http.get(`/api/events/${eventId}/availability`, () => {
    return HttpResponse.json([
      // response 1 availability
      {
        id: nanoid(),
        type: "availability",
        responseId: response1Id,
        start: new Date(2000, 1, 5, 10),
        end: new Date(2000, 1, 5, 13),
      },
      {
        id: nanoid(),
        type: "availability",
        responseId: response1Id,
        start: new Date(2000, 1, 8, 11, 30),
        end: new Date(2000, 1, 8, 14, 15),
      },
      // response 2 availability
      {
        id: nanoid(),
        type: "availability",
        responseId: response1Id,
        start: new Date(2000, 1, 5, 12),
        end: new Date(2000, 1, 5, 14),
      },
      {
        id: nanoid(),
        type: "availability",
        responseId: response1Id,
        start: new Date(2000, 1, 12, 11),
        end: new Date(2000, 1, 12, 14),
      },
      // response 3 availability
      {
        id: nanoid(),
        type: "availability",
        responseId: response1Id,
        start: new Date(2000, 1, 5, 11),
        end: new Date(2000, 1, 5, 12, 30),
      },
      {
        id: nanoid(),
        type: "availability",
        responseId: response1Id,
        start: new Date(2000, 1, 8, 12, 30),
        end: new Date(2000, 1, 8, 15),
      },
    ]);
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Event Details Page", () => {
  it.todo("should render correctly if event is found", () => {
    render(<EventDetails eventId={eventId} />);
  });
});
