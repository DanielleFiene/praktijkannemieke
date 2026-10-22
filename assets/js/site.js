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

	function initSliders() {
		document.querySelectorAll('.et_pb_slider').forEach((slider) => {
			const slides = [...slider.querySelectorAll('.et_pb_slide')];
			if (slides.length < 2) return;

			let index = slides.findIndex((s) => s.classList.contains('et-pb-active-slide'));
			if (index < 0) index = 0;

			const show = (i) => {
				slides.forEach((slide, j) => {
					const active = j === i;
					slide.classList.toggle('et-pb-active-slide', active);
					slide.style.display = active ? '' : 'none';
				});
			};

			show(index);

			const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			if (!reduced) {
				window.setInterval(() => {
					index = (index + 1) % slides.length;
					show(index);
				}, 10000);
			}
		});
	}

	function initAnchors() {
		document.querySelectorAll('a[href*="#"]').forEach((link) => {
			const href = link.getAttribute('href');
			if (!href || href === '#') return;

			const hashPart = href.includes('#') ? href.split('#').pop() : '';
			const id = hashPart && hashPart.replace(/#.*$/, '');
			if (!id) return;

			link.addEventListener('click', (e) => {
				const target = document.getElementById(id);
				if (!target) return;
				e.preventDefault();
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				try {
					history.replaceState(null, '', `#${id}`);
				} catch {
					/* ignore */
				}
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
