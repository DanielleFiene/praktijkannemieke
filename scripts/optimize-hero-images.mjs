/**
 * WebP voor hero-achtergronden (visueel gelijk, kleiner waar mogelijk).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let sharp;
try {
	sharp = (await import('sharp')).default;
} catch {
	console.error('Installeer eerst: npm install sharp --save-dev');
	process.exit(1);
}

const HERO_JPG = [
	'assets/images/2021/07/AccessBars-bewerkt.jpg',
	'assets/images/2021/07/contact-Annemieke.jpg',
	'assets/images/2021/07/over-Annemieke-bewerkt.jpg',
	'assets/images/2021/06/annemieke-shabhala-u120922-fr.jpg',
	'assets/images/2021/06/ondersteunendemiddelen-u121594-fr.jpg',
	'assets/images/2025/10/Magnesiumpakking_PraktijkAnnemieke.jpg',
	'assets/images/2025/10/Vlindermassage_PraktijkAnnemieke.jpg',
];

const MAX_WIDTH = 1920;

for (const rel of HERO_JPG) {
	const input = path.join(root, rel);
	if (!fs.existsSync(input)) {
		console.warn('Skip (missing):', rel);
		continue;
	}
	const out = input.replace(/\.jpe?g$/i, '.webp');
	const meta = await sharp(input).metadata();
	const targetW = Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH);
	const jpgSize = fs.statSync(input).size;

	let bestBuf = null;
	for (const quality of [88, 85, 82]) {
		const buf = await sharp(input)
			.resize({ width: targetW, withoutEnlargement: true })
			.webp({ quality, effort: 4 })
			.toBuffer();
		if (!bestBuf || buf.length < bestBuf.length) bestBuf = buf;
		if (buf.length <= jpgSize) break;
	}

	if (!bestBuf || bestBuf.length > jpgSize * 1.02) {
		console.log(`${path.basename(rel)}: JPG behouden (${Math.round(jpgSize / 1024)} KB, webp niet kleiner)`);
		if (fs.existsSync(out)) fs.unlinkSync(out);
		continue;
	}

	fs.writeFileSync(out, bestBuf);
	console.log(
		`${path.basename(out)} ${Math.round(jpgSize / 1024)} KB → ${Math.round(bestBuf.length / 1024)} KB (q≤88, ${targetW}px)`,
	);
}