import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: "./.env" });

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    url: process.env.DEV_DATABASE_URL!,
  },
});
