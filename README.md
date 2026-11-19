# Praktijk Annemieke (statische site)

Visuele kopie van [praktijkannemieke.nl](https://www.praktijkannemieke.nl/) als onderhoudbare HTML, CSS en JavaScript (geen CMS-runtime).

## Structuur

- `index.html` en `<pagina>/index.html` — pagina’s (URL-paden gelijk aan productie)
- `assets/css/` — `fonts.css`, `layout.css`, `site.css`, `pages/*.css`, `a11y.css`; bron **`_sources/`** (niet in HTML)
- `assets/js/site.js` — mobiel menu, sliders, kleine UX-verbeteringen
- `assets/images/`, `assets/docs/`, `assets/fonts/`
- `tests/` — Playwright (visueel, links, navigatie, HTML-validatie)
- `robots.txt`, `sitemap.xml`, `llms.txt`, `humans.txt`, `.well-known/security.txt`

Zie [AGENTS.md](./AGENTS.md) voor regels en voortgang van de rebuild.

## Lokaal draaien

```bash
npm install
npm start
```

Site op `http://127.0.0.1:4173/praktijkannemieke/` (GitHub Pages-submap). Andere poort of basispad:

```bash
set PORT=8080
set BASE_PATH=/
npm start
```

## Testen

```bash
npm test
npm run test:visual
npm run test:links
npm run test:navigation
npm run test:html
```

Optioneel (zwaarder):

```bash
set RUN_A11Y=1
npm run test:a11y

set RUN_LIGHTHOUSE=1
npm run test:lighthouse
```

Visuele snapshots bijwerken na bewuste layoutwijziging:

```bash
npm run test:update-snapshots
```

## Onderhoudsscripts

| Script | Doel |
|--------|------|
| `npm run scrub:cms-markup` | CMS/Muse/Yoast-restjes uit HTML |
| `npm run scrub:bronexport` | Bronexport-paden en head opschonen |
| `npm run css:site` | `site.css` bouwen + pagina-stylesheets migreren |
| `npm run css:layout` | `layout.css` bouwen + HTML base-stylesheet |
| `npm run seo:static` | JSON-LD, CSP, manifest, og-share |
| `npm run perf:lighthouse` | Fonts/images performance |

## Publiceren (Strato)

Zie [LIVEGANG.md](./LIVEGANG.md). Kort:

1. In Strato: domein **praktijkannemieke.nl** → **Intern** → map **`praktijkannemieke.nl`**.
2. GitHub secrets (environment `production` of repository):

| Secret | Waarde |
|--------|--------|
| `STRATO_SFTP_SERVER` | uit Strato / FileZilla |
| `STRATO_SFTP_USERNAME` | idem |
| `STRATO_SFTP_PASSWORD` | idem |
| `STRATO_SFTP_REMOTE_DIR` | **`/praktijkannemieke.nl`** (nooit `/` of leeg) |

3. Actions → **Deploy Strato** (of push naar `main`). Upload gaat alleen naar die submap.
4. `npm run strato:verify` vóór je productie commit.

**.htaccess** dwingt HTTPS af; tot het SSL-certificaat op het domein actief is, kan https nog haperen — certificaat eerst in Strato regelen.

### Opruimen op de server (handmatig, niet via deploy)

Deploy **wist niets** in de webruimte-root. Oude resten (vaak na WordPress of eerdere uploads in de root) kun je **zelf** verwijderen als je zeker weet dat ze niet bij andere domeinen horen:

- `index.php`, `wp-config.php`, mappen `wp-admin/`, `wp-content/`, `wp-includes/`
- Oude `index.html` of WordPress-bestanden **direct in de webruimte-root** (niet in `/praktijkannemieke.nl/`)
- Eventuele dubbele kopieën van `assets/` of pagina’s **buiten** `/praktijkannemieke.nl/`

Laat andere domein-mappen en Strato-systeembestanden met rust.

GitHub Pages-preview (optioneel): `BASE_PATH=/praktijkannemieke` lokaal — alleen voor preview, niet voor Strato.
