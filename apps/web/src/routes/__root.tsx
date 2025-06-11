import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "@web/components/header";
import { ThemeProvider } from "@web/components/theme-provider";
import { Toaster } from "@web/components/ui/sonner";

export const Route = createRootRoute({
  component: () => (
    <>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Header navItems={[{ name: "Home", path: "/" }]} />
        <main className="mx-auto mt-4 max-w-4xl">
          <Outlet />
        </main>
        <Toaster richColors />
        <TanStackRouterDevtools />
      </ThemeProvider>
    </>
  ),
});
