import type { OpenAPIHono } from "@hono/zod-openapi";

export type Env = {
  Variables: {
    rateLimit: boolean;
  };
  Bindings: {
    ASSETS: Fetcher;
    DB: D1Database;
    RATE_LIMITER: RateLimit;
  };
};

export type HonoApp = OpenAPIHono<Env>;
