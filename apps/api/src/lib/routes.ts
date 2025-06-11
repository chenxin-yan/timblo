import { eventRoutes } from "@api/modules/events";
import { responseRoutes } from "@api/modules/responses";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { createRouter } from "./app";
import type { HonoApp } from "./types";

const registerRoutes = (app: HonoApp) => {
  return app
    .basePath("/api")
    .openapi(
      createRoute({
        method: "get",
        path: "/health",
        tags: ["health"],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: z.object({
                  ok: z.boolean(),
                  rateLimiter: z.boolean(),
                }),
              },
            },
            description: "health check",
          },
        },
      }),
      (c) => {
        return c.json(
          {
            ok: true,
            rateLimiter: c.var.rateLimit,
          },
          200,
        );
      },
    )
    .route("/", eventRoutes)
    .route("/", responseRoutes);
};

export const routes = registerRoutes(createRouter());

export type routes = typeof routes;

export default registerRoutes;
