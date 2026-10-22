import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wpRoot = path.join(root, 'assets', 'wp');

function walkCss(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkCss(full);
    else if (e.name.includes('.css')) patchFile(full);
  }
}

function patchFile(file) {
  let text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(wpRoot, path.dirname(file)).replace(/\\/g, '/');
  const depth = rel ? rel.split('/').length : 0;
  const up = '../'.repeat(depth + 1);
  let out = text;
  out = out.replace(/\/site\/wp-content\/uploads\//g, `${up}images/`);
  if (rel.startsWith('themes/Divi_child')) {
    out = out.replace(/\/site\/wp-content\/themes\/fonts\//g, '../fonts/');
    out = out.replace(/\.\.\/\.\.\/\.\.\/themes\/fonts\//g, '../fonts/');
  }
  if (out !== text) {
    fs.writeFileSync(file, out);
    console.log('css:', path.relative(root, file));
  }
}

if (fs.existsSync(wpRoot)) walkCss(wpRoot);
