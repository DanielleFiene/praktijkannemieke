/**
 * Hernoem bestanden met %3F in de naam naar schone equivalenten.
 * %3Fver=x.y → .ver-x.y (voor .css/.js) of .ver-x.y.ext
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function cleanBasename(name) {
  if (name.includes('%3F')) {
    return name
      .replace(/%3Fver=([\d.]+)\.css$/i, '.ver-$1.css')
      .replace(/%3Fver=([\d.]+)$/i, '.ver-$1')
      .replace(/%3Frsd$/i, '.rsd')
      .replace(/%3F$/i, '');
  }
  return name;
}

/** @type {Map<string, string>} old relative path → new relative path */
export const renames = new Map();

const SKIP_DIRS = new Set(['node_modules', '.git', 'test-results', 'playwright-report']);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full);
      continue;
    }
    if (!entry.name.includes('%3F')) continue;
    const newName = cleanBasename(entry.name);
    if (newName === entry.name) continue;
    const newFull = path.join(dir, newName);
    if (fs.existsSync(newFull)) {
      fs.unlinkSync(full);
      console.log(`removed duplicate: ${path.relative(root, full)}`);
      continue;
    }
    fs.renameSync(full, newFull);
    const oldRel = path.relative(root, full).replace(/\\/g, '/');
    const newRel = path.relative(root, newFull).replace(/\\/g, '/');
    renames.set(oldRel, newRel);
    console.log(`rename: ${oldRel} → ${newRel}`);
  }
}

walk(root);
fs.writeFileSync(
  path.join(root, 'scripts', '.filename-renames.json'),
  JSON.stringify(Object.fromEntries(renames), null, 2)
);
