import "dotenv/config";

export const env = {
  APP_NAME: process.env.APP_NAME || "YouOme Backend",
  PORT: Number(process.env.PORT) || 3000,
  // Public frontend origin, used to build verification/reset links (e.g. https://app.youome.de).
  // Also consumed directly by infra/docker-compose.prod.yml for compose ${VAR} substitution.
  APP_URL: process.env.APP_URL || "http://localhost:5173",
  MONGO_URI: process.env.MONGO_URI!,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || "7d",
  REFRESH_TOKEN_TTL_REMEMBER_ME: process.env.REFRESH_TOKEN_TTL_REMEMBER_ME || "60d",
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

  // RATE LIMITING
  API_RATE_LIMIT_WINDOW_MS: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  API_RATE_LIMIT_MAX: Number(process.env.API_RATE_LIMIT_MAX) || 1000,
  AUTH_RATE_LIMIT_WINDOW_MS: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,

  // Garage (S3-compatible object storage) - avatars/group images
  GARAGE_ENDPOINT: process.env.GARAGE_ENDPOINT || "http://localhost:3900",
  GARAGE_REGION: process.env.GARAGE_REGION || "garage",
  GARAGE_BUCKET: process.env.GARAGE_BUCKET || "avatars",
  GARAGE_ACCESS_KEY_ID: process.env.GARAGE_ACCESS_KEY_ID || "",
  GARAGE_SECRET_ACCESS_KEY: process.env.GARAGE_SECRET_ACCESS_KEY || "",

  // email-service (standalone Resend wrapper, ../email-service) - shared secret must match
  // that service's own EMAIL_SERVICE_API_KEY.
  EMAIL_SERVICE_URL: process.env.EMAIL_SERVICE_URL || "http://localhost:4000",
  EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY || "",
};