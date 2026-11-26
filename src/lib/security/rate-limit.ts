import { NextRequest } from "next/server";
import { ENV } from "@/lib/config/env";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup expired entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    });
  }, 300000);
}

export interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
  keyPrefix?: string;
}

/**
 * In-memory sliding window rate limiter
 */
export function rateLimit(
  req: NextRequest,
  options?: RateLimitOptions
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const limit = options?.limit || ENV.SECURITY.RATE_LIMIT_MAX;
  const windowMs = options?.windowMs || ENV.SECURITY.RATE_LIMIT_WINDOW_MS;
  const prefix = options?.keyPrefix || "rl";

  // Extract client IP address securely
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(key, newRecord);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil(newRecord.resetTime / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: Math.ceil(record.resetTime / 1000),
  };
}
