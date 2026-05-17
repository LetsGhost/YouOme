import "dotenv/config";

export const env = {
  APP_NAME: process.env.APP_NAME || "YouOme Backend",
  PORT: Number(process.env.PORT) || 3000,
  MONGO_URI: process.env.MONGO_URI!,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  BYPASS_AUTH: process.env.BYPASS_AUTH || "false",
  SYSTEM_ADMIN_EMAILS: process.env.SYSTEM_ADMIN_EMAILS || process.env.SYSTEM_ADMIN_EMAIL || "",

  MONGO_USER: process.env.MONGO_USER,
  MONGO_PASSWORD: process.env.MONGO_PASSWORD,
  MONGO_AUTH_SOURCE: process.env.MONGO_AUTH_SOURCE || "admin",

  // Redis config
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || "6379",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: process.env.REDIS_DB || "0",

  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,

  // EMAIL
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  EMAIL_FROM: process.env.EMAIL_FROM!,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO!,
  EMAIL_TOKEN_SECRET: process.env.EMAIL_TOKEN_SECRET!,
  EMAIL_TOKEN_EXPIRES_IN: process.env.EMAIL_TOKEN_EXPIRES_IN || "24h",
};