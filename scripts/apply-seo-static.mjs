/**
 * SEO + structured data (AGENTS.md stap 8): LocalBusiness, Service, WebSite credits, head-meta.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.praktijkannemieke.nl';
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

function extractCanonical(html) {
	const m = /<link rel="canonical" href="([^"]+)"/i.exec(html);
	return m?.[1]?.trim() || SITE;
}

function localBusinessNode() {
	return {
		'@type': 'LocalBusiness',
		'@id': `${SITE}/#localbusiness`,
		name: 'Praktijk Annemieke',
		description: 'Praktijk voor energetisch werk',
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
	const serviceName =
		dir === ''
			? 'NEI-therapie'
			: SERVICE_DIRS.has(dir)
				? pageTitle.replace(/\s*-\s*Praktijk Annemieke$/i, '').trim()
				: null;

	if (serviceName && metaDescription) {
		const serviceId = `${canonical}#service`;
		if (!byId(serviceId)) {
			next.push({
				'@type': 'Service',
				'@id': serviceId,
				name: serviceName,
				description: metaDescription,
				url: canonical,
				provider: { '@id': `${SITE}/#localbusiness` },
				areaServed: { '@type': 'Country', name: 'NL' },
			});
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
	const cache = path.join(root, 'assets', 'css', 'bronexport', 'page-cache');
	if (!fs.existsSync(cache)) return;
	for (const ent of fs.readdirSync(cache, { withFileTypes: true })) {
		if (!ent.isDirectory()) continue;
		const dir = path.join(cache, ent.name);
		for (const file of fs.readdirSync(dir)) {
			if (file.startsWith('et-core-unified-deferred-')) {
				fs.unlinkSync(path.join(dir, file));
				console.log('removed legacy', path.join('assets/css/bronexport/page-cache', ent.name, file));
			}
		}
	}
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
	const ctx = {
		canonical: extractCanonical(before),
		dir,
		metaDescription: extractMeta(before, 'description'),
		pageTitle: (/<title>([^<]*)<\/title>/i.exec(before)?.[1] || '').trim(),
	};
	let after = patchJsonLd(before, ctx);
	after = ensureHeadMeta(after, prefix);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log('SEO', path.relative(root, file));
	}
}

console.log(changed ? `Done (${changed} HTML files).` : 'SEO: geen HTML-wijzigingen.');
