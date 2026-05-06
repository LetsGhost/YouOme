import { createApp } from "./bootstrap/express";
import { connectDatabase } from "./bootstrap/database";
import { env } from "./config/env";
import { logger } from "./modules/common/logger/logger";
import { printStartupBanner } from "./modules/common/logger/banner";

(async () => {
  try {
    // Print banner first
    printStartupBanner(env.PORT);

    // Connect to MongoDB
    await connectDatabase(env.MONGO_URI);

    // Create app and connect Redis
    const app = await createApp();

    // Start server
    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`API Documentation available at http://localhost:${env.PORT}/api-docs`);
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
})();
