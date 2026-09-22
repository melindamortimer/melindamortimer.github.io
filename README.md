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
- `assets/site.js`: cat comparison viewer.
- `experiments/cat/`: archive context and keyboard/touch adapter.
- `experiments/cat/archive/`: historical game snapshots; do not modernise their game code.
- `pokemon-team-builder/`: existing playable demo.

## Archive provenance

Snapshots come from https://github.com/melindamortimer/cat-platformer:

| Directory                   | Commit                                     | Date                    |
| --------------------------- | ------------------------------------------ | ----------------------- |
| `2025-05`                   | `fb041d644ee6827bde232105527248eccbf3924a` | 2025-05-19              |
| `2026-07`                   | `0663c3c258b14fd7f7d7e23d83eaef4df7c92565` | July 2026 (GPT 5.6 Sol) |
| `2025-06` (legacy URL only) | `023b2177c887e9cc27e7bd17a835ede38e068411` | 2025-06-29              |

The comparison shows only **Gemini · May 2025** and **GPT 5.6 Sol · July 2026**. The author confirmed the model and development month for the latest build; the later push date is not used. Exact Gemini version is unknown. The June archive remains available for old links but is not part of the comparison.

Original runtime source and image bytes are preserved from Git blobs. The July snapshot includes only the runtime files, not production experiments or test artifacts. `preview.html` adds a separate viewer bridge. The legacy game is sandboxed; the trusted first-party July game uses a normal same-origin iframe for ES modules and local save data. Its own controls and responsive layout remain intact. Shift+Escape returns focus to the viewer; regular Escape still pauses the game. This is an iteration showcase, not a model benchmark.

`projects/cricket-model/` is a public case study with a real UI capture. The private repository, database and operational data are not deployed. DS Model Template is listed in More to explore.

To add another iteration, preserve a new snapshot, add its provenance, generate a real browser preview, and extend the build configuration in `assets/site.js` plus the tabs and descriptions in `index.html`.

## Verification

Run `node --check assets/site.js` and `node --check experiments/cat/bridge.js` and `node --check experiments/cat/modern-bridge.js`.
Check desktop and narrow mobile layouts, tab keyboard navigation, Play, switching while playing, Restart, Stop, Escape, and touch controls. Test original archive URLs independently. The archived games intentionally retain historical limitations.

Font: Inter by the Inter Project Authors, SIL Open Font License; see `assets/Inter-LICENSE.txt`.

When changing shared CSS or JavaScript, bump the `v` query in the HTML asset URLs so returning visitors receive the new version immediately.
