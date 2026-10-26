import { app } from "./app.js";
import { config } from "./shared/config/index.js";
import { logger } from "./shared/utils/logger.js";

const server = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, environment: config.NODE_ENV },
    "API server listening",
  );
});

function shutdown(signal) {
  logger.info({ signal }, "Shutting down API server");
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
