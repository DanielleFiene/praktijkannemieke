/**
 * Stap 3: assets/-structuur, media/fonts verplaatsen, WP-restjes uit HTML.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DOC_FILES = [
  '2021/06/betalingsvoorwaarden_annemieke-10-2017.pdf',
  '2023/12/Kennismakingsformulier-NEI-coaching-en-therapie.docx',
  '2024/01/Informatieverstrekking-WKKGZ-2024.pdf',
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function moveDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dest)) rmrf(dest);
  try {
    ensureDir(path.dirname(dest));
    fs.renameSync(src, dest);
  } catch {
    copyTree(src, dest);
    rmrf(src);
  }
}

function copyTree(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  }
}

function rmrf(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

// --- Mappen ---
for (const sub of ['css', 'js', 'fonts', 'images', 'docs']) {
  ensureDir(path.join(root, 'assets', sub));
}

// Fonts
const fontsSrc = path.join(root, 'fonts');
const fontsDest = path.join(root, 'assets', 'fonts');
if (fs.existsSync(fontsSrc)) {
  for (const entry of fs.readdirSync(fontsSrc)) {
    const from = path.join(fontsSrc, entry);
    const to = path.join(fontsDest, entry);
    if (fs.existsSync(to)) rmrf(to);
    moveDir(from, to);
  }
  rmrf(fontsSrc);
}

// Uploads → images (+ docs)
const uploadsSrc = path.join(root, 'site', 'wp-content', 'uploads');
const imagesDest = path.join(root, 'assets', 'images');
if (fs.existsSync(uploadsSrc)) {
  copyTree(uploadsSrc, imagesDest);
  for (const rel of DOC_FILES) {
    const base = path.basename(rel);
    const from = path.join(imagesDest, rel);
    const to = path.join(root, 'assets', 'docs', base);
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, to);
    }
  }
}

// WP themes, et-cache, wp-includes (tijdelijk tot CSS/JS-rewrite)
const wpDest = path.join(root, 'assets', 'wp');
ensureDir(wpDest);
const moves = [
  [path.join(root, 'site', 'wp-content', 'themes'), path.join(wpDest, 'themes')],
  [path.join(root, 'site', 'wp-content', 'et-cache'), path.join(wpDest, 'et-cache')],
  [path.join(root, 'site', 'wp-includes'), path.join(root, 'assets', 'wp-includes')],
];
for (const [src, dest] of moves) {
  if (fs.existsSync(src)) {
    if (fs.existsSync(dest)) rmrf(dest);
    moveDir(src, dest);
  }
}

// xmlrpc.rsd niet nodig
rmrf(path.join(root, 'site'));

// WP-restjes (mappen)
for (const dir of ['wp-json', 'feed', 'comments']) {
  rmrf(path.join(root, dir));
}

// --- HTML bijwerken ---
const htmlFiles = [];
function findHtml(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'tests' || e.name === 'assets') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findHtml(full);
    else if (e.name.endsWith('.html')) htmlFiles.push(full);
  }
}
findHtml(root);

function docUrl(filename) {
  return `assets/docs/${filename}`;
}

const docReplacements = [
  [
    /site\/wp-content\/uploads\/2023\/12\/Kennismakingsformulier-NEI-coaching-en-therapie\.docx/g,
    docUrl('Kennismakingsformulier-NEI-coaching-en-therapie.docx'),
  ],
  [
    /site\/wp-content\/uploads\/2021\/06\/betalingsvoorwaarden_annemieke-10-2017\.pdf/g,
    docUrl('betalingsvoorwaarden_annemieke-10-2017.pdf'),
  ],
  [
    /\.\/assets\/toestemmingsformulier\.docx/g,
    docUrl('toestemmingsformulier.docx'),
  ],
  [
    /site\/wp-content\/uploads\/2024\/01\/Informatieverstrekking-WKKGZ-2024\.pdf/g,
    docUrl('Informatieverstrekking-WKKGZ-2024.pdf'),
  ],
];

function rewriteContent(text) {
  let out = text;
  out = out.replace(/site\/wp-content\/uploads\//g, 'assets/images/');
  out = out.replace(/site\/wp-content\/et-cache\//g, 'assets/css/divi/et-cache/');
  out = out.replace(/site\/wp-content\/themes\//g, 'assets/css/divi/themes/');
  out = out.replace(/site\/wp-includes\//g, 'assets/wp-includes/');
  out = out.replace(/url\(\.\/fonts\//g, 'url(assets/fonts/');
  out = out.replace(/url\(\.\.\/fonts\//g, 'url(../assets/fonts/');
  out = out.replace(/url\(fonts\//g, 'url(assets/fonts/');
  out = out.replace(/url\(\.assets\/fonts\//g, 'url(assets/fonts/');
  for (const [re, rep] of docReplacements) {
    out = out.replace(re, rep);
  }

  // Verwijder WordPress head-restjes
  out = out.replace(/\t<link rel="pingback"[^>]*>\r?\n/g, '');
  out = out.replace(/<link rel="alternate" type="application\/rss\+xml"[^>]*>\r?\n/g, '');
  out = out.replace(/<link rel="alternate" title="oEmbed[^>]*>\r?\n/g, '');
  out = out.replace(/<link rel="https:\/\/api\.w\.org\/"[^>]*>/g, '');
  out = out.replace(/<link rel="alternate" title="JSON"[^>]*>/g, '');
  out = out.replace(/<link rel="EditURI"[^>]*>/g, '');
  out = out.replace(/<meta name="generator" content="WordPress[^"]*" \/>\r?\n/g, '');
  out = out.replace(/<link rel='shortlink'[^>]*>\r?\n/g, '');
  out = out.replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>/g, '');
  out = out.replace(
    /<script type="speculationrules">\s*\{[^<]*prefetch[^<]*\}\s*<\/script>\s*/g,
    ''
  );

  return out;
}

for (const file of htmlFiles) {
  const before = fs.readFileSync(file, 'utf8');
  const after = rewriteContent(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log('html:', path.relative(root, file));
  }
}

console.log('Migratie naar assets/ voltooid.');

spawnSync(process.execPath, ['scripts/fix-asset-css-urls.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
