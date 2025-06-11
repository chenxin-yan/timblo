import createDB from "@api/drizzle";
import { Availability } from "@api/drizzle/schema";
import type { Env } from "@api/lib/types";
import { eq } from "drizzle-orm";
import type {
  TAvailabilityInsertArray,
  TAvailabilitySelect,
} from "./availability.schemas";

export const createNewAvailability = async (
  env: Env["Bindings"],
  responseId: string,
  availability: TAvailabilityInsertArray,
): Promise<TAvailabilitySelect[]> => {
  const db = await createDB(env);
  const result = await db
    .insert(Availability)
    .values(
      availability.map((val) => {
        return {
          ...val,
          responseId,
        };
      }),
    )
    .returning();

  if (result.length <= 0) {
    throw new Error("Failed to create event");
  }

  return result;
};

export const deleteAvailabilityByResponse = async (
  env: Env["Bindings"],
  responseId: string,
): Promise<void> => {
  const db = await createDB(env);
  const result = await db
    .delete(Availability)
    .where(eq(Availability.responseId, responseId));
  if (!result.success) {
    throw new Error("Failed to delete availability");
  }
};
