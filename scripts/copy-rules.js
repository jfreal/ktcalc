// Copies the canonical rules Markdown (rules/*.md) into public/rules/ so the
// running app can fetch and render them in-app. rules/ stays the single source
// of truth; public/rules/ is generated (gitignored) and refreshed on every
// start/build via the prestart/prebuild npm hooks.
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'rules');
const outDir = path.join(repoRoot, 'public', 'rules');

fs.mkdirSync(outDir, { recursive: true });

const mdFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith('.md'));
for (const file of mdFiles) {
  fs.copyFileSync(path.join(srcDir, file), path.join(outDir, file));
}

console.log(`copy-rules: copied ${mdFiles.length} file(s) to public/rules/`);
