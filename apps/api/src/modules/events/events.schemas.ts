import { Events } from "@api/drizzle/schema";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

import { z } from "@hono/zod-openapi";
import { compareDesc } from "date-fns/fp";

export const ZDateTimeRange = z.object({
  start: z.string().datetime().openapi({ example: "2000-01-01T09:00:00.000Z" }),
  end: z.string().datetime().openapi({ example: "2000-01-01T17:00:00.000Z" }),
});
export type TDateTimeRange = z.infer<typeof ZDateTimeRange>;

const ZEvent = z.object({
  title: z
    .string()
    .trim()
    .min(4, {
      message: "Event title must contain at least 4 character(s)",
    })
    .max(100, {
      message: "Event title must contain at most 100 character(s)",
    })
    .openapi({ example: "New Event" }),
  dates: z
    .array(ZDateTimeRange)
    .min(1)
    .transform((dateRanges) =>
      [...dateRanges].sort((a, b) => compareDesc(a.start, b.start)),
    )
    .openapi({
      example: [
        {
          start: "2000-01-01T09:00:00.000Z",
          end: "2000-01-01T17:00:00.000Z",
        },
        {
          start: "2000-01-02T09:00:00.000Z",
          end: "2000-01-02T17:00:00.000Z",
        },
      ],
    }),
  timezone: z
    .string()
    .trim()
    .refine(
      (tz) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch (error) {
          return false;
        }
      },
      { message: "Invalid timezone identifier" },
    )
    .openapi({ example: "America/New_York" }),
});

export const ZEventId = z.string().length(10);

export const ZEventSelect = createSelectSchema(Events, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type TEventSelect = z.infer<typeof ZEventSelect>;

export const ZEventUpdate = createUpdateSchema(Events, {
  ...ZEvent.shape,
})
  .omit({
    id: true,
    updatedAt: true,
    createdAt: true,
  })
  .refine(
    (data) => {
      return data.dates.every(
        (range) => new Date(range.start) < new Date(range.end),
      );
    },
    {
      message:
        "For each date, the start time must be earlier than the end time",
      path: ["dates"],
    },
  );
export type TEventUpdate = z.infer<typeof ZEventUpdate>;

export const ZEventInsert = createInsertSchema(Events, {
  ...ZEvent.shape,
})
  .omit({
    id: true,
    updatedAt: true,
    createdAt: true,
  })
  .refine(
    (data) => {
      return data.dates.every(
        (range) => new Date(range.start) < new Date(range.end),
      );
    },
    {
      message:
        "For each date, the start time must be earlier than the end time",
      path: ["dates"],
    },
  );
export type TEventInsert = z.infer<typeof ZEventInsert>;
