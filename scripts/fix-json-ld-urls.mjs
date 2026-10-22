/**
 * Vervang oude WordPress-URL's in Yoast JSON-LD door statische assets + www-canonical host.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.praktijkannemieke.nl';

const UPLOAD_REPLACEMENTS = [
  ['site/wp-content/uploads/', 'assets/images/'],
  ['site\\/wp-content\\/uploads\\/', 'assets\\/images\\/'],
  ['logo-annemieke_poster_u87768.png', 'logo-annemieke.png'],
];

function listHtmlFiles() {
  const files = [path.join(root, 'index.html')];
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
    const p = path.join(root, name.name, 'index.html');
    if (fs.existsSync(p)) files.push(p);
  }
  return files;
}

function fixJsonLd(html) {
  return html.replace(
    /(<script type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/gi,
    (full, open, json, close) => {
      let body = json;
      for (const [from, to] of UPLOAD_REPLACEMENTS) {
        body = body.replaceAll(from, to);
      }
      body = body.replaceAll('https://praktijkannemieke.nl/', `${SITE}/`);
      body = body.replaceAll('https:\\/\\/praktijkannemieke.nl\\/', `${SITE.replace(/\//g, '\\/')}\\/`);
      return open + body + close;
    }
  );
}

for (const file of listHtmlFiles()) {
  const before = fs.readFileSync(file, 'utf8');
  const after = fixJsonLd(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log('Updated', path.relative(root, file));
  }
}

console.log('Done.');
