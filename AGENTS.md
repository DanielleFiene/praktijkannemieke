# Praktijk Annemieke – statische website

## Doel

Statische export van WordPress/Divi omzetten naar schone HTML/CSS/JS. Visueel **exact** gelijk op desktop en mobiel. Inhoud (teksten, afbeeldingen, documenten) ongewijzigd, behalve bewuste uitzonderingen in [Credits](#credits-en-onderhoud).

## Harde regels

- Geen WordPress, Divi, jQuery of plugin-code in het eindresultaat; alles herschreven als zelfstandige code. Geen frameworks of build-stap nodig voor de live site.
- Visueel 1-op-1. Bij twijfel: vragen, niet “verbeteren”.
- Pagina-URL’s blijven gelijk (`/tarieven/`, `/neem-contact-op/`, …).
- **Relatieve paden** overal, zodat de site in een submap werkt (GitHub Pages: `/praktijkannemieke/`).
- Geen externe requests in productie: fonts, scripts, afbeeldingen lokaal. Geen tracking, geen Google Fonts, geen analytics.
- Kleine stappen; na elke stap tests draaien; **commit per afgeronde stap**.

## Best practices

- Semantische HTML5, één `h1` per pagina.
- Toegankelijkheid: zie [WCAG 2.2 AA](#toegankelijkheid-wcag-22-niveau-aa).
- Mobile-first, CSS custom properties, gedeelde stylesheets, geen inline styles (behalve kritieke CSS waar nodig).
- Minimale vanilla JS (`defer`); **inhoud volledig leesbaar zonder JavaScript**.
- Afbeeldingen WebP/AVIF + fallback, `width`/`height`, `loading="lazy"` (niet boven de fold).

## Mappenstructuur (eindbeeld)

```
/
├── index.html
├── <pagina>/index.html
├── assets/{css,js,fonts,images,docs}
├── tests/
├── robots.txt, sitemap.xml, llms.txt, humans.txt
├── 404.html
└── .well-known/security.txt
```

WordPress-restjes (`wp-json`, `et-cache`, dubbele bestanden) verwijderen zodra niet meer nodig.

## Volgorde

1. Testopzet + referentie-screenshots — **gedaan**
2. Relatieve paden + `%3F`-bestandsnamen opschonen — **gedaan**
3. Nieuwe mappenstructuur, WP-restjes verwijderen — **gedaan** (`assets/`, `wp-json`/`feed`/`comments`/`site/` weg; Divi tijdelijk onder `assets/css/divi/`)
4. Semantische HTML — **gedaan** (skip-link, `<main>`, nav ARIA, credits-meta, footer Tiki-tekst, `humans.txt`, `a11y.css`; één `h1` per pagina volgt in stap 5/6)
5. CSS herschrijven (screenshots gelijk) — **deels** (lokale fonts; Divi-CSS nog in `assets/css/divi/`)
6. Minimale vanilla JS — **gedaan** (`assets/js/site.js`; jQuery/Divi-footer verwijderd)
7. Afbeeldingen/fonts optimaliseren
8. SEO + structured data + llms.txt
9. Eindcontrole: tests groen, Lighthouse ≥ 95

## Tests (Playwright)

- Visuele regressie: 375 / 768 / 1440 px, referenties in `tests/visual.spec.js-snapshots/`
- Linkchecker, geen externe requests (`STRICT_EXTERNAL=1` na rebuild)
- Navigatie: mobiel menu, ankers
- **axe-core**: 0 fouten op alle pagina’s (`test:a11y`)
- HTML-validatie; Lighthouse **≥ 95** (performance, accessibility, SEO, best practices) met `RUN_LIGHTHOUSE=1`
- Core Web Vitals-doelen: LCP &lt; 2,5s, CLS &lt; 0,1, INP &lt; 200ms

## Aanscherpingen

- Lighthouse ≥ **95** op alle vier categorieën.
- Inhoud zonder JS volledig leesbaar.
- Fonts **Jenna Sue** en **Open Sans** lokaal als woff2, `font-display: swap`, preload waar nodig.
- EXIF uit afbeeldingen; kritieke CSS inline.
- Telefoon: `tel:+31611260440`; adres in `<address>`.

## Toegankelijkheid (WCAG 2.2 niveau AA)

- Skip-link “Naar inhoud” als eerste element, zichtbaar bij focus.
- `nav` met `aria-label="Hoofdmenu"`, `aria-current="page"` op actieve link.
- Mobiel menu: echte `<button>` met `aria-expanded`, `aria-controls`, `aria-label`; Escape sluit; logische focusvolgorde.
- `aria-label` bij links/knoppen zonder zichtbare tekst.
- Duidelijke `:focus-visible`; beschrijvende linkteksten; documentlinks met type (bijv. “(PDF)”).
- Min. 24×24px klikdoelen; contrast 4,5:1; bruikbaar bij 200% zoom.
- `prefers-reduced-motion` respecteren.
- axe-core in Playwright: 0 fouten.

## SEO en vindbaarheid (inclusief AI)

- Canonical `https://www.praktijkannemieke.nl/...`, Open Graph + Twitter, `og:image` 1200×630.
- JSON-LD: LocalBusiness, **Service** per behandeling, **WebSite** met creator/maintainer (alleen bestaande tekst).
- `sitemap.xml` met `lastmod`.
- `robots.txt`: alles toestaan, incl. AI-crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended) + sitemap-URL.
- `llms.txt`: korte praktijkbeschrijving en links naar hoofdpagina’s.

## Credits en onderhoud

- Ontwerp: [Tiki Media](https://www.tikimedia.nl/).
- Onderhoud: [DF Digital](https://dfdigital.eu) (info@dfdigital.eu) — **niet** zichtbaar in footer.
- In elke `<head>`:
  - `<meta name="designer" content="Tiki Media - https://www.tikimedia.nl/">`
  - `<meta name="web_author" content="DF Digital - https://dfdigital.eu">`
  - `<link rel="author" href="humans.txt">` (relatief pad)
- JSON-LD WebSite: `creator` → Tiki Media; `maintainer` → DF Digital.
- `humans.txt` met credits en contact.
- **Footer (enige bewuste zichtbare tekstwijziging):** vervang “Website door Tiki Media.” door **“Design by Tiki Media”** (link naar https://www.tikimedia.nl/). Zelfde footer-opmaak behouden.

## Overige kwaliteit

- Favicons (svg + png 32/180), apple-touch-icon, `site.webmanifest`, `theme-color`.
- `404.html` in site-stijl.
- Externe links: `rel="noopener"`.
- CSP via meta (alleen eigen bronnen).
- `.well-known/security.txt` → info@dfdigital.eu.
- Prettier, HTML-validator, stylelint; `.editorconfig`.
- `package.json` scripts: `test`, `test:visual`, `test:a11y`, `test:links`, `lint`.
- GitHub Actions: push → tests + linters.
- `README.md`: structuur, lokaal draaien, testen, publiceren.

## Niet zelf aanpassen

Zie `TODO.md` (privacyverklaring cookies, twijfelgevallen inhoud/ontwerp).
