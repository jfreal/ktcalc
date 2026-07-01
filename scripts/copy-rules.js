// Copies the rules Markdown rendered in-app (rules/<file>) into public/rules/ so
// the running app can fetch them. rules/ stays the single source of truth;
// public/rules/ is generated (gitignored) and refreshed on every start/build via
// the prestart/prebuild(:react) npm hooks.
//
// Only the docs actually surfaced in-app are published — an explicit allowlist so
// internal notes (e.g. rules/README.md) are never accidentally exposed.
const fs = require('fs');
const path = require('path');

const DOCS = ['COMBAT_RULES.md', 'FIGHT_RULES.md', 'WEAPON_RULES.md'];

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'rules');
const outDir = path.join(repoRoot, 'public', 'rules');

if (!fs.existsSync(srcDir)) {
  console.error(`copy-rules: source directory not found: ${srcDir}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

let copied = 0;
for (const file of DOCS) {
  const from = path.join(srcDir, file);
  if (!fs.existsSync(from)) {
    console.error(`copy-rules: expected rules doc not found: ${from}`);
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(outDir, file));
  copied += 1;
}

console.log(`copy-rules: copied ${copied} file(s) to public/rules/`);
