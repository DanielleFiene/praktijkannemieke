import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function listSiteHtmlFiles() {
	const files = [path.join(root, 'index.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
		const pageHtml = path.join(root, name.name, 'index.html');
		if (fs.existsSync(pageHtml)) files.push(pageHtml);
	}
	return files;
}

function relPrefix(filePath) {
	const rel = path.relative(root, path.dirname(filePath));
	if (!rel || rel === '.') return '';
	const depth = rel.split(path.sep).filter(Boolean).length;
	return depth ? '../'.repeat(depth) : '';
}

function simplifyHtmlRoot(html) {
	return html.replace(
		/^<!DOCTYPE html>[\s\S]*?<html lang="nl-NL">[\s\S]*?<!--<!\[endif\]-->\s*/i,
		'<!DOCTYPE html>\n<html lang="nl">\n'
	);
}

function transform(html, filePath) {
	const prefix = relPrefix(filePath);
	let out = simplifyHtmlRoot(html);

	out = out.replace('<div id="main-content">', '<main id="hoofdinhoud">');
	out = out.replace(
		/<\/article>\s*<\/div>\s*<footer id="main-footer">/,
		'</article>\n\n</main>\n\n\t\t\t<footer id="main-footer">'
	);

	out = out.replace('<nav id="top-menu-nav">', '<nav id="top-menu-nav" aria-label="Hoofdmenu">');

	if (!out.includes('class="skip-link')) {
		out = out.replace(
			/(<body[^>]*>)/i,
			'$1\n\t<a class="skip-link screen-reader-text" href="#hoofdinhoud">Naar inhoud</a>'
		);
	}

	const creditBlock = `\t<meta name="designer" content="Tiki Media - https://www.tikimedia.nl/" />\n\t<meta name="web_author" content="DF Digital - https://dfdigital.eu" />\n\t<link rel="author" href="${prefix}humans.txt" />\n`;
	if (!out.includes('name="designer"')) {
		out = out.replace(/<meta charset="UTF-8"\s*\/>/i, `<meta charset="UTF-8" />\n${creditBlock}`);
	}

	if (!out.includes('assets/css/fonts.css')) {
		const fontsHref = `${prefix}assets/css/fonts.css`;
		const a11yHref = `${prefix}assets/css/a11y.css`;
		out = out.replace(
			/<link rel='stylesheet' id='child-style-css'/,
			`<link rel="stylesheet" href="${fontsHref}" />\n<link rel="stylesheet" href="${a11yHref}" />\n<link rel='stylesheet' id='child-style-css'`
		);
	}
	out = out.replace(
		/<link rel="stylesheet" href="https:\/\/use\.typekit\.net\/gfb8icv\.css">\s*/g,
		''
	);

	out = out.replaceAll('href="tel:0031611260440"', 'href="tel:+31611260440"');

	out = out.replaceAll(
		'Website door <a class="blauw" href="https://www.tikimedia.nl" target="_blank">Tiki Media.</a>',
		'Design by <a class="blauw" href="https://www.tikimedia.nl" target="_blank" rel="noopener">Tiki Media</a>'
	);

	return out;
}

for (const file of listSiteHtmlFiles()) {
	const html = fs.readFileSync(file, 'utf8');
	const next = transform(html, file);
	if (next !== html) {
		fs.writeFileSync(file, next);
		console.log('Updated', path.relative(root, file));
	}
}

console.log('Semantische HTML toegepast.');
