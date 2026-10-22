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

## Opruimen (later)

- **`assets/wp/`**: oude Divi-export (dubbel met `assets/css/divi/`). Veilig verwijderen zodra niets meer naar `assets/wp` verwijst (nu gebruikt de site `assets/css/divi/`, incl. **`et-cache/`** = per-pagina Divi-CSS tot stap 5 klaar is).
