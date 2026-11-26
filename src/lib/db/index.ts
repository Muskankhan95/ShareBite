import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { runMigrations } from "./migrations";
import { ENV } from "@/lib/config/env";

let dbInstance: Database.Database | null = null;

const configuredPath = ENV.DATABASE.PATH;
const DB_PATH = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.join(process.cwd(), configuredPath);
const DATA_DIR = path.dirname(DB_PATH);

/**
 * Returns the singleton SQLite database instance.
 * Automatically runs DDL migrations and seed initialization on first access.
 * Seamlessly handles serverless cloud environments (like Vercel / AWS Lambda)
 * by redirecting the SQLite file to /tmp if the working directory is read-only.
 */
export function getDb(): Database.Database {
  if (!dbInstance) {
    let activeDbPath = DB_PATH;
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (isServerless) {
      activeDbPath = path.join("/tmp", "sharebite.db");
      const tmpDir = path.dirname(activeDbPath);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // If existing database file exists in project bundle, copy to /tmp to retain pre-seeded data
      if (!fs.existsSync(activeDbPath)) {
        const potentialSources = [
          DB_PATH,
          path.join(process.cwd(), "data", "foodrescue.db"),
          path.join(process.cwd(), "data", "foodrescue-production.db"),
        ];

        for (const src of potentialSources) {
          if (fs.existsSync(src)) {
            try {
              fs.copyFileSync(src, activeDbPath);
              break;
            } catch {
              // Ignore copy failure and fallback to migration initialization
            }
          }
        }
      }
    } else {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    }

    dbInstance = new Database(activeDbPath);
    
    // Enable Foreign Keys and Write-Ahead Logging for performance and concurrency
    dbInstance.pragma("foreign_keys = ON");
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("synchronous = NORMAL");

    // Initialize Schema & Seed Data
    runMigrations(dbInstance);
  }

  return dbInstance;
}

export default getDb;
