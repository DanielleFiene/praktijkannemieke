/**
 * WebP-varianten voor LCP/logo (Lighthouse image delivery).
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

const jobs = [
	{
		in: 'assets/images/2021/07/NEI-biotensor-1.jpg',
		out: 'assets/images/2021/07/NEI-biotensor-1.webp',
		width: 1920,
		quality: 78,
	},
	{
		in: 'assets/images/2021/07/home-annemieke.jpg',
		out: 'assets/images/2021/07/home-annemieke.webp',
		width: 1920,
		quality: 78,
	},
	{
		in: 'assets/images/2021/06/illustratie-1_poster_.png',
		out: 'assets/images/2021/06/illustratie-1_poster_.webp',
		width: 466,
		quality: 85,
	},
	{
		in: 'assets/images/2021/06/logo_vvnt_lid_van.jpg',
		out: 'assets/images/2021/06/logo_vvnt_lid_van.webp',
		width: 176,
		quality: 82,
	},
];

for (const job of jobs) {
	const input = path.join(root, job.in);
	const output = path.join(root, job.out);
	if (!fs.existsSync(input)) {
		console.warn('Skip (missing):', job.in);
		continue;
	}
	await sharp(input)
		.resize({ width: job.width, withoutEnlargement: true })
		.webp({ quality: job.quality })
		.toFile(output);
	console.log('Wrote', job.out);
}
