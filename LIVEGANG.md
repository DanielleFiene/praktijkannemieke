# Livegang Strato (praktijkannemieke.nl)

Checklist vóór en na upload via SFTP. De statische site is ingericht voor **documentroot = site-root** (geen submap).

## Testfase (nu)

- Alle pagina’s hebben `<meta name="robots" content="noindex, nofollow" data-staging="STAGING_ROBOTS" />`.
- **Zoekterm om te verwijderen bij livegang:** `STAGING_ROBOTS` (één keer in het project zoeken).

```bash
npm run strato:live-robots
```

Of handmatig: vervang de staging-regel door:

```html
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
```

## Upload

1. Upload de repo naar Strato (Apache), inclusief `.htaccess`, `404.html`, `assets/`, en elke pagina-map met `index.html`. **Niet** uploaden: `ondersteunende-middelen-2/` (oude URL; alleen redirect in `.htaccess`), `node_modules/`, `.git/`, tests.
2. Controleer dat **mod_rewrite** aan staat (Strato: meestal standaard).
3. `.htaccess`: HTTPS, www → apex (zie blok **WWW-KEUZE** als je www wilt behouden), redirect `/ondersteunende-middelen-2/`, trailing slash, `ErrorDocument 404`.

## Na livegang — zelf controleren

| Item | Actie |
|------|--------|
| **noindex weg** | `npm run strato:live-robots` + opnieuw uploaden |
| **Redirects** | `http://` → HTTPS; `www.` → apex (of omgekeerd na WWW-KEUZE); `/tarieven` → `/tarieven/`; `/ondersteunende-middelen-2/` → `/ondersteunende-middelen/` |
| **404** | Onbekende URL toont `/404.html` |
| **Interne links** | Geen `index.html` in menu/footer; paden `/slug/` |
| **Canonical** | View source: `https://praktijkannemieke.nl/.../` (homepage `/`) |
| **sitemap + robots** | `https://praktijkannemieke.nl/sitemap.xml` (10 URL’s, geen `-2`); robots verwijst naar die sitemap |
| **Search Console** | Sitemap indienen; coverage controleren |
| **Title / description / h1** | Vergelijk met live WordPress; pas HTML aan waar afwijking (placeholders tot Annemieke teksten aanlevert) |
| **Privacy** | Geen cookies/analytics; fonts lokaal; WhatsApp-link is bewuste uitzondering (extern) |
| **SSL** | Certificaat actief op apex-domein |

## Scripts (onderhoud)

```bash
npm run strato:prepare    # origin apex, links, staging noindex, seo:static
npm run strato:live-robots # alleen robots meta voor productie
```

## Lokaal testen (zelfde als Strato-root)

```bash
set BASE_PATH=
set PORT=4173
npm start
# http://127.0.0.1:4173/
npm test
```

GitHub Pages-preview (submap): `set BASE_PATH=/praktijkannemieke` — **let op:** interne links zijn root-absoluut voor Strato; submap-preview kan dan afwijken.
