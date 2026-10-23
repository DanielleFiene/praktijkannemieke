/**
 * 1) Vervang %253F / oude %3F-paden door geschoonde bestandsnamen
 * 2) Maak root-absolute paden (/foo) relatief t.o.v. elk HTML-bestand
 * 3) Corrigeer bekende foute slug ondersteunende-middelen → ondersteunende-middelen
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const renamesPath = path.join(root, 'scripts', '.filename-renames.json');
const renames = fs.existsSync(renamesPath)
  ? new Map(Object.entries(JSON.parse(fs.readFileSync(renamesPath, 'utf8'))))
  : new Map();

const PAGE_SLUGS = new Set([
  'access-bars',
  'shambhala-reiki',
  'vlindermassage',
  'magnesiumpakking',
  'ondersteunende-middelen',
  'tarieven',
  'over-annemieke',
  'neem-contact-op',
  'privacyverklaring',
]);

function applyRenames(text) {
  let out = text;
  for (const [oldRel, newRel] of renames) {
    const oldEnc = oldRel.replace(/%3F/g, '%253F');
    out = out.split(oldEnc).join(newRel);
    out = out.split(oldRel).join(newRel);
  }
  out = out.replace(/%253Fver=([^"'&)\s]+)/g, (_, ver) => `.ver-${ver}`);
  out = out.replace(/%253Frsd/g, '.rsd');
  return out;
}

function isSpecialUrl(url) {
  return (
    !url ||
    /^https?:\/\//i.test(url) ||
    /^mailto:/i.test(url) ||
    /^tel:/i.test(url) ||
    /^javascript:/i.test(url) ||
    /^data:/i.test(url)
  );
}

function resolveSitePath(pathPart) {
  let p = pathPart.replace(/^\//, '');
  if (p === '' || p === 'index.html') return { type: 'home' };
  const [segment, ...rest] = p.split('/');
  if (PAGE_SLUGS.has(segment) && (rest.length === 0 || (rest.length === 1 && rest[0] === ''))) {
    return { type: 'page', slug: segment };
  }
  if (p.startsWith('fonts/') || p.startsWith('site/') || p.startsWith('wp-json/')) {
    return { type: 'asset', rel: p };
  }
  return { type: 'asset', rel: p };
}

function toRelative(fromDir, urlPath) {
  const hashIdx = urlPath.indexOf('#');
  const hash = hashIdx >= 0 ? urlPath.slice(hashIdx) : '';
  const pathOnly = hashIdx >= 0 ? urlPath.slice(0, hashIdx) : urlPath;

  if (pathOnly === '' || pathOnly === '/') {
    if (fromDir === root) return hash || './';
    return `..${hash || '/'}`;
  }

  const resolved = resolveSitePath(pathOnly);
  let targetFile;
  if (resolved.type === 'home') {
    targetFile = path.join(root, 'index.html');
  } else if (resolved.type === 'page') {
    targetFile = path.join(root, resolved.slug, 'index.html');
  } else {
    targetFile = path.join(root, resolved.rel);
  }

  let rel = path.relative(fromDir, targetFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  if (resolved.type === 'page' && !pathOnly.endsWith('.html')) {
    rel = rel.replace(/\/index\.html$/, '/');
  }
  if (resolved.type === 'home' && fromDir !== root) {
    rel = rel.replace(/index\.html$/, '');
    if (rel === '../') rel = '..';
  }
  return rel + hash;
}

function rewriteUrl(fromFile, url) {
  if (isSpecialUrl(url)) return url;
  if (url.startsWith('#')) return url;

  let u = url;
  if (u.startsWith('/')) {
    u = toRelative(path.dirname(fromFile), u);
  }
  u = u.replace(/\/ondersteunende-middelen\//g, '/ondersteunende-middelen/');
  u = u.replace(/\bondersteunende-middelen\//g, 'ondersteunende-middelen/');
  return u;
}

function rewriteHtml(file, content) {
  let out = applyRenames(content);

  out = out.replace(
    /(\s(?:href|src|content|action)=)(["'])([^"']+)\2/gi,
    (match, prefix, quote, url) => `${prefix}${quote}${rewriteUrl(file, url)}${quote}`
  );

  out = out.replace(/url\((['"]?)(\/[^)'"]+)\1\)/gi, (match, q, url) => {
    const rel = rewriteUrl(file, url);
    return `url(${q || ''}${rel}${q || ''})`;
  });

  return out;
}

const htmlFiles = [];
function findHtml(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== 'tests') findHtml(full);
    else if (e.isFile() && e.name.endsWith('.html')) htmlFiles.push(full);
  }
}
findHtml(root);

for (const file of htmlFiles) {
  const before = fs.readFileSync(file, 'utf8');
  const after = rewriteHtml(file, before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log('updated:', path.relative(root, file));
  }
}
