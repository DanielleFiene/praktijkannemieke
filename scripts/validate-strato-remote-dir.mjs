/**
 * Voorkom deploy naar Strato-webruimte-root (alleen /praktijkannemieke.nl).
 */
const raw = (process.env.STRATO_SFTP_REMOTE_DIR ?? '').trim();
const normalized = raw.replace(/\/+$/, '') || '/';

if (!raw) {
	console.error(
		'STRATO_SFTP_REMOTE_DIR ontbreekt.\n' +
			'Zet in GitHub Secrets: /praktijkannemieke.nl (Strato: domein → Intern, map praktijkannemieke.nl).',
	);
	process.exit(1);
}

if (normalized === '/') {
	console.error(
		'STRATO_SFTP_REMOTE_DIR is "/" — deploy naar de webruimte-root is niet toegestaan.\n' +
			'Zet de waarde op /praktijkannemieke.nl.',
	);
	process.exit(1);
}

const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
if (withSlash !== '/praktijkannemieke.nl') {
	console.warn(
		`Waarschuwing: STRATO_SFTP_REMOTE_DIR is "${withSlash}"; verwacht /praktijkannemieke.nl voor dit domein.`,
	);
}

console.log(`Deploy-doelmap: ${withSlash}`);