import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import ErrorPage from "./components/error-page.tsx";
import { Illustration, NotFound } from "./components/not-found.tsx";
import reportWebVitals from "./reportWebVitals.ts";
import "./styles.css";

// Create a client
const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent() {
    return (
      <div className="relative flex w-full flex-col justify-center bg-background p-6 md:p-18">
        <div className="relative mx-auto w-full max-w-5xl">
          <Illustration className="absolute inset-0 h-[50vh] w-full text-foreground opacity-[0.04] dark:opacity-[0.03]" />
          <NotFound
            title="Page not found"
            description="The page you’re looking for doesn’t exist"
          />
        </div>
      </div>
    );
  },
  defaultErrorComponent(props) {
    return (
      <div className="relative flex w-full flex-col justify-center bg-background p-6 md:p-10">
        <ErrorPage error={props.error} />
      </div>
    );
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
