/**
 * Schone bestandsnamen voor bronexport-CSS (zonder .ver-*) en verwijder ongebruikte restjes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const bronexport = path.join(root, 'assets', 'css', 'bronexport');

/** @type {Map<string, string>} old relative from root → new relative */
const renames = new Map();

function addRename(oldRel, newRel) {
	renames.set(oldRel.replace(/\\/g, '/'), newRel.replace(/\\/g, '/'));
}

function cleanBasename(name) {
	if (!name.includes('.ver-')) return name;
	if (/\.min\.css\.ver-\d+\.css$/i.test(name)) {
		return name.replace(/\.ver-\d+\.css$/i, '');
	}
	if (/\.ver-[\d.]+\.css$/i.test(name)) {
		return name.replace(/\.ver-[\d.]+\.css$/i, '');
	}
	return name;
}

function collectBronexportRenames() {
	if (!fs.existsSync(bronexport)) return;
	const walk = (dir) => {
		for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, ent.name);
			if (ent.isDirectory()) {
				walk(p);
				continue;
			}
			const newName = cleanBasename(ent.name);
			if (newName === ent.name) continue;
			const oldRel = path.relative(root, p);
			const newRel = path.join(path.dirname(oldRel), newName);
			addRename(oldRel, newRel);
		}
	};
	walk(bronexport);
}

function applyFileRenames() {
	for (const [oldRel, newRel] of [...renames.entries()].sort((a, b) => b[0].length - a[0].length)) {
		const oldPath = path.join(root, oldRel);
		const newPath = path.join(root, newRel);
		if (!fs.existsSync(oldPath)) continue;
		fs.mkdirSync(path.dirname(newPath), { recursive: true });
		if (fs.existsSync(newPath)) {
			fs.unlinkSync(oldPath);
			console.log('removed duplicate', oldRel);
		} else {
			fs.renameSync(oldPath, newPath);
			console.log('rename', oldRel, '→', newRel);
		}
	}
}

function replaceInTree(dir, exts) {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) {
			if (ent.name === 'node_modules' || ent.name === '.git') continue;
			replaceInTree(p, exts);
			continue;
		}
		if (!exts.some((e) => ent.name.endsWith(e))) continue;
		let text = fs.readFileSync(p, 'utf8');
		let next = text;
		for (const [oldRel, newRel] of renames) {
			const oldSlash = oldRel.replace(/\\/g, '/');
			const newSlash = newRel.replace(/\\/g, '/');
			next = next.replaceAll(oldSlash, newSlash);
		}
		if (next !== text) {
			fs.writeFileSync(p, next);
			console.log('updated refs in', path.relative(root, p));
		}
	}
}

function removeLegacyFiles() {
	const toRemove = [
		path.join(bronexport, 'themes', 'export-base', 'style.css.ver-7.1.3.css'),
		path.join(bronexport, 'themes', 'export-site', 'style.css.ver-7.1.3.css'),
		path.join(root, 'assets', 'css', 'legacy-globals.css'),
		path.join(root, 'scripts', '.filename-renames.json'),
	];
	const moduleExtras = ['modules.eot', 'modules.ttf', 'modules.svg'];
	for (const f of moduleExtras) {
		toRemove.push(
			path.join(bronexport, 'themes', 'export-base', 'core', 'admin', 'fonts', 'modules', 'all', f)
		);
	}
	for (const p of toRemove) {
		if (fs.existsSync(p)) {
			fs.unlinkSync(p);
			console.log('removed', path.relative(root, p));
		}
	}
}

collectBronexportRenames();
applyFileRenames();
replaceInTree(root, ['.html', '.mjs', '.js', '.md', '.css']);
removeLegacyFiles();

console.log('Done.', renames.size, 'renames.');
