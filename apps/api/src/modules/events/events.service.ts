import createDB from "@api/drizzle";
import { Availability, Events, Responses } from "@api/drizzle/schema";
import type { Env } from "@api/lib/types";
import { and, eq, gt, lte, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { TAvailabilitySelect } from "../availability";
import type { TResponseSelect } from "../responses";
import type {
  TEventInsert,
  TEventSelect,
  TEventUpdate,
} from "./events.schemas";

export const createNewEvent = async (
  env: Env["Bindings"],
  event: TEventInsert,
): Promise<TEventSelect> => {
  const db = await createDB(env);
  const result = await db.insert(Events).values(event).returning();

  if (result.length <= 0) {
    throw new Error("Failed to create event");
  }

  return result[0];
};

export const getEventById = async (
  env: Env["Bindings"],
  eventId: string,
): Promise<TEventSelect> => {
  const db = await createDB(env);
  const result = await db.select().from(Events).where(eq(Events.id, eventId));

  if (result.length <= 0) {
    throw new HTTPException(404, { message: "Event not found" });
  }

  return result[0];
};

export const deleteEventById = async (
  env: Env["Bindings"],
  eventId: string,
): Promise<void> => {
  const db = await createDB(env);
  const result = await db.delete(Events).where(eq(Events.id, eventId)).limit(1);
  if (!result.success) {
    throw new Error("Failed to delete Event");
  }
};

export const updateEventById = async (
  env: Env["Bindings"],
  eventId: string,
  newEvent: TEventUpdate,
): Promise<TEventSelect> => {
  const db = await createDB(env);
  const event = {
    ...newEvent,
    updatedAt: new Date(),
  };
  const result = await db
    .update(Events)
    .set(event)
    .where(eq(Events.id, eventId))
    .returning();
  if (result.length <= 0) {
    throw new Error("Failed to update Event");
  }
  return result[0];
};

export const getResponsesByEventId = async (
  env: Env["Bindings"],
  eventId: string,
): Promise<TResponseSelect[]> => {
  const db = await createDB(env);
  const responses = db
    .select()
    .from(Responses)
    .where(eq(Responses.eventId, eventId));

  return responses;
};

export const getAvailabilityByEventId = async (
  env: Env["Bindings"],
  eventId: string,
): Promise<TAvailabilitySelect[]> => {
  const db = await createDB(env);
  const avaialbility = await db
    .select()
    .from(Availability)
    .innerJoin(Responses, eq(Availability.responseId, Responses.id))
    .where(eq(Responses.eventId, eventId));

  return avaialbility.map((ele) => ele.availability);
};

export const deleteExpiredEvents = async (
  env: Env["Bindings"],
): Promise<void> => {
  const db = await createDB(env);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 15);
  const cutoffDateISO = cutoffDate.toISOString();

  const result = await db
    .delete(Events)
    .where(
      and(
        gt(sql`json_array_length(${Events.dates})`, 0),

        lte(
          sql`json_extract(${Events.dates}, '$[' || (json_array_length(${Events.dates}) - 1) || '].end')`,
          cutoffDateISO,
        ),
      ),
    )
    .returning();

  console.log(`Delete ${result.length} expired events`);
  console.log(JSON.stringify(result));
};
