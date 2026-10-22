# Hanab Live style reference

Upstream: https://github.com/Hanabi-Live/hanabi-live
Reference website: https://hanab.live
Commit inspected: 647515eec6c03c79030e05f964c0e22e44938ed6

`pips.js` adapts the first five Canvas pip path functions from `packages/client/src/game/ui/drawPipFunctions.ts`. TypeScript annotations and unused pips were removed. Copyright belongs to the Hanab Live contributors; the upstream GPL version 3 license is preserved in LICENSE.

`scripts/live-artwork.mjs` converts those paths to SVG and adapts the counted-pip positioning, coloured outlined corner numbers, lightly tinted faces, and gray shared back from `packages/client/src/game/ui/drawCards.ts` into 63 × 88 mm print cards. It is not the upstream client renderer. The classic fifth pip is rendered in white rather than Hanab Live's usual purple, so the same five-colour base deck can be printed with any of our artwork selections. That choice does not import Hanab Live variant rules.

No upstream application code, network dependency, or account is needed at runtime. The style selector identifies the adaptation as “Hanab Live style,” rather than claiming an official edition or affiliation.
