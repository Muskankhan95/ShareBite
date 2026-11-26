import fs from "fs";
import path from "path";

const targetDirs = ["src", "public", ".env.development", ".env.production", ".env.staging", ".env.example", "README.md", "docker-compose.yml", "Dockerfile"];

let modifiedFiles = 0;
let replacementCount = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // 1. Tagged Logo spans
  content = content.replace(/Food<span className="text-emerald-([0-9]{3})">Rescue<\/span>/g, 'Share<span className="text-emerald-$1">Bite</span>');
  content = content.replace(/Food<span className="text-green-([0-9]{3})">Rescue<\/span>/g, 'Share<span className="text-green-$1">Bite</span>');

  // 2. Specific domain & phrases
  content = content.replace(/foodrescue\.org/g, "sharebite.org");
  content = content.replace(/ShareBite\s+Map/g, "ShareBite Map");
  content = content.replace(/ShareBite\s+Assistant/g, "ShareBite Assistant");
  content = content.replace(/ShareBite\s+AI\s+Assistant/g, "ShareBite AI Assistant");
  content = content.replace(/ShareBite\s+Smart\s+Matching/g, "ShareBite Smart Matching");

  // 3. Exact case variants
  content = content.replace(/ShareBite/g, "ShareBite");
  content = content.replace(/ShareBite/g, "ShareBite");
  content = content.replace(/SHAREBITE/g, "SHAREBITE");

  // Lowercase references where safe (e.g. sharebite-audit -> sharebite-audit, foodrescue.db -> sharebite.db or keep)
  content = content.replace(/sharebite-audit/g, "sharebite-audit");
  content = content.replace(/sharebite-backup/g, "sharebite-backup");

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    modifiedFiles++;
    console.log(`✓ Updated: ${path.relative(process.cwd(), filePath)}`);
  }
}

function walk(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (["node_modules", ".next", ".git", "data", "backups", "logs"].includes(item)) continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (/\.(tsx|ts|js|mjs|json|md|html|yml|yaml|env)$/.test(item) || item.startsWith(".env")) {
      processFile(full);
    }
  }
}

walk(process.cwd());

console.log(`\nSuccessfully updated ${modifiedFiles} files to 'ShareBite'!`);
