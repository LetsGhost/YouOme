import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import "express-async-errors";

import { httpLogger } from "../modules/common/logger/http.logger";
import { errorHandler } from "../middleware/error.middleware";
import { requestContextMiddleware } from "../middleware/request-context.middleware";
import { createRateLimiter, createAuthRateLimiter } from "../middleware/rate-limit.middleware";
import { registerControllers } from "../modules/common/registry/controller/registry.controller";
import { registerEventHandlers } from "../modules/common/messaging/event-handler-registry";
import { registerScheduledJobs } from "../modules/common/scheduler/scheduler-registry";
import { jobScheduler } from "../modules/common/scheduler/scheduler";
import { initWebsocketServer } from "../modules/common/websocket/websocket.server";
import { swaggerSpec } from "../config/swagger";
import { corsConfig } from "../config/cors";
import { env } from "../config/env";
import { redisService } from "../modules/redis/service/redis.service";
import { backendStateService } from "../modules/redis/service/backend-state.service";

export async function createApp() {
  const app = express();

  // Connect to Redis before registering controllers
  await redisService.connect();

  // Security and parsing middleware
  app.use(cors(corsConfig));
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request-id correlation, mounted before the request logger so log lines carry it
  app.use(requestContextMiddleware);

  // Apply rate limiting to all API routes (disabled in dev mode)
  app.use("/api/", createRateLimiter());

  // More strict rate limiting for authentication endpoints
  app.use("/api/auth/", createAuthRateLimiter());

  app.use(httpLogger);

  // Swagger documentation (only in development)
  if (env.NODE_ENV === "development") {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get("/api-docs.json", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });
  }

  // Health check endpoint
  app.get("/health", async (_req, res) => {
    const isRedisReady = redisService.isReady();
    const isDbReady = mongoose.connection.readyState === 1;
    await backendStateService.recordHealthCheck();

    res.status(isDbReady ? 200 : 503).json({
      status: isDbReady ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: isRedisReady ? "connected" : "disconnected",
      database: isDbReady ? "connected" : "disconnected",
      environment: env.NODE_ENV,
    });
  });

  // Register all controllers, event handlers, and scheduled jobs
  await registerControllers(app);
  await registerEventHandlers();
  await registerScheduledJobs();
  await jobScheduler.startScheduler();

  // Error handler (must be last)
  app.use(errorHandler);

  // Wrap in a raw HTTP server so the websocket server can share the same port
  const server = http.createServer(app);
  initWebsocketServer(server);

  return server;
}