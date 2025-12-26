import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');

const snapshotRoot = path.join(appRoot, 'figma-make/ultimate-sudoku');
const manifestPath = path.join(snapshotRoot, 'MANIFEST.json');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function warn(msg) {
  console.warn(msg);
}

function info(msg) {
  console.log(msg);
}

if (!fs.existsSync(snapshotRoot)) {
  fail(`Missing snapshot folder: ${snapshotRoot}`);
}

if (!fs.existsSync(manifestPath)) {
  fail(`Missing manifest: ${manifestPath}`);
}

/** @type {{ sourceFiles: string[], imageFiles: string[], exportedAt: string | null }} */
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const missing = [];
for (const rel of [...(manifest.sourceFiles ?? []), ...(manifest.imageFiles ?? [])]) {
  const abs = path.join(snapshotRoot, rel);
  if (!fs.existsSync(abs)) missing.push(rel);
}

info(`Figma Make snapshot: ${snapshotRoot}`);
info(`exportedAt: ${manifest.exportedAt ?? '(unset)'}`);
info(`sourceFiles: ${(manifest.sourceFiles ?? []).length}`);
info(`imageFiles: ${(manifest.imageFiles ?? []).length}`);

if (missing.length > 0) {
  warn(`Missing ${missing.length} files referenced by MANIFEST.json:`);
  for (const rel of missing.slice(0, 50)) warn(`- ${rel}`);
  if (missing.length > 50) warn(`...and ${missing.length - 50} more`);
  process.exit(2);
}

info('OK: snapshot matches manifest.');


