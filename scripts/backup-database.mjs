import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const configuredPath = process.env.DATABASE_PATH || "./data/foodrescue.db";
const dbPath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.join(process.cwd(), configuredPath);

if (!fs.existsSync(dbPath)) {
  console.error(`❌ Source database file not found at: ${dbPath}`);
  process.exit(1);
}

const backupDir = path.join(process.cwd(), "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const targetBackupPath = path.join(backupDir, `sharebite-backup-${timestamp}.db`);

console.log(`[Backup] Initiating SQLite safe online backup...`);
console.log(`  Source: ${dbPath}`);
console.log(`  Target: ${targetBackupPath}`);

const db = new Database(dbPath);

try {
  // SQLite safe online backup API (safe during active writes and WAL mode)
  await db.backup(targetBackupPath, {
    progress({ totalPages, remainingPages }) {
      const progress = Math.round(((totalPages - remainingPages) / totalPages) * 100);
      process.stdout.write(`\r  Progress: ${progress}% (${totalPages - remainingPages}/${totalPages} pages)`);
      return 100;
    },
  });

  console.log(`\n✅ Database backup completed successfully!`);
  const stats = fs.statSync(targetBackupPath);
  console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);

  // Retention cleanup: keep the latest 30 backups
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("sharebite-backup-") && f.endsWith(".db"))
    .map((f) => path.join(backupDir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  const MAX_BACKUPS = 30;
  if (files.length > MAX_BACKUPS) {
    const toRemove = files.slice(MAX_BACKUPS);
    for (const f of toRemove) {
      fs.unlinkSync(f);
      console.log(`   Pruned older backup: ${path.basename(f)}`);
    }
  }
} catch (err) {
  console.error("\n❌ Database backup failed:", err);
  process.exit(1);
} finally {
  db.close();
}
