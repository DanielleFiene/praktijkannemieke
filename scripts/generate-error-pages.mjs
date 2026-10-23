/**
 * 403/404:zelfde bronexport-shell als privacy (hero + footer-widgets), alleen inhoud anders.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatePath = path.join(root, 'privacyverklaring', 'index.html');

const PAGES = [
  {
    file: '404.html',
    title: 'Pagina niet gevonden – Praktijk Annemieke',
    description: 'Deze pagina bestaat niet. Ga terug naar de homepage van Praktijk Annemieke.',
    robots: 'noindex, follow',
    canonical: 'https://www.praktijkannemieke.nl/404.html',
    hero: 'Pagina niet gevonden',
    body: `<p>De pagina die je zoekt bestaat niet (meer) of het adres is niet helemaal goed.</p>
<p>Via de homepage vind je alle behandelingen en contactgegevens.</p>
<div class="et_pb_button_module_wrapper et_pb_button_0_wrapper et_pb_module error-page-cta">
<a class="et_pb_button et_pb_button_0 et_pb_bg_layout_light" href="index.html">Terug naar de homepage</a>
</div>`,
  },
  {
    file: '403.html',
    title: 'Geen toegang – Praktijk Annemieke',
    description: 'Je hebt geen toegang tot deze pagina.',
    robots: 'noindex, nofollow',
    canonical: 'https://www.praktijkannemieke.nl/403.html',
    hero: 'Geen toegang',
    body: `<p>Je hebt geen toegang tot deze pagina.</p>
<p>Als je denkt dat dit niet klopt, neem gerust <a href="neem-contact-op/index.html">contact</a> op.</p>
<div class="et_pb_button_module_wrapper et_pb_button_0_wrapper et_pb_module error-page-cta">
<a class="et_pb_button et_pb_button_0 et_pb_bg_layout_light" href="index.html">Terug naar de homepage</a>
</div>`,
  },
];

function rootPaths(html) {
  return html.replaceAll('../', '');
}

function buildContentSection(bodyHtml) {
  return `<div class="et_pb_section et_pb_section_1 et_section_regular" >
				<div class="et_pb_row et_pb_row_0">
				<div class="et_pb_column et_pb_column_4_4 et_pb_column_0  et_pb_css_mix_blend_mode_passthrough et-last-child">
				<div class="et_pb_module et_pb_text et_pb_text_0  et_pb_text_align_center et_pb_bg_layout_light">
				<div class="et_pb_text_inner">${bodyHtml}</div>
			</div>
			</div>
			</div>
			</div>`;
}

let template = fs.readFileSync(templatePath, 'utf8');

for (const page of PAGES) {
  let html = rootPaths(template);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`);
  if (!html.includes('name="description"')) {
    html = html.replace('</title>', `</title>\n\t<meta name="description" content="${page.description}" />`);
  } else {
    html = html.replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${page.description}" />`
    );
  }
  if (html.includes("name='robots'")) {
    html = html.replace(
      /<meta name='robots' content='[^']*' \/>/,
      `<meta name="robots" content="${page.robots}" />`
    );
  } else {
    html = html.replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${page.description}" />\n\t<meta name="robots" content="${page.robots}" />`
    );
  }
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${page.title}" />`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${page.canonical}" />`
  );

  html = html.replace(
    /<div class="et_pb_header_content_wrapper"><h1[^>]*>Privacyverklaring<\/h1><\/div>/,
    `<div class="et_pb_header_content_wrapper"><h1 style="text-align: center;">${page.hero}</h1></div>`
  );

  const section1Start = '<div class="et_pb_section et_pb_section_1 et_section_regular" >';
  const section3Start = '<div class="et_pb_section et_pb_section_3';
  const idx1 = html.indexOf(section1Start);
  const idx3 = html.indexOf(section3Start);
  if (idx1 < 0 || idx3 < idx1) {
    throw new Error(`Could not splice content for ${page.file}`);
  }
  html = html.slice(0, idx1) + buildContentSection(page.body) + html.slice(idx3);

  html = html.replace(
    /<a href="privacyverklaring\/index\.html"[^>]*><span id="u86998-21">privacyverklaring\.<\/span><\/a>/,
    '<a class="nonblock" href="privacyverklaring/index.html"><span id="u86998-21">privacyverklaring.</span></a>'
  );

  html = html.replaceAll('Design by <a class="blauw"', 'Design by <a class="footer-credit-link"');
  html = html.replace(/&copy; \d{4}/g, '&copy; <span class="footer-year"></span>');

  const out = path.join(root, page.file);
  fs.writeFileSync(out, html);
  console.log('Wrote', page.file);
}
