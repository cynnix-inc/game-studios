import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');

const snapshotRoot = path.join(appRoot, 'figma-make/ultimate-sudoku');
const manifestPath = path.join(snapshotRoot, 'MANIFEST.json');

function listFilesUnder(dirAbs) {
  /** @type {string[]} */
  const out = [];
  /** @type {string[]} */
  const stack = [dirAbs];

  while (stack.length > 0) {
    const cur = stack.pop();
    if (!cur) continue;
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(cur, e.name);
      if (e.isDirectory()) {
        stack.push(abs);
      } else if (e.isFile()) {
        out.push(abs);
      }
    }
  }
  return out;
}

function toPosixRel(rootAbs, fileAbs) {
  const rel = path.relative(rootAbs, fileAbs);
  return rel.split(path.sep).join('/');
}

if (!fs.existsSync(snapshotRoot)) {
  throw new Error(`Missing snapshot folder: ${snapshotRoot}`);
}
if (!fs.existsSync(manifestPath)) {
  throw new Error(`Missing manifest: ${manifestPath}`);
}

/** @type {any} */
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const sourceDir = path.join(snapshotRoot, 'source');
const imagesDir = path.join(snapshotRoot, 'images');

const sourceFiles = fs.existsSync(sourceDir) ? listFilesUnder(sourceDir).map((p) => toPosixRel(snapshotRoot, p)).sort() : [];
const imageFiles = fs.existsSync(imagesDir) ? listFilesUnder(imagesDir).map((p) => toPosixRel(snapshotRoot, p)).sort() : [];

manifest.exportedAt = new Date().toISOString();
manifest.sourceFiles = sourceFiles;
manifest.imageFiles = imageFiles;

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Updated ${manifestPath}`);
console.log(`sourceFiles: ${sourceFiles.length}`);
console.log(`imageFiles: ${imageFiles.length}`);


