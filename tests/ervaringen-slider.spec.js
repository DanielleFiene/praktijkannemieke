// @ts-check
const { test, expect } = require('@playwright/test');

const SLIDER_PAGES = [
	{ path: 'over-annemieke/', id: '#Ervaringen' },
	{ path: 'tarieven/', id: '#Ervaringen' },
];

async function waitSliderReady(page, selector) {
	const slider = page.locator(selector);
	await expect(slider).toHaveClass(/site-slider-enhanced/, { timeout: 10_000 });
	await expect(slider).toHaveClass(/site-slider-ready/, { timeout: 10_000 });
	await expect(slider).not.toHaveClass(/site-slider-measuring/);
	return slider;
}

function countUserVisibleSlides(root) {
	return [...root.querySelectorAll('.pb_slide')].filter((slide) => {
		if (slide.hidden) return false;
		const st = getComputedStyle(slide);
		if (st.display === 'none' || st.visibility === 'hidden') return false;
		if (parseFloat(st.opacity) === 0) return false;
		const r = slide.getBoundingClientRect();
		return r.height > 8 && r.width > 8;
	}).length;
}

for (const { path, id } of SLIDER_PAGES) {
	test.describe(`ervaringen-slider (${path})`, () => {
		test('na init: precies één slide zichtbaar', async ({ page }) => {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			const selector = `${id} .pb_slider`;
			await waitSliderReady(page, selector);

			const visible = await page.locator(selector).evaluate(countUserVisibleSlides);
			expect(visible).toBe(1);
		});

		test('tijdens init: geen snelle wissel van zichtbare titels', async ({ page }) => {
			await page.goto(path, { waitUntil: 'commit' });
			const selector = `${id} .pb_slider`;

			const distinctVisibleTitles = await page.evaluate(async (sel) => {
				const titles = new Set();
				const deadline = Date.now() + 4000;
				while (Date.now() < deadline) {
					if (!document.documentElement.classList.contains('js')) {
						await new Promise((r) => requestAnimationFrame(r));
						continue;
					}
					const slider = document.querySelector(sel);
					if (!slider) {
						await new Promise((r) => requestAnimationFrame(r));
						continue;
					}
					if (!slider.classList.contains('site-slider-enhanced')) {
						await new Promise((r) => requestAnimationFrame(r));
						continue;
					}
					if (slider.classList.contains('site-slider-measuring')) {
						await new Promise((r) => requestAnimationFrame(r));
						continue;
					}
					const slides = slider.querySelectorAll('.pb_slide');
					for (const slide of slides) {
						if (slide.hidden) continue;
						const st = getComputedStyle(slide);
						if (st.display === 'none' || st.visibility === 'hidden') continue;
						if (parseFloat(st.opacity) === 0) continue;
						const r = slide.getBoundingClientRect();
						if (r.height < 8 || r.width < 8) continue;
						const title = slide.querySelector('.pb_slide_title')?.textContent?.trim();
						if (title) titles.add(title);
					}
					if (slider.classList.contains('site-slider-ready')) break;
					await new Promise((r) => requestAnimationFrame(r));
				}
				return [...titles];
			}, selector);

			expect(
				distinctVisibleTitles.length,
				`Zichtbare titels tijdens init: ${distinctVisibleTitles.join(' | ')}`,
			).toBeLessThanOrEqual(1);

			await waitSliderReady(page, selector);
		});

		test('volgende slide (toetsenbord)', async ({ page }) => {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			const selector = `${id} .pb_slider`;
			const slider = await waitSliderReady(page, selector);

			const titleBefore = await slider
				.locator('.pb_slide.et-pb-active-slide .pb_slide_title')
				.innerText();
			await slider.focus();
			await page.keyboard.press('ArrowRight');
			await expect(slider.locator('.pb_slide.et-pb-active-slide .pb_slide_title')).not.toHaveText(
				titleBefore,
				{ timeout: 5000 },
			);

			const visible = await page.locator(selector).evaluate(countUserVisibleSlides);
			expect(visible).toBe(1);
		});

		test('inactieve slides aria-hidden', async ({ page }) => {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			const selector = `${id} .pb_slider`;
			await waitSliderReady(page, selector);

			const states = await page.locator(`${selector} .pb_slide`).evaluateAll((slides) =>
				slides.map((s) => ({
					active: s.classList.contains('et-pb-active-slide'),
					hidden: s.getAttribute('aria-hidden'),
				})),
			);
			const active = states.filter((s) => s.active);
			expect(active).toHaveLength(1);
			expect(active[0].hidden).toBe('false');
			for (const slide of states.filter((s) => !s.active)) {
				expect(slide.hidden).toBe('true');
			}
		});
	});
}