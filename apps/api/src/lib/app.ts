import { formatZodErorr } from "@api/middlewares/error.middleware";
import { cloudflareRateLimiter } from "@hono-rate-limiter/cloudflare";
import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { Env } from "./types";

export const createRouter = () => {
  return new OpenAPIHono<Env>({
    defaultHook: (result) => {
      if (!result.success) {
        throw new HTTPException(400, {
          cause: result.error,
          message: `Invalid ${result.target}: ${formatZodErorr(result.error)}`,
        });
      }
    },
  });
};

const createApp = () => {
  const app = createRouter();

  app
    .use("*", (c, next) => {
      if (c.req.path.startsWith("/api")) {
        return next();
      }
      // SPA redirect to /index.html
      const requestUrl = new URL(c.req.raw.url);
      return c.env.ASSETS.fetch(new URL("/index.html", requestUrl.origin));
    })
    .use(
      cloudflareRateLimiter<Env>({
        rateLimitBinding: (c) => c.env.RATE_LIMITER,
        keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "", // Method to generate custom identifiers for clients.
      }),
    );

  return app;
};

export default createApp;
