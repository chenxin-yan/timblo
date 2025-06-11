import createDB from "@api/drizzle";
import { Responses } from "@api/drizzle/schema";
import type { Env } from "@api/lib/types";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type {
  TResponseInsert,
  TResponseSelect,
  TResponseUpdate,
} from "./responses.schemas";

export const createNewResponse = async (
  env: Env["Bindings"],
  response: TResponseInsert,
): Promise<TResponseSelect> => {
  const db = await createDB(env);

  // Check if name or email already exists for this event
  const existingResponses = await db
    .select()
    .from(Responses)
    .where(eq(Responses.eventId, response.eventId));

  const existingNames = new Set();
  const existingEmails = new Set();

  for (const response of existingResponses) {
    existingNames.add(response.name);
    existingEmails.add(response.email);
  }

  if (existingNames.has(response.name)) {
    throw new HTTPException(409, {
      message: "A response with this name already exists",
    });
  }

  if (existingEmails.has(response.email)) {
    throw new HTTPException(409, {
      message: "A response with this email already exists",
    });
  }

  const result = await db.insert(Responses).values(response).returning();

  if (result.length <= 0) {
    throw new Error("Failed to create response");
  }

  return result[0];
};

export const getResponseById = async (
  env: Env["Bindings"],
  responseId: string,
): Promise<TResponseSelect> => {
  const db = await createDB(env);
  const result = await db
    .select()
    .from(Responses)
    .where(eq(Responses.id, responseId));

  if (result.length <= 0) {
    throw new HTTPException(404, { message: "Response not found" });
  }

  return result[0];
};

export const updateResponseById = async (
  env: Env["Bindings"],
  responseId: string,
  newResponse: TResponseUpdate,
): Promise<TResponseSelect> => {
  const db = await createDB(env);
  const response = {
    ...newResponse,
    updatedAt: new Date(),
  };

  const result = await db
    .update(Responses)
    .set(response)
    .where(eq(Responses.id, responseId))
    .returning();

  if (result.length <= 0) {
    throw new HTTPException(404, { message: "Response not found" });
  }
  return result[0];
};

export const deleteResponseById = async (
  env: Env["Bindings"],
  responseId: string,
): Promise<void> => {
  const db = await createDB(env);
  const result = await db
    .delete(Responses)
    .where(eq(Responses.id, responseId))
    .limit(1)
    .returning();

  if (result.length <= 0) {
    throw new HTTPException(404, { message: "Response not found" });
  }
};
