import { chromium, devices } from 'playwright';

const base = 'http://127.0.0.1:4173/praktijkannemieke';

const viewports = [
	{ name: 'iphone-16-portrait', width: 393, height: 852 },
	{ name: 'iphone-16-landscape', width: 852, height: 393 },
	{ name: 'iphone-se-landscape', width: 667, height: 375 },
	{ name: 'ipad-portrait', width: 768, height: 1024 },
	{ name: 'ipad-landscape', width: 1024, height: 768 },
	{ name: 'hamburger-wide', width: 1200, height: 800 },
	{ name: 'hamburger-max', width: 1659, height: 900 },
];

const paths = ['/', '/access-bars/'];

function overflowReport(page) {
	return page.evaluate(() => {
		const vw = document.documentElement.clientWidth;
		const scrollW = document.documentElement.scrollWidth;
		const bodyScrollW = document.body.scrollWidth;
		const offenders = [];
		const walk = (el) => {
			if (!(el instanceof Element)) return;
			const r = el.getBoundingClientRect();
			if (r.width < 1 || r.height < 1) return;
			const right = r.right;
			const left = r.left;
			if (right > vw + 0.5 || left < -0.5) {
				const id = el.id ? `#${el.id}` : '';
				const cls =
					el.classList.length
						? `.${[...el.classList].slice(0, 3).join('.')}`
						: el.tagName.toLowerCase();
				offenders.push({
					sel: `${el.tagName.toLowerCase()}${id}${cls}`,
					left: Math.round(left * 10) / 10,
					right: Math.round(right * 10) / 10,
					width: Math.round(r.width * 10) / 10,
				});
			}
			for (const child of el.children) walk(child);
		};
		walk(document.body);
		offenders.sort((a, b) => b.right - a.right);
		return {
			clientWidth: vw,
			docScrollWidth: scrollW,
			bodyScrollWidth: bodyScrollW,
			overflowPx: Math.max(scrollW, bodyScrollW) - vw,
			topOffenders: offenders.slice(0, 12),
		};
	});
}

const browser = await chromium.launch();
const issues = [];

for (const vp of viewports) {
	for (const path of paths) {
		const page = await browser.newPage({
			viewport: { width: vp.width, height: vp.height },
			deviceScaleFactor: 3,
		});
		await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
		let report = await overflowReport(page);
		if (report.overflowPx > 1) {
			issues.push({ vp: vp.name, path, menu: 'closed', ...report });
		}
		await page.locator('.mobile_menu_bar').click();
		await page.waitForTimeout(400);
		report = await overflowReport(page);
		if (report.overflowPx > 1) {
			issues.push({ vp: vp.name, path, menu: 'open', ...report });
		}
		await page.close();
	}
}

await browser.close();

console.log(JSON.stringify(issues, null, 2));
if (issues.length === 0) console.log('No horizontal overflow > 1px detected.');
