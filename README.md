# Hanabi · Print Studio

A free, independent print-and-play destination for the five-colour Hanabi base game. Original editable vector illustrations, a card gallery, browser printing and source/artwork downloads. GPL-3.0-only. Game design: Antoine Bauza.

Print studio: https://anicolao.github.io/hanabi/

Public source: https://github.com/anicolao/hanabi

## Hosting

GitHub Pages serves `dist/`. Every push to `main` rebuilds the SVGs and downloads, runs the unit and Playwright suites, then publishes the verified artifact. Pull requests run the same checks without deploying. The workflow is `.github/workflows/verify.yml`; there is no external hosting service or hosting credential. To deploy a fork, enable GitHub Pages with GitHub Actions as its source. Asset and download URLs are relative, so repository subpaths work without a special build.

## Run locally

Requires Node.js 22+, Python 3, and the `zip` command. No runtime JavaScript dependencies, remote fonts, analytics, accounts, or backend.

```sh
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:5297. The complete site is in `dist/`; serve that directory with any static host. Downloads work offline after saving the files. ES modules require HTTP rather than opening index.html through file://.

## Print a set

Choose full deck, A4 or US Letter, and colour or low ink. Use Print / save PDF. Match paper, portrait orientation, 100% / actual-size scale, background graphics on, headers/footers off. For duplex, flip on the long edge. Print an alignment-test pair first; back offsets can move the reverse up to ±5 mm horizontally or vertically as viewed from the back. Separate fronts and backs preserve sheet-number order; manually establish your printer's feed and stack directions with a test before running a full job.

The deck has 50 cards: each of five colours contains three 1s, two 2s, two 3s, two 4s, and one 5. Six physical sheets, twelve interleaved PDF pages, nine 63 × 88 mm cards per full sheet. Backs reflect across the full page, including partial sheets. External crop marks and 1 mm bleed support shared straight cuts. White diamonds at grid intersections help compare alignment against a light. Crop marks require a printable area within 4 mm of the Letter edge; consult your printer. Leave spare positions blank. The sampler prints one of each unique front (25 cards); gallery selection prints the current filtered cards with their proper multiplicities. Print the single-sided sheet of eight clue and three fuse markers as a separate job.

Use opaque cardstock or identical opaque sleeves with backing cards. Hidden information is essential: test for transparency and distinguishable backs. Each suit has a written name and unique motif as well as a colour. Low-ink fronts retain shape and value in black and white. All cards share one two-way back; no suit or rank is encoded in it.

## Edit the art

`scripts/artwork.mjs` generates 25 colour faces, 25 monochrome faces, and two common backs. The design coordinate system is 630 × 880, exported at 63 × 88 mm. Change it and run `npm run build`, or edit an exported SVG. The build regenerates artwork and both downloadable ZIPs, so make permanent changes in the generator. `dist/deck.js` owns suit data, multiplicities, and pure print geometry. `dist/app.js` drives the gallery, accessible card dialog, print controls, and preview. `dist/style.css` contains screen and physical print layouts.

## Validation

`npm test` checks deck composition, both paper sizes, all reflected positions including the final partial sheet, separate jobs, calibration, sampler, and filtered subsets. For repeatable browser QA, run `npm ci`, `npx playwright install chromium`, then `npm run test:e2e`. To use an installed Chrome instead, run `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`. The desktop and phone projects test gallery filters, keyboard dialogs, SVG downloads, print subsets, tokens, offsets, loaded artwork, ZIP downloads, print invocation, responsive overflow, and actual browser-generated PDF page counts and dimensions. Physical printer alignment still requires the test print described above.

## License

Code, original artwork, and documentation: GNU GPL version 3 only. See LICENSE and NOTICE.md. This license covers our contributions, not the original commercial game's intellectual property. No commercial Hanabi artwork is distributed.
