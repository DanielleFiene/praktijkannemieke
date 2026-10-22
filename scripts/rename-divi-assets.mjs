/**
 * Schone bestandsnamen voor Divi-CSS (zonder .ver-*) en verwijder ongebruikte restjes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const divi = path.join(root, 'assets', 'css', 'divi');

/** @type {Map<string, string>} old relative from root → new relative */
const renames = new Map();

function addRename(oldRel, newRel) {
  renames.set(oldRel.replace(/\\/g, '/'), newRel.replace(/\\/g, '/'));
}

function cleanBasename(name) {
  if (!name.includes('.ver-')) return name;
  if (/\.min\.css\.ver-\d+\.css$/i.test(name)) {
    return name.replace(/\.ver-\d+\.css$/i, '');
  }
  if (/\.ver-[\d.]+\.css$/i.test(name)) {
    return name.replace(/\.ver-[\d.]+\.css$/i, '');
  }
  return name;
}

function collectDiviRenames() {
  if (!fs.existsSync(divi)) return;
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(p);
        continue;
      }
      const newName = cleanBasename(ent.name);
      if (newName === ent.name) continue;
      const oldRel = path.relative(root, p);
      const newRel = path.join(path.dirname(oldRel), newName);
      addRename(oldRel, newRel);
    }
  };
  walk(divi);
}

function applyFileRenames() {
  for (const [oldRel, newRel] of [...renames.entries()].sort((a, b) => b[0].length - a[0].length)) {
    const oldPath = path.join(root, oldRel);
    const newPath = path.join(root, newRel);
    if (!fs.existsSync(oldPath)) continue;
    fs.mkdirSync(path.dirname(newPath), { recursive: true });
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(oldPath);
      console.log('removed duplicate', oldRel);
    } else {
      fs.renameSync(oldPath, newPath);
      console.log('rename', oldRel, '→', newRel);
    }
  }
}

function replaceInTree(dir, exts) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      replaceInTree(p, exts);
      continue;
    }
    if (!exts.some((e) => ent.name.endsWith(e))) continue;
    let text = fs.readFileSync(p, 'utf8');
    let next = text;
    for (const [oldRel, newRel] of renames) {
      const oldSlash = oldRel.replace(/\\/g, '/');
      const newSlash = newRel.replace(/\\/g, '/');
      next = next.replaceAll(oldSlash, newSlash);
    }
    if (next !== text) {
      fs.writeFileSync(p, next);
      console.log('updated refs in', path.relative(root, p));
    }
  }
}

function removeLegacyFiles() {
  const toRemove = [
    path.join(divi, 'themes', 'Divi', 'style.css.ver-7.1.3.css'),
    path.join(divi, 'themes', 'Divi_child', 'style.css.ver-7.1.3.css'),
    path.join(root, 'assets', 'css', 'legacy-globals.css'),
    path.join(root, 'scripts', '.filename-renames.json'),
  ];
  const moduleExtras = [
    'modules.eot',
    'modules.ttf',
    'modules.svg',
  ];
  for (const f of moduleExtras) {
    toRemove.push(
      path.join(divi, 'themes', 'Divi', 'core', 'admin', 'fonts', 'modules', 'all', f)
    );
  }
  for (const p of toRemove) {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('removed', path.relative(root, p));
    }
  }
}

function stripLegacyGlobalsFromHtml() {
  const stripLink = (html) =>
    html.replace(/\n<link rel="stylesheet" href="[^"]*legacy-globals\.css" \/>/g, '');
  const files = [path.join(root, 'index.html'), path.join(root, '404.html')];
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
    const p = path.join(root, name.name, 'index.html');
    if (fs.existsSync(p)) files.push(p);
  }
  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    const next = stripLink(html);
    if (next !== html) {
      fs.writeFileSync(file, next);
      console.log('dropped legacy-globals link', path.relative(root, file));
    }
  }
}

function mergeLegacyGlobalsIntoA11y() {
  const a11y = path.join(root, 'assets', 'css', 'a11y.css');
  let css = fs.readFileSync(a11y, 'utf8');
  if (!css.includes('.aligncenter')) {
    css =
      css.trimEnd() +
      '\n\n.aligncenter {\n\tclear: both;\n}\n';
    fs.writeFileSync(a11y, css);
    console.log('added .aligncenter to a11y.css');
  }
}

collectDiviRenames();
applyFileRenames();
replaceInTree(root, ['.html', '.mjs', '.js', '.md', '.css']);
removeLegacyFiles();
mergeLegacyGlobalsIntoA11y();
stripLegacyGlobalsFromHtml();

console.log('Done.', renames.size, 'renames.');
