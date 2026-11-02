# TODO – overleg / latere stappen

## Privacyverklaring – afgerond (technisch)

- Sectie **Websitebezoek** (geen cookies; geen tracking).
- **Klacht AP** onder gegevens inzien/aanpassen/verwijderen.
- Verwerkersovereenkomst-hosting: pas Websitebezoek aan zodra live-hosting en contract bekend zijn.
- Toestemming: link wijst naar hetzelfde **kennismakingsformulier** als in de footer (geen apart bestand op de site).

## Formulier (Word) – Annemieke

- `assets/docs/Kennismakingsformulier-NEI-coaching-en-therapie.docx`: toestemming + minderjarigen-blok toegevoegd via `npm run docs:patch-formulier`. **In Word even controleren** (opmaak, formulering, handtekeningvelden).
- Eventueel label in footer later aanpassen (bijv. “Kennismakings- en toestemmingsformulier”); link en bestandsnaam kunnen hetzelfde blijven.

## Inhoud en ontwerp

Alles waar tijdens de rebuild twijfel bestaat over exacte formulering of visuele keuze → hier noteren vóór wijziging.

## Lighthouse / performance

- **Cache TTL 10m** op GitHub Pages: komt van GitHub, niet uit de repo. Bij live host (Cloudflare/eigen server) lange `Cache-Control` op `assets/` zetten.
- **`npm run perf:lighthouse`**: inline export-fonts weg, WebP voor LCP/logo; zwaarste blokken nog **`layout.css`** + **`pages/*.css`** (inkrimpen = apart performance-spoor, niet blokkerend voor live).

## Livegang (Strato)

- **Voor upload:** `npm run strato:prepare` (origin, links, staging `noindex`, sitemap/SEO) — daarna `npm test`.
- **Deploy:** repo naar Strato (incl. `.htaccess`), DNS apex/www zoals afgesproken.
- **Op go-live:** `npm run strato:live-robots` → opnieuw deployen (403 blijft `noindex`).
- **Niet vergeten:** `STRICT_EXTERNAL=1 npm test` lokaal; Lighthouse optioneel: `RUN_LIGHTHOUSE=1 npm run test:lighthouse`.

## Opruimen (later – apart project, visueel 1-op-1)

- **`et_pb_*` + slanke CSS:** inhoudsmarkup en `layout.css` (~800 KB) pas weg na volledige CSS-herschrijf met visuele tests; **niet** doen voor livegang.
