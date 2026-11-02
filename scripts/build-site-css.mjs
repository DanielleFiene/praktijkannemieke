/**
 * AGENTS.md stap 5: site.css = design tokens + gedeelde critical + site-thema (was export-site + critical-shared).
 * Fonts via assets/css/fonts.css (geen @font-face uit export-site).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets', 'css', 'site.css');
const criticalShared = path.join(root, 'assets', 'css', 'critical-shared.css');
const exportSite = path.join(root, 'assets', 'css', 'bronexport', 'themes', 'export-site', 'style.css');

const tokens = `/*
 * Praktijk Annemieke – site.css (stap 5)
 * Layout-base blijft tijdelijk: bronexport/themes/export-base/style-static.min.css
 */

:root {
	--pa-color-text: #000000;
	--pa-color-brand-mint: #c1dfe0;
	--pa-color-accent-pink: #ebcbcd;
	--pa-color-footer-bg: #f3f9f9;
	--pa-color-theme: #7aabab;
	--pa-layout-max: 1325px;
	--pa-font-display: jenna_sueregular, "Jenna Sue", cursive;
	--pa-font-body: proxima-nova, "Open Sans", Arial, sans-serif;
}

`;

function stripExportFonts(css) {
	return css.replace(/@font-face\s*\{[\s\S]*?font-display:\s*swap;\s*\}/gi, '');
}

function readCriticalBody() {
	const raw = fs.readFileSync(criticalShared, 'utf8');
	return raw.replace(/^\/\*[\s\S]*?\*\/\s*/, '').trim();
}

const theme = stripExportFonts(fs.readFileSync(exportSite, 'utf8')).replace(
	/^\/\* Site-specifieke overrides[\s\S]*?\*\/\s*/,
	''
);

const heroFontPatch = `
/* Hero-quotes: Jenna Sue (was h1-only in export-site) */
main#hoofdinhoud .et_pb_fullwidth_header .header-content > h2.et_pb_module_header,
main#hoofdinhoud .et_pb_fullwidth_header .header-content .et_pb_header_content_wrapper > h2 {
	font-family: var(--pa-font-display);
}
`;

const content = [
	tokens,
	'/* Site-thema (was bronexport export-site) */\n',
	theme.trim(),
	'\n\n/* Gedeelde layout-critical (was critical-shared.css) */\n',
	readCriticalBody(),
	heroFontPatch,
	'\n',
].join('');

fs.writeFileSync(out, content);
console.log('Wrote', path.relative(root, out), `(${content.length} chars)`);
