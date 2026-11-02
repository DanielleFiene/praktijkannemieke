/**
 * SEO + structured data (AGENTS.md stap 8): LocalBusiness, Service, WebSite credits, head-meta.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.praktijkannemieke.nl';
const OG_IMAGE = `${SITE}/assets/images/og-share.png`;
const LOCAL_BUSINESS_DESC =
	'Praktijk voor energetisch werk in Beneden-Leeuwen (Gelderland). NEI-therapie, Reiki, Access Bars en meer; NEI ook op afstand.';
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);

const CSP =
	"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; " +
	"style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; font-src 'self'; " +
	"connect-src 'self'; media-src 'self'; form-action 'self' mailto:;";

const SERVICE_DIRS = new Set([
	'access-bars',
	'shambhala-reiki',
	'vlindermassage',
	'magnesiumpakking',
	'ondersteunende-middelen',
]);

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function relPrefix(filePath) {
	const rel = path.relative(root, path.dirname(filePath));
	if (!rel || rel === '.') return '';
	return `${'../'.repeat(rel.split(path.sep).filter(Boolean).length)}`;
}

function pageDir(filePath) {
	const rel = path.relative(root, path.dirname(filePath)).replace(/\\/g, '/');
	return rel === '' || rel === '.' ? '' : rel;
}

function extractMeta(html, name) {
	const m = new RegExp(`<meta name="${name}" content="([^"]*)"`, 'i').exec(html);
	return m?.[1]?.trim() || '';
}

function escapeAttr(value) {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function stripTags(html) {
	return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncateMeta(text, max = 155) {
	if (text.length <= max) return text;
	const cut = text.slice(0, max - 1);
	const lastSpace = cut.lastIndexOf(' ');
	return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function inferDescription(html, dir) {
	let existing = extractMeta(html, 'description');
	if (dir === '' && existing && !/afstand/i.test(existing)) {
		const extra = ' NEI ook op afstand.';
		if (existing.length + extra.length <= 160) existing += extra;
	}
	if (existing) return existing;

	const main = /<main id="hoofdinhoud">([\s\S]*?)<\/main>/i.exec(html);
	if (main) {
		for (const match of main[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
			const text = stripTags(match[1]);
			if (text.length >= 50) return truncateMeta(text);
		}
	}

	const fallbacks = {
		tarieven:
			'Tarieven voor NEI-sessies, Shambhala Reiki, Access Bars, vlindermassage en magnesiumpakking bij Praktijk Annemieke in Beneden-Leeuwen.',
		'neem-contact-op':
			'Neem contact op met Praktijk Annemieke in Beneden-Leeuwen voor een afspraak of vraag over NEI-therapie en andere behandelingen.',
		privacyverklaring:
			'Privacyverklaring van Praktijk Annemieke: hoe persoonsgegevens worden verwerkt en bewaard.',
	};
	return fallbacks[dir] || '';
}

function ensureMetaDescription(html, description) {
	if (!description) return html;
	const tag = `<meta name="description" content="${escapeAttr(description)}" />`;
	if (html.includes('name="description"')) {
		return html.replace(/<meta name="description" content="[^"]*"\s*\/>/, tag);
	}
	return html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, (m) => `${m}\n\t${tag}`);
}

function ensureSocialMeta(html, { canonical, pageTitle, description }) {
	let next = html;
	next = next.replace(
		/<meta property="og:url" content="\.\/"\s*\/>/g,
		`<meta property="og:url" content="${canonical}" />`
	);
	if (description) {
		const ogDesc = `<meta property="og:description" content="${escapeAttr(description)}" />`;
		if (next.includes('property="og:description"')) {
			next = next.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, ogDesc);
		} else {
			next = next.replace(
				/<meta property="og:title" content="[^"]*"\s*\/>/i,
				(m) => `${m}\n\t${ogDesc}`
			);
		}
		const twDesc = `<meta name="twitter:description" content="${escapeAttr(description)}" />`;
		if (next.includes('name="twitter:description"')) {
			next = next.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, twDesc);
		} else if (next.includes('name="twitter:card"')) {
			next = next.replace(/<meta name="twitter:card" content="[^"]*"\s*\/>/i, (m) => `${m}\n\t${twDesc}`);
		}
	}
	const twitter = [
		['twitter:title', pageTitle],
		['twitter:image', OG_IMAGE],
	];
	for (const [name, value] of twitter) {
		if (!value || next.includes(`name="${name}"`)) continue;
		next = next.replace(
			/<meta name="twitter:card" content="[^"]*"\s*\/>/i,
			(m) => `${m}\n\t<meta name="${name}" content="${escapeAttr(value)}" />`
		);
	}
	return next;
}
function extractCanonical(html) {
	const m = /<link rel="canonical" href="([^"]+)"/i.exec(html);
	return m?.[1]?.trim() || SITE;
}

function localBusinessNode() {
	return {
		'@type': 'LocalBusiness',
		'@id': `${SITE}/#localbusiness`,
		name: 'Praktijk Annemieke',
		description: LOCAL_BUSINESS_DESC,
		url: SITE,
		telephone: '+31611260440',
		email: 'welkom@praktijkannemieke.nl',
		image: `${SITE}/assets/images/2021/07/logo-annemieke.png`,
		address: {
			'@type': 'PostalAddress',
			streetAddress: 'Morelstraat 1',
			postalCode: '6658 EP',
			addressLocality: 'Beneden-Leeuwen',
			addressCountry: 'NL',
		},
	};
}

function enrichGraph(graph, { canonical, dir, metaDescription, pageTitle }) {
	const next = [...graph];
	const byId = (id) => next.find((n) => n && n['@id'] === id);

	if (!byId(`${SITE}/#localbusiness`)) {
		next.push(localBusinessNode());
	} else {
		const lb = byId(`${SITE}/#localbusiness`);
		lb.description = LOCAL_BUSINESS_DESC;
	}

	const website = byId(`${SITE}/#website`);
	if (website) {
		website.creator = { '@type': 'Organization', name: 'Tiki Media', url: 'https://www.tikimedia.nl/' };
		website.maintainer = {
			'@type': 'Organization',
			name: 'DF Digital',
			url: 'https://dfdigital.eu',
			email: 'info@dfdigital.eu',
		};
	}

	const webPage = next.find((n) => n && n['@type'] === 'WebPage' && n.url === canonical);
	if (webPage && metaDescription) {
		webPage.description = metaDescription;
	}
	const serviceName =
		dir === ''
			? 'NEI-therapie'
			: SERVICE_DIRS.has(dir)
				? pageTitle.replace(/\s*-\s*Praktijk Annemieke$/i, '').trim()
				: null;

	if (serviceName && metaDescription) {
		const serviceId = `${canonical}#service`;
		const existingService = byId(serviceId);
		if (!existingService) {
			next.push({
				'@type': 'Service',
				'@id': serviceId,
				name: serviceName,
				description: metaDescription,
				url: canonical,
				provider: { '@id': `${SITE}/#localbusiness` },
				areaServed: { '@type': 'Country', name: 'NL' },
			});
		} else {
			existingService.description = metaDescription;
		}
		if (webPage) {
			webPage.about = { '@id': serviceId };
		}
	}

	return next;
}

function patchJsonLd(html, ctx) {
	return html.replace(
		/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i,
		(_match, raw) => {
			try {
				const data = JSON.parse(raw.trim());
				if (Array.isArray(data['@graph'])) {
					data['@graph'] = enrichGraph(data['@graph'], ctx);
				}
				return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
			} catch {
				return _match;
			}
		}
	);
}

function ensureHeadMeta(html, prefix) {
	let next = html;

	if (!next.includes('Content-Security-Policy')) {
		next = next.replace(
			/<meta charset="UTF-8"\s*\/>/i,
			`<meta charset="UTF-8" />\n\t<meta http-equiv="Content-Security-Policy" content="${CSP}" />`
		);
	}

	if (!next.includes('name="theme-color"')) {
		next = next.replace(
			/<meta name="viewport"[^/]*\/>/i,
			(match) => `${match}\n<meta name="theme-color" content="#7aabab" />`
		);
	}

	const manifestHref = `${prefix}site.webmanifest`;
	if (!next.includes('site.webmanifest')) {
		next = next.replace(
			/<link rel="icon" href="[^"]*cropped-icon_annemieke-32x32\.png"/,
			`<link rel="icon" href="${prefix}assets/images/favicon.svg" type="image/svg+xml" />\n<link rel="icon" href="${prefix}assets/images/2023/04/cropped-icon_annemieke-32x32.png"`
		);
		next = next.replace(
			/<meta name="viewport"[^/]*\/>/i,
			(match) => `${match}\n<link rel="manifest" href="${manifestHref}" />`
		);
	}

	const ogImageAbs = `${SITE}/assets/images/og-share.png`;
	if (!next.includes('property="og:image:width"')) {
		next = next.replace(
			/<meta property="og:image" content="[^"]*" \/>/i,
			`<meta property="og:image" content="${ogImageAbs}" />\n\t<meta property="og:image:width" content="1200" />\n\t<meta property="og:image:height" content="630" />`
		);
	}

	return next;
}

async function ensureOgShareImage() {
	const out = path.join(root, 'assets', 'images', 'og-share.png');
	if (fs.existsSync(out)) return;
	let sharp;
	try {
		sharp = (await import('sharp')).default;
	} catch {
		console.warn('sharp niet beschikbaar – og-share.png overslaan');
		return;
	}
	const logo = path.join(root, 'assets', 'images', '2021', '07', 'logo-annemieke.png');
	if (!fs.existsSync(logo)) return;
	const logoBuf = await sharp(logo).resize(520, null, { fit: 'inside' }).png().toBuffer();
	await sharp({
		create: {
			width: 1200,
			height: 630,
			channels: 3,
			background: { r: 122, g: 171, b: 171 },
		},
	})
		.composite([{ input: logoBuf, gravity: 'center' }])
		.png()
		.toFile(out);
	console.log('Created', path.relative(root, out));
}

function pruneLegacyPageCss() {
	/* page-cache verwijderd in stap 5.3 */
}

