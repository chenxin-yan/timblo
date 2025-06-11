import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { type UserConfig, defineConfig } from "vite";

import { resolve } from "node:path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
  },
  resolve: {
    alias: {
      "@web": resolve(__dirname, "./src"),
      "@api": resolve(__dirname, "../api/src/"),
      "cloudflare:workers": resolve(
        __dirname,
        "./src/lib/cloudflare-workers.ts",
      ),
    },
  },
  optimizeDeps: {
    exclude: ["@hono-rate-limiter/cloudflare"],
  },
  build: {
    outDir: "../api/public",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
} as UserConfig);
