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

const JQUERY_HEAD = new RegExp(
	'<script type="text/javascript">\\s*let jqueryParams[\\s\\S]*?</script>\\s*',
	'i'
);

const IE_BLOCK = /<!--\[if[\s\S]*?<!\[endif\]-->\s*/gi;

const YOAST_COMMENT_OPEN =
	/<!--\s*This site is optimized with the Yoast SEO plugin[^>]*-->\s*/i;
const YOAST_COMMENT_CLOSE = /<!--\s*\/ Yoast SEO plugin\.\s*-->\s*/i;

const DIVI_GENERATOR = /<meta content="Divi Child[^"]*" name="generator"\s*\/>\s*/i;

const FOOTER_SCRIPT_BLOCK = new RegExp(
	'<script id="jquery-core-js"[\\s\\S]*?<script id="et-core-common-js"[^>]*></script>\\s*',
	'i'
);

const JS_CLASS_SCRIPT = new RegExp(
	"<script type=\"text/javascript\">\\s*document\\.documentElement\\.className = 'js';\\s*</script>\\s*",
	'i'
);

for (const file of listSiteHtmlFiles()) {
	const prefix = relPrefix(file);
	let html = fs.readFileSync(file, 'utf8');
	let next = html;

	next = next.replace(IE_BLOCK, '');
	next = next.replace(YOAST_COMMENT_OPEN, '');
	next = next.replace(YOAST_COMMENT_CLOSE, '');
	next = next.replace(DIVI_GENERATOR, '');
	next = next.replace(JQUERY_HEAD, '');
	next = next.replace(JS_CLASS_SCRIPT, '');

	const siteJs = `<script src="${prefix}assets/js/site.js" defer></script>\n`;
	if (!next.includes('assets/js/site.js')) {
		next = next.replace(FOOTER_SCRIPT_BLOCK, siteJs);
	}

	next = next.replace(/<!--\s*#(?:main-header|et-top-navigation|page-container|et-main-area|main-footer)\s*-->/gi, '');
	next = next.replace(/<!--\s*\.container\s*-->/gi, '');

	if (next !== html) {
		fs.writeFileSync(file, next);
		console.log('Cleaned', path.relative(root, file));
	}
}
