import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { z } from "zod";

// Events Table
export const Events = sqliteTable("events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  title: text("title").notNull(),
  dates: text("dates", { mode: "json" })
    .notNull()
    .$type<Array<{ start: string; end: string }>>()
    .default(sql`'[]'`),
  timezone: text("timezone").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Responses Table
export const Responses = sqliteTable(
  "responses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    eventId: text("event_id")
      .notNull()
      .references(() => Events.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(),
    email: text("email"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("eventId_idx").on(table.eventId)],
);

export const ZAvailabilityType = z.enum(["available", "if_needed"]);
export type TAvailabilityType = z.infer<typeof ZAvailabilityType>;

// Availability Table
export const Availability = sqliteTable(
  "availability",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    responseId: text("response_id")
      .notNull()
      .references(() => Responses.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    start: text("start").notNull(),
    end: text("end").notNull(),
    type: text("type", { enum: ZAvailabilityType.options }).notNull(),
  },
  (table) => [index("availability_response_id_idx").on(table.responseId)],
);
