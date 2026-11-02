/**
 * Vervang #page-{cmsId} en :has(#page-*) in a11y.css door body.page--{slug} / page-layout-hero.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CMS_ID_TO_SLUG } from './page-slugs.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const a11yPath = path.join(root, 'assets/css/a11y.css');

const BEHANDELING_SLUGS = [
	'shambhala-reiki',
	'access-bars',
	'vlindermassage',
	'magnesiumpakking',
];

const NOT_BEHANDELING_HERO = BEHANDELING_SLUGS.map((s) => `:not(.page--${s})`).join('');

function migrate(css) {
	let next = css;

	const notHeroWithPrivacy =
		/body:not\(:has\(#page-15\)\):not\(:has\(#page-295\)\):not\(:has\(#page-501\)\):not\(:has\(#page-506\)\):not\(\s*:has\(#page-227\)\s*\)/g;
	next = next.replace(notHeroWithPrivacy, 'body:not(.page-layout-hero)');

	const notBehandelingOnly =
		/body:not\(:has\(#page-15\)\):not\(:has\(#page-295\)\):not\(:has\(#page-501\)\):not\(:has\(#page-506\)\)/g;
	next = next.replace(notBehandelingOnly, `body${NOT_BEHANDELING_HERO}`);

	const behandelingBodyList = BEHANDELING_SLUGS.map((s) => `body.page--${s}`).join(',\n');
	next = next.replace(
		/body:has\(#page-15\),\s*\nbody:has\(#page-295\),\s*\nbody:has\(#page-501\),\s*\nbody:has\(#page-506\)/g,
		behandelingBodyList
	);

	// body:has(#page-*) (losse regels)
	next = next.replace(/body:has\(#page-15\)/g, 'body.page--shambhala-reiki');
	next = next.replace(/body:has\(#page-295\)/g, 'body.page--access-bars');
	next = next.replace(/body:has\(#page-501\)/g, 'body.page--vlindermassage');
	next = next.replace(/body:has\(#page-506\)/g, 'body.page--magnesiumpakking');
	next = next.replace(/body:has\(#page-227\)/g, 'body.page--privacyverklaring');

	next = next.replace(
		/#page-container:has\(#page-15\)/g,
		'body.page--shambhala-reiki #page-container'
	);
	next = next.replace(
		/#page-container:has\(#page-295\)/g,
		'body.page--access-bars #page-container'
	);
	next = next.replace(
		/#page-container:has\(#page-501\)/g,
		'body.page--vlindermassage #page-container'
	);
	next = next.replace(
		/#page-container:has\(#page-506\)/g,
		'body.page--magnesiumpakking #page-container'
	);

	const ids = Object.keys(CMS_ID_TO_SLUG).sort((a, b) => Number(b) - Number(a));
	for (const id of ids) {
		const slug = CMS_ID_TO_SLUG[id];
		next = next.replaceAll(`#page-${id}`, `body.page--${slug}`);
	}

	return next;
}

let css = fs.readFileSync(a11yPath, 'utf8');
const after = migrate(css);
if (after === css) {
	console.log('a11y.css: geen wijzigingen.');
} else {
	fs.writeFileSync(a11yPath, after);
	console.log('a11y.css: #page-{id} → body.page--{slug}.');
}
