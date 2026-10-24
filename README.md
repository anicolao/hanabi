# Hanabi card printer

https://anicolao.github.io/hanabi/ · [Source](https://github.com/anicolao/hanabi)

A static print workspace for Hanabi's 50-card, five-colour base deck. Choose artwork, paper and sides; print or save a PDF. No landing page, rules section, account, or backend.

## Artwork sets

- **Painted diagonal** (default): the same 25 paintings with diagonal black rank fields, suit icons and a graphic frame. The earlier layout is retained as Painted classic.
- **Painted classic**: 25 independently generated gouache-style fireworks paintings, one per colour/value combination, plus a shared back. Source JPEGs are in `dist/assets/painted/`; standalone SVG card files embed the paintings and add consistent vector values and written colours. The imagery is raster artwork, not procedural vector illustrations. The back blends its painting with its 180° rotation to make the printed back exactly reversible. Black-and-white cards use a saturation filter and retain explicit suit names. Generation prompts and tool provenance are in `artwork/prompts.json`.
- **Hanab Live style**: counted suit pips, large coloured/outlined values, pale faces and a gray common back. Adapted from the GPLv3 Hanab Live project; attribution, reference commit, license and the five upstream pip paths are in `references/hanab-live/`. This print adaptation uses white for the fifth suit; the standard sets share the base deck composition.
- **Original SVG**: the first vector fireworks set, preserved unchanged in `dist/assets/cards/`, with its original black-and-white variant.

All copies of a given colour/value use the same illustration. Each set has one common back for every card in the selected deck. No rank or suit is encoded on the back.

## Local use

Requires Node.js 22+, Python 3, and `zip`. No runtime dependencies or remote fonts.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:5297. Serve `dist/` on any static host. ES modules require HTTP rather than file://. Generated illustrations are checked in; the build does not call an image-generation service. `scripts/artwork.mjs` regenerates the original SVG art, `scripts/live-artwork.mjs` builds the Hanab Live adaptation, and `scripts/painted-artwork.mjs` frames the checked-in paintings; `scripts/diagonal-artwork.mjs` adds the diagonal variant. Build also regenerates the source and artwork ZIPs.

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

## Diagonal painted frame

The default **Painted diagonal** variant uses the same 25 paintings, with two reversible black corner fields separated from the artwork by diagonal suit-colour rules. Large ivory values and five distinct suit icons (sun, star, leaf, wave, diamond) stay on the black fields; a fine graphic frame ties the face together. **Painted classic** remains available, as do Hanab Live style and Original SVG. `scripts/diagonal-artwork.mjs` builds the new frame; no painting is overwritten or regenerated.

## MakePlayingCards export

**Download MPC ZIP** creates a complete deck locally in the browser using the selected artwork and colour mode. The archive contains 50 numbered front PNGs (45 for Minh) in playing quantities, one common back PNG, `deck.csv`, `manifest.json`, upload instructions, and license/credits. Each duplicate front is intentionally repeated as its own numbered file. This export always produces the full deck, independently of gallery filters, paper size, single-sided printing or home-printer calibration.

The export targets MPC's **Custom Game Cards (63 × 88 mm)**, not Traditional Poker (63.5 × 88.9 mm). The official 63 × 88 mm template specifies **816 × 1110 px at 300 dpi**, with a centred **744 × 1038 px** card and **36 px bleed on every side**. Our conservative safe inset is 72 px from the outer image edge. PNGs are opaque RGB with a 300 dpi pHYs chunk; monochrome exports have equal RGB channels. The existing card is rasterized at trim size, and its edge pixels are extended into the bleed. There are no cut marks or template guides in the exported PNGs.

Unzip before uploading: the MPC designer receives the PNGs rather than the ZIP itself. Choose a capacity of at least 50 cards (the inspected product offers an “Up to 55” option), place the numbered fronts in order (45 for Minh), and use the shared back for every card. If the builder deduplicates images, use the CSV to place the required copies. If extra positions must be filled, use the shared-back image as their fronts and remove those spare cards before play. Review the supplier's final preview before ordering. The app does not upload files, create orders, or make purchases.

Verified 2026-10-22 against the official template and product page:
- https://www.makeplayingcards.com/dl/templates/playingcard/American-poker-size.pdf
- https://www.makeplayingcards.com/pops/pc-temp-guide.html
- https://www.makeplayingcards.com/design/custom-blank-card.html

`dist/mpc.js` defines the export geometry and rasterizer. `dist/archive.js` supplies a small dependency-free ZIP writer and PNG density writer. Tests read the real downloaded archives with Python's standard ZIP reader, verify all PNG dimensions/CRCs/density, check the full deck distribution, and inspect opacity and monochrome pixels.

## Minh deck

Select **Minh · Hanab Live multicolour**, or open `?deck=minh`. This keeps the counted-pip Hanab Live layout, replaces the white/grey suit with rainbow diamonds and black numerals, and includes one multicolour card of each rank 1–5. Red, yellow, green and blue retain standard quantities: 40 standard cards plus 5 unique multicolour cards = 45 total. Printing, gallery counts and MPC exports use this distribution; all previous decks remain available. The MPC ZIP has 45 numbered fronts and one common back.

Minh faces use symbols and numerals without printed colour labels. Both fronts and backs have a solid black border about 3 mm wide inside the trim, with black bleed for home printing and MPC export. Colour and monochrome variants share this border; inner coloured outlines and corner alignment diamonds are omitted for this deck.