function updateSitemapLastmod() {
	const sitemap = path.join(root, 'sitemap.xml');
	if (!fs.existsSync(sitemap)) return;
	const today = new Date().toISOString().slice(0, 10);
	const next = fs
		.readFileSync(sitemap, 'utf8')
		.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
	fs.writeFileSync(sitemap, next);
	console.log('Updated sitemap lastmod →', today);
}

await ensureOgShareImage();
pruneLegacyPageCss();
updateSitemapLastmod();

let changed = 0;
	for (const file of listHtmlFiles()) {
	const prefix = relPrefix(file);
	const dir = pageDir(file);
	const before = fs.readFileSync(file, 'utf8');
	const pageTitle = (/<title>([^<]*)<\/title>/i.exec(before)?.[1] || '').trim();
	const canonical = extractCanonical(before);
	const metaDescription = inferDescription(before, dir);
	let after = ensureMetaDescription(before, metaDescription);
	const ctx = { canonical, dir, metaDescription, pageTitle };
	after = patchJsonLd(after, ctx);
	after = ensureSocialMeta(after, ctx);
	after = ensureHeadMeta(after, prefix);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log('SEO', path.relative(root, file));
	}
}

console.log(changed ? `Done (${changed} HTML files).` : 'SEO: geen HTML-wijzigingen.');
