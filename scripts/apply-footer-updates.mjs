/**
 * Footer: dynamisch jaar + Tiki-link zwart, "Design by" mint.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function listHtmlFiles() {
  const files = [path.join(root, 'index.html'), path.join(root, '404.html'), path.join(root, '403.html')];
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
    const p = path.join(root, name.name, 'index.html');
    if (fs.existsSync(p)) files.push(p);
  }
  return files;
}

for (const file of listHtmlFiles()) {
  let html = fs.readFileSync(file, 'utf8');
  let next = html.replaceAll('Design by <a class="blauw"', 'Design by <a class="footer-credit-link"');
  next = next.replace(/&copy; \d{4}/g, '&copy; <span class="footer-year"></span>');
  if (next !== html) {
    fs.writeFileSync(file, next);
    console.log('Updated footer', path.relative(root, file));
  }
}
