/**
 * Leesbare korte ids/klassen: shell + builder-morfologie (pb_* → sec/hero/text/…).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const REPLACEMENTS = [
	// Shell-ids (HTML + CSS + JS)
	['#page-container', '#site'],
	['id="page-container"', 'id="site"'],
	['#et-top-navigation', '#header-nav'],
	['id="et-top-navigation"', 'id="header-nav"'],
	['#et_mobile_nav_menu', '#mobile-nav'],
	['id="et_mobile_nav_menu"', 'id="mobile-nav"'],
	['#et-main-area', '#main-wrap'],
	['id="et-main-area"', 'id="main-wrap"'],
	['#main-content', '#main-wrap'],
	['id="main-content"', 'id="main-wrap"'],
	['#top-menu-nav', '#nav'],
	['id="top-menu-nav"', 'id="nav"'],
	['#top-menu', '#nav-menu'],
	['id="top-menu"', 'id="nav-menu"'],
	['#mobile_menu', '#nav-mobile'],
	['id="mobile_menu"', 'id="nav-mobile"'],
	['.et_mobile_menu', '.nav-mobile-panel'],
	['et_mobile_menu', 'nav-mobile-panel'],
	['.et-fixed-header', '.header-fixed'],
	['et-fixed-header', 'header-fixed'],
	['.et_menu_container', '.header-inner'],
	['menu-container', 'header-inner'],
	['logo_container', 'logo-wrap'],
	['logo_helper', 'logo-spacer'],

	// Body/theme (kort, leesbaar)
	['et_button_no_icon', 'btn-plain'],
	['pb_button_helper_class', ''],
	['et_transparent_nav', 'nav-over-hero'],
	['et_non_fixed_nav', 'nav-scroll'],
	['et_show_nav', 'nav-on'],
	['et_primary_nav_dropdown_animation_fade', ''],
	['et_secondary_nav_dropdown_animation_fade', ''],
	['et_header_style_left', 'header-left'],
	['pb_footer_columns4', 'footer-cols-4'],
	['et_cover_background', 'cover-bg'],
	['pb_cover_background', 'cover-bg'],
	['pb_gutters3', 'gutters'],
	['pb_gutter', 'gutter'],
	['pb_pagebuilder_layout', ''],
	['et_no_sidebar', 'full-width'],
	['pb_with_background', 'has-bg'],
	['pb_fullwidth_section', 'sec--full'],
	['section-reg', 'sec--std'],
	['pb_fullwidth_section', 'sec--full'],
	['pb_css_mix_blend_mode_passthrough', ''],
	['pb_text_align_left', 'text-left'],
	['pb_text_align_center', 'text-center'],
	['pb_bg_layout_dark', 'on-dark'],
	['pb_bg_layout_light', 'on-light'],
	['et-last-child', 'last-col'],

	// Builder-morfologie (lang → kort)
	['pb_fullwidth_header_container', 'hero-inner'],
	['pb_fullwidth_header_overlay', 'hero-overlay'],
	['pb_fullwidth_header_scroll', 'hero-scroll'],
	['pb_header_content_wrapper', 'hero-body'],
	['pb_module_header', 'hero-title'],
	['pb_fullwidth_header_', 'hero-'],
	['pb_fullwidth_header', 'hero'],
	['pb_builder_inner_content', 'builder-inner'],
	['builder-inner', 'builder-inner'],
	['pb_text_inner', 'text-inner'],
	['pb_text_', 'text-'],
	['pb_module pb_text', 'mod text'],
	['pb_module pb_fullwidth_header', 'mod hero'],
	['pb_module pb_divider', 'mod rule'],
	['pb_module pb_button', 'mod btn'],
	['pb_module', 'mod'],
	['pb_text', 'text'],
	['pb_section_', 'sec-'],
	['pb_section', 'sec'],
	['pb_row_', 'row-'],
	['pb_row', 'row'],
	['pb_column_4_4', 'col-full'],
	['pb_column_1_4', 'col-1-4'],
	['pb_column_1_2', 'col-1-2'],
	['pb_column_3_4', 'col-3-4'],
	['pb_column_', 'col-'],
	['pb_column', 'col'],
	['pb_divider_', 'rule-'],
	['pb_divider', 'rule'],
	['pb_button_', 'btn-'],
	['pb_button', 'btn'],
	['pb_social_media_follow', 'social'],
	['entry-content', 'content'],
];

function walk(dir, acc = []) {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		if (['node_modules', 'test-results', 'playwright-report', '.history', '.git'].includes(ent.name))
			continue;
		const full = path.join(dir, ent.name);
		if (ent.isDirectory()) walk(full, acc);
		else acc.push(full);
	}
	return acc;
}

function shouldProcess(file) {
	const rel = path.relative(root, file).replace(/\\/g, '/');
	if (rel.startsWith('tests/visual.spec.js-snapshots/')) return false;
	const ext = path.extname(file).toLowerCase();
	if (!['.html', '.css', '.js'].includes(ext)) return false;
	if (rel.startsWith('scripts/')) return false;
	if (rel.startsWith('tests/')) return false;
	return true;
}

function collapseClasses(html) {
	return html.replace(/class="([^"]*)"/g, (_m, cls) => {
		const parts = cls.split(/\s+/).filter(Boolean);
		const uniq = [...new Set(parts)];
		return `class="${uniq.join(' ')}"`;
	});
}

function patch(content, isHtml) {
	let next = content;
	for (const [from, to] of REPLACEMENTS) {
		if (!from) continue;
		next = next.split(from).join(to);
	}
	if (isHtml) {
		next = collapseClasses(next);
		next = next.replace(/class="\s+/g, 'class="');
		next = next.replace(/\s+"/g, '"');
	}
	return next;
}

const files = walk(root).filter(shouldProcess);
let changed = 0;
for (const file of files) {
	const isHtml = file.endsWith('.html');
	const before = fs.readFileSync(file, 'utf8');
	const after = patch(before, isHtml);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log(path.relative(root, file));
	}
}
console.log(changed ? `Humanized (${changed} files).` : 'Humanize: no changes.');
