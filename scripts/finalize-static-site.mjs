/**
 * Hernoem Divi-assets (geen assets/wp), schone HTML-head, SEO-canonicals, prune restjes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.praktijkannemieke.nl';

const CANONICAL = {
  'index.html': `${SITE}/`,
  'access-bars/index.html': `${SITE}/access-bars/`,
  'shambhala-reiki/index.html': `${SITE}/shambhala-reiki/`,
  'vlindermassage/index.html': `${SITE}/vlindermassage/`,
  'magnesiumpakking/index.html': `${SITE}/magnesiumpakking/`,
  'ondersteunende-middelen-2/index.html': `${SITE}/ondersteunende-middelen-2/`,
  'tarieven/index.html': `${SITE}/tarieven/`,
  'over-annemieke/index.html': `${SITE}/over-annemieke/`,
  'neem-contact-op/index.html': `${SITE}/neem-contact-op/`,
  'privacyverklaring/index.html': `${SITE}/privacyverklaring/`,
};

function listHtmlFiles() {
  const files = [path.join(root, 'index.html')];
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
    const p = path.join(root, name.name, 'index.html');
    if (fs.existsSync(p)) files.push(p);
  }
  if (fs.existsSync(path.join(root, '404.html'))) files.push(path.join(root, '404.html'));
  return files;
}

function moveWpToDiviCss() {
  const wp = path.join(root, 'assets', 'wp');
  const divi = path.join(root, 'assets', 'css', 'divi');
  if (!fs.existsSync(wp)) {
    if (fs.existsSync(divi)) return;
    throw new Error('assets/wp ontbreekt en assets/css/divi ook niet');
  }
  fs.mkdirSync(path.join(root, 'assets', 'css'), { recursive: true });
  if (fs.existsSync(divi)) {
    fs.rmSync(divi, { recursive: true, force: true });
  }
  try {
    fs.renameSync(wp, divi);
    console.log('Renamed assets/wp → assets/css/divi');
  } catch (err) {
    if (err.code !== 'EPERM' && err.code !== 'EXDEV') throw err;
    fs.cpSync(wp, divi, { recursive: true });
    fs.rmSync(wp, { recursive: true, force: true });
    console.log('Copied assets/wp → assets/css/divi (rename blocked)');
  }
}

function fixDiviCssRelativeUrls() {
  const divi = path.join(root, 'assets', 'css', 'divi');
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.css')) {
        let css = fs.readFileSync(p, 'utf8');
        const next = css.replaceAll('url(../../../images/', 'url(../../../../images/');
        if (next !== css) {
          fs.writeFileSync(p, next);
          console.log('Fixed image URLs in', path.relative(root, p));
        }
      }
    }
  };
  if (fs.existsSync(divi)) walk(divi);
}

function fixChildThemeFontPaths() {
  const childDir = path.join(root, 'assets', 'css', 'divi', 'themes', 'Divi_child');
  for (const file of ['style.css.ver-4.27.9.css', 'style.css.ver-7.1.3.css']) {
    const p = path.join(childDir, file);
    if (!fs.existsSync(p)) continue;
    let css = fs.readFileSync(p, 'utf8');
    css = css.replaceAll("../fonts/jennasue/", "../../../../fonts/jennasue/");
    css = css.replaceAll("../../../fonts/jennasue/", "../../../../fonts/jennasue/");
    fs.writeFileSync(p, css);
  }
}

function pruneDiviTree() {
  const divi = path.join(root, 'assets', 'css', 'divi');
  const removePaths = [
    'themes/fonts',
    'themes/Divi/core/admin/fonts/fontawesome',
    'themes/Divi/core/admin/js',
    'themes/Divi/js',
    'themes/Divi/includes/builder/feature/dynamic-assets/assets/js',
    'themes/Divi/includes/builder/styles/images',
  ];
  for (const rel of removePaths) {
    const p = path.join(divi, rel);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log('Removed', rel);
    }
  }
  const wpIncludes = path.join(root, 'assets', 'wp-includes');
  if (fs.existsSync(wpIncludes)) {
    fs.rmSync(wpIncludes, { recursive: true, force: true });
    console.log('Removed assets/wp-includes');
  }
}

function cleanHtml(file) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  html = html.replaceAll('assets/wp/', 'assets/css/divi/');
  html = html.replaceAll('../assets/wp/', '../assets/css/divi/');

  html = html.replace(
    /<style id="global-styles-inline-css">[\s\S]*?<\/style>\s*/gi,
    ''
  );
  html = html.replace(
    /<style id="wp-block-library-inline-css">[\s\S]*?<\/style>\s*/gi,
    ''
  );

  html = html.replace(
    /<link rel='stylesheet' id='parent-style-css'[^>]*>\s*/gi,
    ''
  );
  html = html.replace(
    /<link rel='stylesheet' id='child-style-css'[^>]*>\s*/gi,
    ''
  );

  html = html.replace(
    /<script id="fitvids-js"[^>]*><\/script>\s*/gi,
    ''
  );
  html = html.replace(
    /<script id="jquery-mobile-js"[^>]*><\/script>\s*/gi,
    ''
  );

  html = html.replace(/\bcookies-not-set\b\s*/g, '');
  html = html.replace(/\bwp-singular\b\s*/g, '');
  html = html.replace(/\bpage-template-default\b\s*/g, '');
  html = html.replace(/\bpage-id-\d+\b\s*/g, '');
  html = html.replace(/\bwp-theme-Divi\b\s*/g, '');
  html = html.replace(/\bwp-child-theme-Divi_child\b\s*/g, '');
  html = html.replace(/\bet-db\b\s*/g, '');

  const rel = path.relative(root, file).replace(/\\/g, '/');
  const canonical = CANONICAL[rel];
  if (canonical) {
    html = html.replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${canonical}" />`
    );
  }

  const prefix = file === path.join(root, 'index.html') ? '' : '../';
  const legacy = `${prefix}assets/css/legacy-globals.css`;
  if (!html.includes('legacy-globals.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="[^"]*a11y\.css" \/>)/,
      `$1\n<link rel="stylesheet" href="${legacy}" />`
    );
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    console.log('Cleaned', rel);
  }
}

function patchRepoReferences() {
  const files = [
    path.join(root, 'scripts', 'migrate-to-assets.mjs'),
    path.join(root, 'AGENTS.md'),
  ];
  for (const p of files) {
    if (!fs.existsSync(p)) continue;
    let t = fs.readFileSync(p, 'utf8');
    const n = t
      .replaceAll('assets/wp/', 'assets/css/divi/')
      .replaceAll('onder `assets/wp/`', 'onder `assets/css/divi/`');
    if (n !== t) fs.writeFileSync(p, n);
  }
}

moveWpToDiviCss();
fixDiviCssRelativeUrls();
fixChildThemeFontPaths();
pruneDiviTree();
for (const f of listHtmlFiles()) cleanHtml(f);
patchRepoReferences();
console.log('Done.');
