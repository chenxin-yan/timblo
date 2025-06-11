import { Responses } from "@api/drizzle/schema";
import { z } from "@hono/zod-openapi";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { createInsertSchema } from "drizzle-zod";

const ZResponse = z.object({
  name: z
    .string()
    .trim()
    .min(1, {
      message: "Name cannot be empty",
    })
    .max(30, {
      message: "Name must contain at most 30 character(s)",
    })
    .openapi({ example: "John Doe" }),
  email: z
    .string()
    .email({ message: "Please provide a valid email address" })
    .openapi({ example: "example@domain.com" }),
});

export const ZResponseInsert = createInsertSchema(Responses, {
  ...ZResponse.shape,
}).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});
export type TResponseInsert = z.infer<typeof ZResponseInsert>;

export const ZResponseUpdate = createUpdateSchema(Responses, {
  ...ZResponse.shape,
}).omit({
  id: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
});
export type TResponseUpdate = z.infer<typeof ZResponseUpdate>;

export const ZResponseSelect = createSelectSchema(Responses, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type TResponseSelect = z.infer<typeof ZResponseSelect>;

export const ZResponseId = z.string().nanoid();
