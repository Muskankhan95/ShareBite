export type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  type: "api_error" | "auth_failure" | "db_failure" | "ai_failure" | "map_failure" | "security_alert";
  message: string;
  context?: Record<string, any>;
}

// Safely append to log file only in full Node.js environment (not Edge runtime)
function appendToFile(line: string) {
  if (typeof process !== "undefined" && !process.env.NEXT_RUNTIME) {
    try {
      // Dynamic require to prevent Edge bundler from pulling in 'fs'
      const fs = require("fs");
      const path = require("path");
      const logsDir = process.env.VERCEL
        ? path.join("/tmp", "logs")
        : path.join(process.cwd(), "logs");
      const auditFile = path.join(logsDir, "sharebite-audit.log");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      fs.appendFileSync(auditFile, line + "\n", "utf8");
    } catch {
      // Ignore if in restricted runtime
    }
  }
}

/**
 * Strips sensitive data (passwords, tokens, credentials, full PII)
 */
function sanitizeContext(data: any): any {
  if (!data || typeof data !== "object") return data;
  const sanitized = { ...data };

  const SENSITIVE_KEYS = [
    "password",
    "password_hash",
    "passwordHash",
    "token",
    "auth_token",
    "secret",
    "jwt",
    "apiKey",
    "api_key",
    "authorization",
  ];

  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "string" && sanitized[key].includes("@")) {
      // Partially mask emails (e.g. j***@domain.com)
      sanitized[key] = sanitized[key].replace(/^(.{2})(.*)(@.*)$/, "$1***$3");
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeContext(sanitized[key]);
    }
  }

  return sanitized;
}

function writeLog(payload: LogPayload) {
  const line = JSON.stringify(payload);

  if (payload.level === "error") {
    console.error(`[ShareBite Monitoring - ERROR] [${payload.type}] ${payload.message}`, payload.context || "");
  } else if (payload.level === "warn") {
    console.warn(`[ShareBite Monitoring - WARN] [${payload.type}] ${payload.message}`, payload.context || "");
  } else {
    console.log(`[ShareBite Monitoring - INFO] [${payload.type}] ${payload.message}`, payload.context || "");
  }

  appendToFile(line);
}

export class MonitoringLogger {
  /**
   * Log API Errors without leaking internal stack traces to users
   */
  static logApiError(path: string, method: string, error: any, ip?: string) {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "error",
      type: "api_error",
      message: `API Route Error: ${method} ${path}`,
      context: {
        error: error?.message || String(error),
        ip: ip || "unknown",
      },
    });
  }

  /**
   * Log Authentication Failures (brute force protection & audit)
   * Never logs passwords or raw credentials!
   */
  static logAuthFailure(emailOrIdentifier: string, reason: string, ip?: string) {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "warn",
      type: "auth_failure",
      message: `Authentication Failed: ${reason}`,
      context: sanitizeContext({
        target: emailOrIdentifier,
        ip: ip || "unknown",
      }),
    });
  }

  /**
   * Log Database Failures
   */
  static logDatabaseFailure(operation: string, error: any) {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "error",
      type: "db_failure",
      message: `Database Operation Failure: ${operation}`,
      context: {
        error: error?.message || String(error),
      },
    });
  }

  /**
   * Log AI Service Failures and Fallback Transitions
   */
  static logAiFailure(feature: string, error: any, isFallback: boolean) {
    writeLog({
      timestamp: new Date().toISOString(),
      level: isFallback ? "warn" : "error",
      type: "ai_failure",
      message: `AI Feature [${feature}] encountered issue. Fallback active: ${isFallback}`,
      context: {
        error: error?.message || String(error),
      },
    });
  }

  /**
   * Log Mapping / Geocoding Service Failures
   */
  static logMapFailure(service: string, error: any) {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "warn",
      type: "map_failure",
      message: `Map/Geocoding Service Issue: ${service}`,
      context: {
        error: error?.message || String(error),
      },
    });
  }
}
