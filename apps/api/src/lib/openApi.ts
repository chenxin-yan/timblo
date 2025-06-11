import { Scalar } from "@scalar/hono-api-reference";
import json from "../../../../package.json";
import type { HonoApp } from "./types";

export default function configureOpenAPI(app: HonoApp) {
  app.doc("/openapi", {
    openapi: "3.0.0",
    info: {
      version: json.version,
      title: "Timblo API",
    },
  });

  app.get(
    "/docs",
    Scalar({
      url: "/api/openapi",
      pageTitle: "Timblo API",
      theme: "fastify",
    }),
  );
}
