# Melinda Mortimer — portfolio

Static portfolio deployed by GitHub Pages from the root of `main`.

## Run locally

```sh
python -m http.server 8767 --bind 127.0.0.1
```

Open http://127.0.0.1:8767. No build step or runtime CSS CDN is needed.

## Structure

- `index.html`: portfolio copy and project links.
- `assets/site.css`: responsive design and self-hosted Inter font.
- `assets/site.js`: sandboxed cat comparison viewer.
- `experiments/cat/`: archive context and keyboard/touch adapter.
- `experiments/cat/archive/`: historical game snapshots; do not modernise their game code.
- `pokemon-team-builder/`: existing playable demo.

## Archive provenance

Both snapshots come from https://github.com/melindamortimer/cat-platformer:

| Directory | Commit                                     | Date       |
| --------- | ------------------------------------------ | ---------- |
| `2025-05` | `fb041d644ee6827bde232105527248eccbf3924a` | 2025-05-19 |
| `2025-06` | `023b2177c887e9cc27e7bd17a835ede38e068411` | 2025-06-29 |

Original `index.html`, `style.css`, `script.js` and image bytes are preserved. `preview.html` adds only the separate viewer adapter. Model attribution comes from the project author; exact model identifiers and prompts are not established by Git history. This is an iteration showcase, not a model benchmark.

To add another iteration, preserve a new snapshot, add its provenance, generate a real browser preview, and extend the build configuration in `assets/site.js` plus the tabs and descriptions in `index.html`.

## Verification

Run `node --check assets/site.js` and `node --check experiments/cat/bridge.js`.
Check desktop and narrow mobile layouts, tab keyboard navigation, Play, switching while playing, Restart, Stop, Escape, and touch controls. Test original archive URLs independently. The archived games intentionally retain historical limitations.

Font: Inter by the Inter Project Authors, SIL Open Font License; see `assets/Inter-LICENSE.txt`.

When changing shared CSS or JavaScript, bump the `v` query in the HTML asset URLs so returning visitors receive the new version immediately.
