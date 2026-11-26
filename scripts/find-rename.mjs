import fs from "fs";
import path from "path";

const filesToUpdate = [];

function walk(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (["node_modules", ".next", ".git", "data", "backups", "logs"].includes(item)) continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (/\.(tsx|ts|js|mjs|json|md|html)$/.test(item)) {
      const content = fs.readFileSync(full, "utf8");
      if (/foodrescue|food\s+rescue/i.test(content)) {
        filesToUpdate.push(full);
      }
    }
  }
}

walk(process.cwd());

console.log(`Found ${filesToUpdate.length} files referencing ShareBite:`);
for (const f of filesToUpdate) {
  console.log("  " + path.relative(process.cwd(), f));
}
