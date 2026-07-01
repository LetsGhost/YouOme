import { CorsOptions } from "cors";

import { env } from "./env";

const isDevelopment = env.NODE_ENV === "development";

const defaultProductionOrigins = [
  "http://localhost:4173",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

const configuredProductionOrigins = (env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedProductionOrigins = configuredProductionOrigins.length
  ? configuredProductionOrigins
  : defaultProductionOrigins;

export const corsConfig: CorsOptions = {
  origin: isDevelopment
    ? "*"
    : (requestOrigin, callback) => {
        if (!requestOrigin || allowedProductionOrigins.includes(requestOrigin)) {
          callback(null, true);
          return;
        }

        callback(
          new Error(
            `CORS blocked origin: ${requestOrigin}. Allowed origins: ${allowedProductionOrigins.join(", ")}`
          )
        );
      },
  
  credentials: true,
  
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  
  allowedHeaders: isDevelopment
    ? [
        "Content-Type",
        "Authorization",
        "X-Dev-User-Id",
        "X-Requested-With",
        "X-Request-ID",
        "Accept",
      ]
    : [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Request-ID",
        "Accept",
      ],
  
  exposedHeaders: [
    "X-Total-Count",
    "X-Page-Number",
    "X-Page-Size",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "Retry-After",
  ],
  
  maxAge: 86400, // 24 hours
  
  preflightContinue: false,
};
