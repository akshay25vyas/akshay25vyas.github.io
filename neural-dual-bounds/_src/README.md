# Neural Dual Bounds project page: build sources

`../index.html` is generated from the files in this folder. Edit here and rebuild; do not edit the built page by hand.

This folder is not published. GitHub Pages skips folders whose names start with an underscore.

## Rebuild

    npm ci
    node build.mjs ..              # writes ../index.html and ../katex/
    node build.mjs .. paper.pdf    # same, and replaces ../Neural_Dual_Bounds_NeurIPS_2026.pdf

The build checks every count quoted in the text against the data and stops if one no longer matches. It also refuses em dashes, which the site does not use.

## What is where

| File | Purpose |
|---|---|
| `src/page.html` | The template: all copy and structure. `{{name}}` placeholders are filled by `build.mjs`. TeX goes in `\( \)` and `\[ \]` and is rendered at build time. |
| `src/styles.css` | All CSS. Colours and type follow the homepage; the two text fonts load from the site root. |
| `src/viz.js` | Chart renderers: pure functions that return SVG. They run at build time, and again in the browser to resize and add hover. |
| `src/model.js` | The three-cluster worked example (Table 5 of the paper) and the seeded sample behind the header histogram. |
| `src/app.js` | Interactivity: message sliders, hover read-outs, checkpoint toggles, BibTeX copy. The page is complete without it. |
| `data/parse_tables.py` | Reads the paper's tables out of `pdftotext -layout` output into `data/tables.json`, with a row-count check per table. |
| `data/fig1_curves.json` | The Figure 1 curves, read from the vector paths in the PDF and resampled at integer iterations. |
| `data/prepare.mjs` | Reduces `tables.json` and `fig1_curves.json` to `data/page-data.json`, the dataset embedded in the page. |
| `build.mjs` | Renders the math with KaTeX, draws the figures, runs the checks, writes the page. |
| `og.mjs` | Renders `../og-card.png`, the 1200 by 630 link preview. |
| `test/` | `interact.mjs` is the interaction test, `shot.mjs` takes screenshots, `browser.mjs` finds Playwright and Chrome. |

## Refresh the numbers from a new PDF

    pdftotext -layout paper.pdf paper_layout.txt
    python3 data/parse_tables.py paper_layout.txt data/tables.json
    node data/prepare.mjs
    node build.mjs .. paper.pdf

Table numbers are hard-coded in `parse_tables.py` (Tables 1, 2, 3, 16, 18, 22, 24, 29, 31, 32, 33, 34). If the appendix is renumbered, update them there.

## Test

    python3 -m http.server 8765 --bind 127.0.0.1     # from the repository root
    node test/interact.mjs                           # 60 checks on desktop, phone and dark
    node og.mjs .. http://127.0.0.1:8765             # regenerate the link preview

The tests and `og.mjs` need Playwright. Set `CHROME_PATH` to use a specific browser binary. The test saves screenshots of each state to `shots/`, which git ignores.

## Updated by hand

- Links. The page links the PDF and the NeurIPS poster page. When the paper is on arXiv, the OpenReview forum is public, or the code has a repository, add them to the resources list in the `#paper` section of `src/page.html` and, if wanted, to the hero buttons.
- The poster-session line in the hero. It was converted from the listing on neurips.cc; check it against the final schedule.
- The spotlight figure in the hero (292 of 30,709 submissions).
- `../paper-first-page.jpg`: page 1 of the PDF, cropped to the text block, 560 px wide.

## Choices worth knowing about

- The MAP results are the 100-seed evaluation (Appendix B.24, Tables 22, 31 and 32), shown as paired per-seed effects with their intervals.
- Figure 1 is redrawn from the paper's own curves so that it reads at any width and can be inspected by hover.
- The abstract is reproduced exactly as printed.
