# Hanabi card printer

https://anicolao.github.io/hanabi/ · [Source](https://github.com/anicolao/hanabi)

A static print workspace for Hanabi's 50-card, five-colour base deck. Choose artwork, paper and sides; print or save a PDF. No landing page, rules section, account, or backend.

## Artwork sets

- **Painted (generated)**: 25 independently generated gouache-style fireworks paintings, one per colour/value combination, plus a shared back. Source JPEGs are in `dist/assets/painted/`; standalone SVG card files embed the paintings and add consistent vector values and written colours. The imagery is raster artwork, not procedural vector illustrations. The back blends its painting with its 180° rotation to make the printed back exactly reversible. Black-and-white cards use a saturation filter and retain explicit suit names. Generation prompts and tool provenance are in `artwork/prompts.json`.
- **Hanab Live style**: counted suit pips, large coloured/outlined values, pale faces and a gray common back. Adapted from the GPLv3 Hanab Live project; attribution, reference commit, license and the five upstream pip paths are in `references/hanab-live/`. This print adaptation uses white for the fifth suit; the physical deck composition remains identical across all sets.
- **Original SVG**: the first vector fireworks set, preserved unchanged in `dist/assets/cards/`, with its original black-and-white variant.

All copies of a given colour/value use the same illustration. Each set has one common back for all 50 cards. No rank or suit is encoded on the back.

## Local use

Requires Node.js 22+, Python 3, and `zip`. No runtime dependencies or remote fonts.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:5297. Serve `dist/` on any static host. ES modules require HTTP rather than file://. Generated illustrations are checked in; the build does not call an image-generation service. `scripts/artwork.mjs` regenerates the original SVG art, `scripts/live-artwork.mjs` builds the Hanab Live adaptation, and `scripts/painted-artwork.mjs` frames the checked-in paintings. Build also regenerates the source and artwork ZIPs.

## Printing

Deck distribution per colour: 1, 1, 1, 2, 2, 3, 3, 4, 4, 5. Full deck: six sheets / twelve interleaved front-and-back pages. Cards trim to 63 × 88 mm, nine per sheet. The last five-card sheet reflects occupied positions across the full page for long-edge duplex. Crop marks and 1 mm bleed support shared straight cuts. White diamonds at grid intersections help check front/back alignment against a light.

Select A4 or US Letter, portrait, 100% / actual size, background graphics on, headers/footers off. For duplex, flip on the long edge. Print one alignment pair before the full set. Back offsets move up to ±5 mm horizontally/vertically as viewed from the back. Separate front/back jobs retain matching sheet order; test manual feed and stack direction first. Crop marks require a printable area within 4 mm of the Letter edge. Use opaque stock or identical opaque sleeves with backing cards. Keep saved PDFs at actual size too.

Choose one of each for an artwork sampler, or open the card browser, filter, and choose filtered cards to print playing quantities of that subset. Tokens are a separate single-sided print job.

## Tests and hosting

```sh
npx playwright install chromium
npm run test:e2e
# Or use installed Chrome:
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

Unit tests cover deck counts and physical sheet geometry. Playwright covers the desktop and phone workspace, each artwork set, downloads, filters, image loading, print invocation, calibration, generated PDF page counts/dimensions and final-sheet reflection. Physical feed alignment still needs a test print.

GitHub Pages serves `dist/`. Pushes to `main` build, run all tests, and deploy the verified artifact. Pull requests run checks without deployment. To host a fork, enable GitHub Pages with GitHub Actions as its source. Relative URLs support repository subpaths without a special build.

## License

GPL-3.0-only for this project's code, artwork contributions and documentation. Hanab Live derived pip paths are distributed under its GPLv3 license with attribution. See LICENSE, NOTICE.md and `references/hanab-live/`. Hanabi is a game designed by Antoine Bauza; this independent project is not affiliated with its publishers or Hanab Live. The license covers these contributions, not third-party trademarks or publications.
