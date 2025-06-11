import createApp from "./lib/app";
import configureOpenAPI from "./lib/openApi";
import registerRoutes from "./lib/routes";
import type { Env } from "./lib/types";
import { onError } from "./middlewares/error.middleware";
import { deleteExpiredEvents } from "./modules/events";

const app = registerRoutes(createApp());

configureOpenAPI(app);

app.onError(onError);

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env["Bindings"],
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log("Running cron job");
    await deleteExpiredEvents(env);
  },

  async fetch(request: Request, env: Env) {
    return await app.fetch(request, env);
  },
};
