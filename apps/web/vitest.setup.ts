import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, vi } from "vitest";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock cloudflare:workers module
vi.mock("cloudflare:workers", () => ({
  DurableObject: class DurableObject {},
}));

// Mock @hono-rate-limiter/cloudflare module
vi.mock("@hono-rate-limiter/cloudflare", () => ({}));
