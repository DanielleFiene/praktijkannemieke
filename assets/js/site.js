(function () {
	'use strict';

	function initMobileNav() {
		const mobileNav = document.querySelector('#et_mobile_nav_menu .mobile_nav');
		const toggle = document.querySelector('.mobile_menu_bar');
		const topMenu = document.querySelector('#top-menu');
		if (!mobileNav || !toggle || !topMenu) return;

		toggle.setAttribute('role', 'button');
		toggle.setAttribute('tabindex', '0');
		toggle.setAttribute('aria-expanded', 'false');
		toggle.setAttribute('aria-label', 'Menu openen en sluiten');
		toggle.setAttribute('aria-controls', 'mobile_menu');

		function setOpen(open) {
			mobileNav.classList.toggle('opened', open);
			mobileNav.classList.toggle('closed', !open);
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
			const menu = document.getElementById('mobile_menu');
			if (menu) {
				menu.style.display = open ? 'block' : 'none';
			}
		}

		function ensureMobileMenu() {
			let menu = document.getElementById('mobile_menu');
			if (menu) return menu;
			menu = document.createElement('ul');
			menu.id = 'mobile_menu';
			menu.className = 'et_mobile_menu';
			menu.innerHTML = topMenu.innerHTML;
			menu.style.display = 'none';
			mobileNav.appendChild(menu);
			return menu;
		}

		toggle.addEventListener('click', () => {
			const open = !mobileNav.classList.contains('opened');
			if (open) ensureMobileMenu();
			setOpen(open);
		});

		toggle.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggle.click();
			}
		});

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && mobileNav.classList.contains('opened')) {
				setOpen(false);
			}
		});
	}

	const SLIDER_AUTOPLAY_MS = 10000;

	function initSliders() {
		document.querySelectorAll('.et_pb_slider').forEach((slider) => {
			const slides = [...slider.querySelectorAll('.et_pb_slide')];
			if (slides.length < 2) return;

			slider.classList.add('site-slider-enhanced');
			if (!slider.hasAttribute('tabindex')) {
				slider.setAttribute('tabindex', '0');
			}

			let index = slides.findIndex((s) => s.classList.contains('et-pb-active-slide'));
			if (index < 0) index = 0;

			const nav = document.createElement('div');
			nav.className = 'site-slider-nav';

			const prev = document.createElement('button');
			prev.type = 'button';
			prev.className = 'site-slider-prev';
			prev.setAttribute('aria-label', 'Vorige ervaring');
			prev.textContent = '\u2039';

			const next = document.createElement('button');
			next.type = 'button';
			next.className = 'site-slider-next';
			next.setAttribute('aria-label', 'Volgende ervaring');
			next.textContent = '\u203A';

			const dotsWrap = document.createElement('div');
			dotsWrap.className = 'site-slider-dots';
			dotsWrap.setAttribute('role', 'tablist');
			dotsWrap.setAttribute('aria-label', 'Ervaringen');

			const dots = slides.map((slide, i) => {
				const title =
					slide.querySelector('.et_pb_slide_title')?.textContent?.trim() ||
					`Ervaring ${i + 1}`;
				const dot = document.createElement('button');
				dot.type = 'button';
				dot.className = 'site-slider-dot';
				dot.setAttribute('role', 'tab');
				dot.setAttribute('aria-label', title);
				dot.addEventListener('click', () => go(i));
				dotsWrap.appendChild(dot);
				return dot;
			});

			nav.append(dotsWrap);
			const slidesWrap = slider.querySelector('.et_pb_slides');
			if (slidesWrap) {
				slidesWrap.append(prev, next);
			} else {
				slider.append(prev, next);
			}
			slider.append(nav);

			const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			let timer = null;

			const syncSlideHeight = () => {
				const wrap = slider.querySelector('.et_pb_slides');
				if (!wrap) return;

				const savedIndex = index;
				slider.classList.remove('site-slider-ready');
				wrap.style.height = 'auto';
				wrap.style.minHeight = '0';

				let max = 0;
				slides.forEach((slide) => {
					slides.forEach((s) => {
						s.hidden = true;
						s.classList.remove('et-pb-active-slide');
					});
					slide.hidden = false;
					slide.classList.add('et-pb-active-slide');
					slide.style.display = 'block';
					slide.style.position = 'relative';
					slide.style.visibility = 'visible';
					max = Math.max(max, wrap.getBoundingClientRect().height);
				});

				slides.forEach((slide) => {
					slide.style.display = '';
					slide.style.position = '';
					slide.style.visibility = '';
				});

				const heightPx = `${Math.ceil(max)}px`;
				wrap.style.height = heightPx;
				wrap.style.minHeight = heightPx;
				slider.classList.add('site-slider-ready');
				show(savedIndex);
			};

			const show = (i) => {
				index = (i + slides.length) % slides.length;
				slides.forEach((slide, j) => {
					const active = j === index;
					slide.classList.toggle('et-pb-active-slide', active);
					slide.hidden = !active;
					slide.setAttribute('aria-hidden', active ? 'false' : 'true');
				});
				dots.forEach((dot, j) => {
					const active = j === index;
					dot.setAttribute('aria-selected', active ? 'true' : 'false');
					dot.tabIndex = active ? 0 : -1;
				});
			};

			const resetAuto = () => {
				if (timer) window.clearInterval(timer);
				if (!reduced) {
					timer = window.setInterval(() => {
						show(index + 1);
					}, SLIDER_AUTOPLAY_MS);
				}
			};

			const go = (i) => {
				show(i);
				resetAuto();
			};

			prev.addEventListener('click', () => go(index - 1));
			next.addEventListener('click', () => go(index + 1));

			slider.addEventListener('keydown', (e) => {
				if (e.key === 'ArrowLeft') {
					e.preventDefault();
					go(index - 1);
				} else if (e.key === 'ArrowRight') {
					e.preventDefault();
					go(index + 1);
				}
			});

			slider.addEventListener('focusin', resetAuto);
			slider.addEventListener('mouseenter', resetAuto);

			const scheduleHeightSync = () => {
				const run = () => syncSlideHeight();
				if (document.fonts?.ready) {
					document.fonts.ready.then(run);
				} else {
					run();
				}
			};

			show(index);
			scheduleHeightSync();
			resetAuto();

			let resizeTimer = null;
			window.addEventListener('resize', () => {
				if (resizeTimer) window.clearTimeout(resizeTimer);
				resizeTimer = window.setTimeout(scheduleHeightSync, 150);
			});
		});
	}

	function parseAnchorHref(href) {
		if (!href || href === '#') return null;
		const hashIndex = href.indexOf('#');
		if (hashIndex === -1) return null;
		const pathPart = href.slice(0, hashIndex);
		const id = href
			.slice(hashIndex + 1)
			.split('#')
			.find((part) => part.length > 0);
		if (!id) return null;
		return { pathPart, id };
	}

	function initAnchors() {
		document.querySelectorAll('a[href*="#"]').forEach((link) => {
			const href = link.getAttribute('href');
			const parsed = parseAnchorHref(href);
			if (!parsed) return;

			const { pathPart, id } = parsed;

			link.addEventListener('click', (e) => {
				const target = document.getElementById(id);
				if (target) {
					e.preventDefault();
					target.scrollIntoView({ behavior: 'smooth', block: 'start' });
					try {
						history.replaceState(null, '', `#${id}`);
					} catch {
						/* ignore */
					}
					return;
				}

				if (pathPart && pathPart !== '.') {
					return;
				}

				e.preventDefault();
				window.location.href = `../index.html#${id}`;
			});
		});
	}

	function initFooterYear() {
		const year = String(new Date().getFullYear());
		document.querySelectorAll('.footer-year').forEach((el) => {
			el.textContent = year;
		});
	}

	function init() {
		document.documentElement.classList.add('js');
		initMobileNav();
		initSliders();
		initAnchors();
		initFooterYear();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
