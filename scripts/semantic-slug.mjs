/** Korte leesbare slug uit zichtbare tekst (NL). */
export function semanticSlug(raw, maxLen = 32) {
	let s = String(raw || '')
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[''']/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/^[0-9-]+/, '');
	if (!s) s = 'block';
	if (s.length > maxLen) s = s.slice(0, maxLen).replace(/-+$/, '');
	return s;
}

export function escapeRegExp(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Vervang class-tokens langste key eerst, woordgrenzen. */
export function applyClassMap(content, map) {
	const entries = Object.entries(map).filter(([k, v]) => k && v && k !== v);
	entries.sort((a, b) => b[0].length - a[0].length);
	let next = content;
	for (const [from, to] of entries) {
		next = next.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, 'g'), to);
	}
	return next;
}
