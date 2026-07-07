import { createClient, RedisClientType } from "redis";

import { logger } from "../../common/logger/logger";
import { redisConfig } from "../config/redis.config";

const MAX_CONNECT_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY_MS = 1000;

export class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
      try {
        const url = `redis://:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}/${redisConfig.db}`;

        this.client = createClient({
          url,
        });

        this.client.on("error", (err) =>
          logger.error("Redis error", { error: err.message })
        );
        this.client.on("connect", () =>
          logger.info("Redis connected", {
            host: redisConfig.host,
            port: redisConfig.port,
          })
        );

        await this.client.connect();
        this.isConnected = true;
        return;
      } catch (error) {
        logger.error(`Failed to connect to Redis (attempt ${attempt}/${MAX_CONNECT_ATTEMPTS})`, {
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

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis disconnected");
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected");
    }

    const stringValue = typeof value === "string" ? value : JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected");
    }

    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected");
    }

    await this.client.del(key);
  }

  async getDel<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected");
    }

    const value = await this.client.getDel(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected");
    }

    return this.client.keys(pattern);
  }

  async hSet(
    key: string,
    field: string,
    value: unknown
  ): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected");
    }

    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    await this.client.hSet(key, field, stringValue);
  }

  async hGet<T>(key: string, field: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected");
    }

    const value = await this.client.hGet(key, field);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async hGetAll<T extends Record<string, unknown>>(key: string): Promise<T> {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected");
    }

    const result = await this.client.hGetAll(key);
    const parsed: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(result)) {
      try {
        parsed[field] = JSON.parse(value as string);
      } catch {
        parsed[field] = value;
      }
    }

    return parsed as T;
  }

  async hDel(key: string, field: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected");
    }

    await this.client.hDel(key, field);
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const redisService = new RedisService();
