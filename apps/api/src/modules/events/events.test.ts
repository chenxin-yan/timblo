import { env } from "cloudflare:test";
import { testClient } from "hono/testing";
import { describe, it } from "vitest";

import createApp from "@api/lib/app";
import routes from "./events.routes";

const hono = testClient(createApp().route("/", routes), env);

describe("Events Routes", () => {
  it.todo("");
});
