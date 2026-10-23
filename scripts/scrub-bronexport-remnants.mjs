/**
 * Verwijder zichtbare CMS-export-resten uit HTML en normaliseer bronexport-paden/ids.
 * Terminologie: bronexport (geen merknamen in ids/paden).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function listHtmlFiles() {
	const files = [path.join(root, 'index.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
		const p = path.join(root, name.name, 'index.html');
		if (fs.existsSync(p)) files.push(p);
	}
	for (const name of ['403.html', '404.html']) {
		const p = path.join(root, name);
		if (fs.existsSync(p)) files.push(p);
	}
	return files;
}

const SEARCH_ACTION_JSON =
	/,"potentialAction":\[\{"@type":"SearchAction","target":\{"@type":"EntryPoint","urlTemplate":"https:\\\/\\\/www\.praktijkannemieke\.nl\\\/?s=\{search_term_string\}"\},"query-input":\{"@type":"PropertyValueSpecification","valueRequired":true,"valueName":"search_term_string"\}\}\]/g;

const ERROR_PAGE_JSONLD = {
	'404.html': {
		canonical: 'https://www.praktijkannemieke.nl/404.html',
		name: 'Pagina niet gevonden – Praktijk Annemieke',
	},
	'403.html': {
		canonical: 'https://www.praktijkannemieke.nl/403.html',
		name: 'Geen toegang – Praktijk Annemieke',
	},
};

function scrubJsonLdGraph(graph) {
	if (!Array.isArray(graph)) return graph;
	return graph.map((node) => {
		if (!node || typeof node !== 'object') return node;
		if (node['@type'] !== 'WebSite' || !Array.isArray(node.potentialAction)) return node;
		const actions = node.potentialAction.filter((a) => a && a['@type'] !== 'SearchAction');
		const copy = { ...node };
		if (actions.length) copy.potentialAction = actions;
		else delete copy.potentialAction;
		return copy;
	});
}

function scrubJsonLdScripts(html, fileBasename) {
	const errorMeta = ERROR_PAGE_JSONLD[fileBasename];
	return html.replace(
		/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
		(match, raw) => {
			if (errorMeta) {
				const payload = {
					'@context': 'https://schema.org',
					'@graph': [
						{
							'@type': 'WebPage',
							'@id': errorMeta.canonical,
							url: errorMeta.canonical,
							name: errorMeta.name,
							isPartOf: { '@id': 'https://www.praktijkannemieke.nl/#website' },
							inLanguage: 'nl-NL',
						},
					],
				};
				return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
			}
			try {
				const data = JSON.parse(raw.trim());
				if (data['@graph']) {
					data['@graph'] = scrubJsonLdGraph(data['@graph']);
				}
				return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
			} catch {
				return match;
			}
		}
	);
}

function scrubHtml(html, fileBasename) {
	let next = html;

	next = next.replaceAll('assets/css/divi/', 'assets/css/bronexport/');
	next = next.replaceAll('../assets/css/divi/', '../assets/css/bronexport/');
	next = next.replaceAll('/themes/Divi/', '/themes/export-base/');
	next = next.replaceAll('/themes/Divi_child/', '/themes/export-site/');
	next = next.replaceAll('/et-cache/', '/page-cache/');

	next = next.replaceAll("id='divi-style-parent-css'", "id='bronexport-base-css'");
	next = next.replaceAll("id='divi-style-css'", "id='bronexport-site-css'");
	next = next.replaceAll(/id="et-core-unified-deferred-(\d+)-cached-inline-styles"/g, 'id="bronexport-page-$1-css"');

	next = next.replace(/\bet_divi_theme\b\s*/g, '');
	next = next.replace(SEARCH_ACTION_JSON, '');
	next = scrubJsonLdScripts(next, fileBasename);

	next = next.replace(/\sclass="yoast-schema-graph"/g, '');
	next = next.replace(/\sclass='yoast-schema-graph'/g, '');

	next = next.replace(
		/<meta content="Divi Child[^"]*" name="generator"\s*\/>\s*/gi,
		''
	);

	// Lege hero-h1 (bekend: access-bars export-fout)
	next = next.replace(/<h1 style="text-align: center;"><\/h1>/g, '');
	next = next.replace(/<h1><\/h1>/g, '');
	next = next.replace(/<h1 class="et_pb_module_header">\s*<\/h1>/g, '');

	if (fileBasename === '404.html' || fileBasename === '403.html') {
		next = next.replace(
			/\s*<meta name="twitter:label1" content="Geschatte leestijd" \/>\s*<meta name="twitter:data1" content="[^"]*" \/>/g,
			''
		);
	}

	return next;
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const before = fs.readFileSync(file, 'utf8');
	const after = scrubHtml(before, path.basename(file));
	if (after !== before) {
		fs.writeFileSync(file, after);
		console.log('Scrubbed', path.relative(root, file));
		changed++;
	}
}
console.log(changed ? `Done (${changed} files).` : 'No HTML changes.');
