/**
 * Lighthouse / WCAG fixes across all public HTML pages (idempotent).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const htmlFiles = [
  'index.html',
  ...[
    'access-bars',
    'shambhala-reiki',
    'vlindermassage',
    'magnesiumpakking',
    'ondersteunende-middelen',
    'tarieven',
    'over-annemieke',
    'neem-contact-op',
    'privacyverklaring',
  ].map((slug) => path.join(slug, 'index.html')),
];

const viewportOld =
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />';
const viewportNew =
  '<meta name="viewport" content="width=device-width, initial-scale=1.0" />';

/** Weergavegrootte ≈ max-height in header, niet volledige PNG (732×577). */
const LOGO_WIDTH = 233;
const LOGO_HEIGHT = 184;

const logoNeedle = 'id="logo" data-height-percentage="80" />';
const logoReplace = `id="logo" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" data-height-percentage="80" />`;

const logoLegacyNeedle = 'id="logo" width="732" height="577" data-height-percentage="80" />';
const logoLegacyReplace = logoReplace;

const vvntLinkNeedle =
  '<a href="https://vvnt.nl" target="_blank" rel="noopener">';
const vvntLinkReplace =
  '<a href="https://vvnt.nl" target="_blank" rel="noopener" aria-label="Vereniging van Natuurgeneeskundig Therapeuten (VVNT)">';

const emptyAnchor = '<a class="nonblock" target="_blank" rel="noopener"></a>';

function replaceBetween(html, startMarker, endMarker, transform) {
  const start = html.indexOf(startMarker);
  if (start === -1) return html;
  const end = html.indexOf(endMarker, start);
  if (end === -1) return html;
  const chunk = html.slice(start, end);
  return html.slice(0, start) + transform(chunk) + html.slice(end);
}

function fixIndexHeadings(html) {
  html = replaceBetween(
    html,
    '<div id="Nei"',
    '<div class="et_pb_section et_pb_section_3',
    (chunk) => chunk.replace(/<h3>/g, '<h2>').replace(/<\/h3>/g, '</h2>')
  );
  return replaceBetween(
    html,
    '<div id="Wie"',
    '<div class="et_pb_section et_pb_section_6',
    (chunk) => chunk.replace(/<h4/g, '<h3').replace(/<\/h4>/g, '</h3>')
  );
}

function fixVvntImgAlt(html) {
  return html.replace(
    /(logo_vvnt_lid_van\.jpg" width="176" height="117") alt=""/g,
    '$1 alt="VVNT – lid"'
  );
}

for (const rel of htmlFiles) {
  const file = path.join(root, rel);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replaceAll(viewportOld, viewportNew);
  html = html.replaceAll(logoLegacyNeedle, logoLegacyReplace);
  if (html.includes(logoNeedle)) {
    html = html.replaceAll(logoNeedle, logoReplace);
  }
  html = html.replaceAll(vvntLinkNeedle, vvntLinkReplace);
  html = fixVvntImgAlt(html);
  html = html.replaceAll(emptyAnchor, '');
  if (rel === 'index.html') {
    html = fixIndexHeadings(html);
  }
  fs.writeFileSync(file, html);
  console.log('updated', rel);
}
