# Livegang Strato (praktijkannemieke.nl)

## Strato: domein → map

In Strato wijst **praktijkannemieke.nl** (type **Intern**) naar de submap **`/praktijkannemieke.nl`** op de webruimte. Alleen bestanden **in die map** worden voor dat domein geserveerd. De webruimte-root (`/`) is **geen** documentroot voor dit domein.

De site in de repo gebruikt **URL-paden vanaf `/`** (`/assets/…`, `/tarieven/`, …). Dat klopt: voor bezoekers is de submap op Strato hetzelfde als de site-root. Er zijn **geen** aparte pad-prefixes in HTML nodig.

**Deploy-doel (SFTP):** altijd **`/praktijkannemieke.nl`**, nooit `/`.

## GitHub Actions — vier secrets

Settings → Secrets (of environment **`production`**) → repository / environment secrets:

| Secret | Wat invullen |
|--------|----------------|
| `STRATO_SFTP_SERVER` | SFTP-host uit Strato (zelfde als FileZilla) |
| `STRATO_SFTP_USERNAME` | SFTP-gebruiker |
| `STRATO_SFTP_PASSWORD` | SFTP-wachtwoord |
| `STRATO_SFTP_REMOTE_DIR` | **`/praktijkannemieke.nl`** (verplicht; niet leeg, niet `/`) |

De workflow **stopt met fout** als `STRATO_SFTP_REMOTE_DIR` leeg is of `/` is.

Workflow: [.github/workflows/deploy-strato.yml](./.github/workflows/deploy-strato.yml)

- **Handmatig:** Actions → *Deploy Strato* → *Run workflow*.
- **Automatisch:** push naar `main` (na geconfigureerde secrets).
- Vóór upload: tests + `strato:verify`.
- Upload: SFTP (`lftp mirror`) naar de doelmap; maakt **`praktijkannemieke.nl`** aan als die nog ontbreekt.
- Er wordt **niets** automatisch uit de webruimte-root verwijderd.

## SSL en `.htaccess`

**HTTPS:** in `.htaccess` staan http→https, www→apex en HSTS; statische assets krijgen lange cache via `mod_expires` (indien actief bij Strato).

Canonical/OG in HTML blijven `https://` (bedoeld voor na SSL); dat is oké tijdens de overgang.

## Robots (productie vs staging)

- Staging: `npm run strato:staging-robots`
- Productie: `npm run strato:live-robots` (403/404 blijven `noindex`)
- Controle: `npm run strato:verify`

## Handmatige SFTP-upload

Zelfde doelmap: **`/praktijkannemieke.nl`**. Upload o.a. `.htaccess`, `index.html`, `assets/`, elke pagina-map met `index.html`. **Niet** uploaden: `node_modules/`, `.git/`, `tests/`, `scripts/`.

## Na deploy — controleren

| Item | Actie |
|------|--------|
| **Locatie** | In FileZilla: `index.html` staat in `/praktijkannemieke.nl/`, niet in webruimte-root |
| **Redirects** | HTTPS, www → apex; `/ondersteunende-middelen-2/` → `/ondersteunende-middelen/` |
| **404** | Onbekende URL → `/404.html` |
| **Canonical** | `https://praktijkannemieke.nl/.../` |
| **sitemap** | `https://praktijkannemieke.nl/sitemap.xml` |
| **Search Console** | Sitemap indienen |

## Scripts

```bash
npm run strato:verify
npm run strato:stage              # lokaal .deploy-staging/ bouwen
npm run strato:validate-remote-dir  # STRATO_SFTP_REMOTE_DIR in env zetten
npm run strato:live-robots
```

## Lokaal testen

```bash
set BASE_PATH=
set PORT=4173
npm start
npm test
```