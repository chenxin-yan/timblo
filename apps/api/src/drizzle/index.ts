import type { Env } from "@api/lib/types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

const createDB = async (env: Env["Bindings"]) => {
  return drizzle(env.DB, { schema });
};

export default createDB;
