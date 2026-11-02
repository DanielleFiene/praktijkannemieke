import path from 'node:path';

/** CMS-pagina-id → URL-slug (mapnaam). */
export const CMS_ID_TO_SLUG = {
	10: 'home',
	15: 'shambhala-reiki',
	17: 'over-annemieke',
	19: 'ondersteunende-middelen',
	21: 'neem-contact-op',
	227: 'privacyverklaring',
	295: 'access-bars',
	493: 'tarieven',
	501: 'vlindermassage',
	506: 'magnesiumpakking',
};

/** Hero-layout (fullwidth header) — was :has(#page-*). */
export const HERO_LAYOUT_SLUGS = new Set([
	'shambhala-reiki',
	'access-bars',
	'vlindermassage',
	'magnesiumpakking',
	'privacyverklaring',
]);

export function slugFromHtmlPath(file, root) {
	const base = path.basename(file);
	if (base === '403.html' || base === '404.html') return 'privacyverklaring';
	const rel = path.relative(root, path.dirname(file)).replace(/\\/g, '/');
	if (!rel || rel === '.') return 'home';
	return rel;
}

/** @param {string} slug */
export function cmsIdForSlug(slug) {
	for (const [id, s] of Object.entries(CMS_ID_TO_SLUG)) {
		if (s === slug) return id;
	}
	return null;
}
