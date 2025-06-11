import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: "./.env" });

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const databaseId = process.env.CLOUDFLARE_DATABASE_ID!;
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const token = process.env.CLOUDFLARE_D1_TOKEN!;

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId,
    databaseId,
    token,
  },
});
