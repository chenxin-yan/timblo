import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ZodError } from "zod";

export const ZApiErrorResponse = z.object({
  error: z.string().openapi({ example: "Internal Server Error" }),
  status: z.number().openapi({ example: 500 }),
  message: z.string().openapi({ example: "An unexpected error occurred" }),
});

export const formatZodErorr = (err: ZodError) => {
  const issues = err.issues;
  const error = new Map();
  for (const issue of issues) {
    error.set(issue.path, issue.message);
  }
  return JSON.stringify(Object.fromEntries(error));
};

export const onError = (err: Error | HTTPException, c: Context) => {
  console.error(err);

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.name,
        status: err.status,
        message: err.message,
      },
      err.status,
    );
  }

  return c.json(
    {
      error: "Internal Server Error",
      status: 500,
      message: "An unexpected error occurred",
    },
    500,
  );
};
