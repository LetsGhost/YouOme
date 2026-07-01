import mongoose from "mongoose";

import { logger } from "../modules/common/logger/logger";
import { env } from "../config/env";

const MAX_CONNECT_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY_MS = 1000;

export async function connectDatabase(uri: string) {
  for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(uri, {
        user: env.MONGO_USER,
        pass: env.MONGO_PASSWORD,
        authSource: env.MONGO_AUTH_SOURCE,
      });
      logger.info("MongoDB connected");
      return;
    } catch (error) {
      logger.error(`Failed to connect to MongoDB (attempt ${attempt}/${MAX_CONNECT_ATTEMPTS})`, {
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt === MAX_CONNECT_ATTEMPTS) {
        throw error;
      }

      const delayMs = INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
