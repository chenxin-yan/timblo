import { Availability } from "@api/drizzle/schema";
import { z } from "@hono/zod-openapi";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

const ZAvailability = z.object({
  start: z.string().datetime().openapi({ example: "2000-01-01T09:00:00.000Z" }),
  end: z.string().datetime().openapi({ example: "2000-01-01T17:00:00.000Z" }),
});

export const ZAvailabilitySelect = createSelectSchema(Availability);
export type TAvailabilitySelect = z.infer<typeof ZAvailabilitySelect>;

export const ZAvailabilityInsert = createInsertSchema(Availability, {
  ...ZAvailability.shape,
})
  .omit({
    id: true,
    responseId: true,
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start);
      const endDate = new Date(data.end);
      return endDate > startDate;
    },
    {
      message: "End time must be greater than start time",
      path: ["end"],
    },
  );
export type TAvailabilityInsert = z.infer<typeof ZAvailabilityInsert>;

export const ZAvailabilityInsertArray = z.array(ZAvailabilityInsert).nonempty();
export type TAvailabilityInsertArray = z.infer<typeof ZAvailabilityInsertArray>;

export const ZAvailabilityUpdate = z
  .array(
    createUpdateSchema(Availability, { ...ZAvailability.shape })
      .omit({
        id: true,
        responseId: true,
      })
      .refine(
        (data) => {
          const startDate = new Date(data.start);
          const endDate = new Date(data.end);
          return endDate > startDate;
        },
        {
          message: "End time must be greater than start time",
          path: ["end"],
        },
      ),
  )
  .nonempty();
export type TAvailabilityUpdate = z.infer<typeof ZAvailabilityUpdate>;
