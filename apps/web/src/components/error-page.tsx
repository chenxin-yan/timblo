import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

const ErrorPage = ({ error }: { error: unknown }) => {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="absolute inset-0 h-[50vh] w-full text-foreground opacity-[0.04] dark:opacity-[0.03]">
        <AlertTriangle className="h-full w-full" />
      </div>
      <div className="relative z-[1] pt-52 text-center">
        <h1 className="mt-4 text-balance font-semibold text-5xl text-primary tracking-tight sm:text-7xl">
          Something went wrong
        </h1>
        <p className="mt-6 text-pretty font-medium text-lg text-muted-foreground sm:text-xl/8">
          {error instanceof Error
            ? error.message
            : "We encountered an unexpected error. Please try again later."}
        </p>
        <div className="mt-10 flex flex-col gap-x-6 gap-y-3 sm:flex-row sm:items-center sm:justify-center">
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="group"
          >
            <RefreshCcw
              className="ms-0 me-2 opacity-60 transition-transform group-hover:rotate-45"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Refresh page
          </Button>
          <Button className="-order-1 sm:order-none" asChild>
            <a href="/">Take me home</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
