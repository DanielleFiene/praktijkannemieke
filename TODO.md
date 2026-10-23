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
- **`npm run perf:lighthouse`**: inline export-fonts weg, WebP voor LCP/logo; blijft zwaar door **`style-static.min.css` (~82 KiB)** + **`page-cache/`** tot stap 5 (eigen CSS, bronexport eruit).

## Opruimen (later)

- **`assets/wp/`** en **`assets/css/divi/`**: verwijderd (dubbel met `assets/css/bronexport/`).
- **`assets/css/bronexport/themes/Divi`** en **`Divi_child`**: verwijderd; live CSS via `export-base` / `export-site`.
- **`page-cache/`** + bronexport-base CSS: weg na CSS-herschrijving (AGENTS.md stap 5). **Gestart:** gedeelde critical → `assets/css/critical-shared.css`; dubbele `assets/css/divi/` + `bronexport/themes/Divi*` verwijderd.
- **`wp-image-*` / `alignnone` op afbeeldingen**: CMS-export-klassen; vervangen bij stap 7 / 5.

## Herbruikbare onderdelen (later)

- **Footer** (en evt. header): nu dezelfde HTML op elke pagina (bronexport). Overwegen één bronbestand + kleine build/deploy-stap of include, zodat tekst/links niet per pagina hoeven te wijzigen. Styling blijft in `assets/css/a11y.css`.
