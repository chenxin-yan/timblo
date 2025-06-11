import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@web/components/home";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return <Home />;
}
