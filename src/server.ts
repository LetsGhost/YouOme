import mongoose from "mongoose";

import { createApp } from "./bootstrap/express";
import { connectDatabase } from "./bootstrap/database";
import { env } from "./config/env";
import { logger } from "./modules/common/logger/logger";
import { printStartupBanner } from "./modules/common/logger/banner";
import { jobScheduler } from "./modules/common/scheduler/scheduler";
import { redisService } from "./modules/redis/service/redis.service";

const SHUTDOWN_TIMEOUT_MS = 10000;

(async () => {
  try {
    // Print banner first
    printStartupBanner(env.PORT);

    // Connect to MongoDB
    await connectDatabase(env.MONGO_URI);

    // Create app and connect Redis
    const app = await createApp();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`API Documentation available at http://localhost:${env.PORT}/api-docs`);
    });

    let shuttingDown = false;
    const shutdown = (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;

      logger.info(`${signal} signal received: closing HTTP server`);

      const forceExitTimer = setTimeout(() => {
        logger.error("Graceful shutdown timed out, forcing exit");
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      forceExitTimer.unref();

      server.close(async (err) => {
        if (err) {
          logger.error("Error while closing HTTP server", { error: err.message });
        }

        try {
          await jobScheduler.stopScheduler();
          await redisService.disconnect();
          await mongoose.disconnect();
        } catch (shutdownError) {
          logger.error("Error during graceful shutdown", {
            error: shutdownError instanceof Error ? shutdownError.message : String(shutdownError),
          });
        } finally {
          clearTimeout(forceExitTimer);
          process.exit(0);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
})();
