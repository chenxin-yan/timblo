import type { routes } from "@timblo/api";
import { hc } from "hono/client";

const client = hc<routes>("/");
export type ApiClient = typeof client;

const apiClient = (...args: Parameters<typeof hc>): ApiClient =>
  hc<routes>(...args);

export default apiClient;
