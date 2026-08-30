# UWSWOK Resources

United Way of Southwest Oklahoma community resource directory (LawtonAmerica engine v2).

**Live:** https://pavlinovc-svg.github.io/UWSWOK-Resources/

This repository is independent of [Lawton-America](https://github.com/pavlinovc-svg/Lawton-America) (v1). Do not push this site over that repo.

## What’s here

- Vite + React + TypeScript directory with cream / terracotta / gold UI
- Filters, search, organization pages, Leaflet map, in-app webview
- I’m-on-the-way notices (never a reservation)
- Crisis bar: 988, 911, Heartline 211 (`1-877-362-1606`)
- Staff availability lights (localStorage roles)
- Chat answers **only** from organization listings — no PHI
- Native American / tribal category and homeless veteran programs (SSVF, HUD-VASH, Homeless Veteran Outreach)
- Confidential DV / Comanche Nation Women’s Shelter / New Directions: phone only, no map pin, still green when listed as offering services

## Data

Primary source: [uwswok.org/resources](https://www.uwswok.org/resources) (accordion listings). Names and phones also merged from the [Resource Guide 2027](https://www.uwswok.org/sites/uwswok/files/Resource%20Guide%202027%20Updated%20-%2007282026.docx) when the website did not already have them. Website text wins.

Rebuild listings (requires a local copy of the HTML/docx under `/tmp/uwswok-src`):

```bash
python3 scripts/build-orgs.py
```

## Develop

```bash
npm install
npm run dev
```

## Publish (GitHub Pages)

Vite `base` is `/UWSWOK-Resources/`. `npm run build` writes the static site to `/docs` (`index.html`, `404.html` SPA fallback, assets, `organizations.json`, `.nojekyll`).

Pages: legacy / branch `main` / folder `/docs`.
