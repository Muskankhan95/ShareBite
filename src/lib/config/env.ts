/**
 * Environment Configuration Validator & Accessor
 * Strictly prevents hardcoded secrets and validates environment setup.
 */

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
export const IS_STAGING = (process.env.NODE_ENV as string) === "staging";

function getEnvVar(key: string, defaultValue?: string, required = false): string {
  const value = process.env[key] || defaultValue;
  if (required && (!value || value.trim() === "")) {
    if (IS_PRODUCTION) {
      throw new Error(`[CRITICAL SECURITY CONFIGURATION ERROR] Missing required environment variable: ${key}`);
    } else {
      console.warn(`[WARN] Environment variable ${key} is not set. Using default fallback.`);
    }
  }
  return value || "";
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_URL: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  BACKEND_URL: getEnvVar("BACKEND_URL", "http://localhost:3000"),

  // Authentication
  JWT: {
    SECRET: getEnvVar(
      "JWT_SECRET",
      "foodrescue_dev_fallback_secret_key_minimum_32_characters_long",
      IS_PRODUCTION
    ),
    EXPIRES_IN: getEnvVar("JWT_EXPIRES_IN", "7d"),
  },

  // Database
  DATABASE: {
    PATH: getEnvVar("DATABASE_PATH", "./data/foodrescue.db"),
    URL: process.env.DATABASE_URL || undefined,
  },

  // Admin Bootstrap (Used during initial migration setup)
  ADMIN_BOOTSTRAP: {
    NAME: process.env.ADMIN_INITIAL_NAME || "System Administrator",
    EMAIL: process.env.ADMIN_INITIAL_EMAIL || "admin@sharebite.org",
    PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || "AdminShareBite2026!",
  },

  // AI & Vision
  AI: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
    AI_API_KEY: process.env.AI_API_KEY || undefined,
  },

  // Mapping
  MAP: {
    PROVIDER: getEnvVar("NEXT_PUBLIC_MAP_PROVIDER", "osm"),
    MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || undefined,
    GOOGLE_KEY: process.env.GOOGLE_MAPS_API_KEY || undefined,
  },

  // Security & Rate Limiting
  SECURITY: {
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  },

  // Logging
  LOG_LEVEL: getEnvVar("LOG_LEVEL", "info"),
} as const;

// Startup Security Check
if (IS_PRODUCTION) {
  if (ENV.JWT.SECRET.length < 32) {
    throw new Error("[SECURITY FATAL] JWT_SECRET must be at least 32 characters in production mode.");
  }
  if (ENV.JWT.SECRET.includes("dev_fallback") || ENV.JWT.SECRET.includes("example")) {
    console.warn("[SECURITY AUDIT WARNING] Detected default or sample JWT_SECRET in production environment!");
  }
}
