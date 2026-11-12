// Renders the social preview card (og-card.png, 1200x630) with the page's own fonts and histogram.
//   node og.mjs <output-dir> <base-url-of-a-local-server-serving-the-site-root>
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const katex = require("katex"), V = require("./src/viz.js"), M = require("./src/model.js");
const outDir = path.resolve(process.argv[2]), base = process.argv[3];
const st = M.initial().st; st.live = true; st.cur = null;
const tex = katex.renderToString("D(\\theta, Am) \\,\\ge\\, \\mathrm{MAP}^*", { output: "html" });
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="katex/katex.min.css"><style>
@font-face { font-family: "Newsreader"; src: url("../newsreader-latin-var.woff2") format("woff2"); font-weight: 200 800; }
@font-face { font-family: "Newsreader"; src: url("../newsreader-latin-var-italic.woff2") format("woff2"); font-weight: 200 800; font-style: italic; }
@font-face { font-family: "IBM Plex Sans"; src: url("../ibm-plex-sans-latin-400-normal.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "IBM Plex Sans"; src: url("../ibm-plex-sans-latin-500-normal.woff2") format("woff2"); font-weight: 500; }
@font-face { font-family: "IBM Plex Sans"; src: url("../ibm-plex-sans-latin-600-normal.woff2") format("woff2"); font-weight: 600; }
:root { --paper:#F5F7FA; --surface:#FFFFFF; --ink:#111A2E; --ink-2:#46516A; --ink-3:#5E6880; --rule:#DDE2EA; --rule-strong:#C9D0DC; --mark:#2F50D8; --s-ours:#2F50D8; --s-ctx:#76819A; --grid:#E6EAF0; --bad-wash:rgba(194,58,47,.07); }
* { box-sizing: border-box; } html, body { margin: 0; }
body { width: 1200px; height: 630px; background: var(--paper); color: var(--ink); font-family: "IBM Plex Sans", sans-serif; display: grid; grid-template-columns: 1fr 452px; gap: 48px; padding: 60px 64px; -webkit-font-smoothing: antialiased; }
.l { display: flex; flex-direction: column; min-width: 0; }
.v { display: flex; align-items: center; gap: 14px; font-size: 27px; font-weight: 600; }
.b { font-size: 20px; font-weight: 600; padding: 8px 14px; border-radius: 999px; background: #FCEFD3; color: #7A4A00; line-height: 1; }
h1 { margin: 26px 0 0; font-family: "Newsreader", serif; font-weight: 500; font-size: 100px; line-height: .96; letter-spacing: -0.02em; }
.s { margin: 24px 0 0; font-family: "Newsreader", serif; font-size: 33px; line-height: 1.2; color: var(--ink-2); max-width: 560px; }
.a { margin-top: auto; font-size: 21px; line-height: 1.45; color: var(--ink-2); }
.a b { color: var(--ink); font-weight: 600; }
.c { background: var(--surface); border: 1px solid var(--rule); border-radius: 22px; padding: 30px 30px 24px; box-shadow: 0 1px 2px rgba(17,26,46,.06), 0 14px 40px rgba(17,26,46,.09); align-self: center; }
.f { font-size: 37px; line-height: 1.1; white-space: nowrap; } .f .katex { font-size: 1em; }
.q { margin-top: 8px; font-family: "Newsreader", serif; font-style: italic; font-size: 26px; color: var(--ink-2); }
.c svg { display: block; width: 100%; height: auto; margin-top: 14px; overflow: visible; }
.viz text { font-family: "IBM Plex Sans", sans-serif; fill: var(--ink-3); font-size: 12px; } .viz .strong { fill: var(--ink); font-weight: 600; } .viz .lab { fill: var(--ink-2); }
.viz .gridline { stroke: var(--grid); } .viz .axis { stroke: var(--rule-strong); } .viz .bar-ours { fill: var(--s-ours); } .viz .zone { fill: var(--bad-wash); } .viz .wall { stroke: var(--ink); stroke-width: 2; }
.n { margin-top: 12px; font-size: 19px; line-height: 1.4; color: var(--ink-2); }
</style></head><body>
<div class="l"><div class="v">NeurIPS 2026 <span class="b">Spotlight</span></div><h1>Neural Dual Bounds</h1><p class="s">Valid-by-Construction<br>JGLP <span style="white-space:nowrap">Warm-Starts</span> for MAP<br>and Constrained MAP</p>
<p class="a"><b>Akshay Vyas</b>, Shivvrat Arya, Brij Malhotra, Tahrima Rahman, Vibhav Gogate, Nicholas Ruozzi</p></div>
<div class="c"><div class="f">${tex}</div><div class="q">for every output of the network</div>${V.hist(st, 392)}<p class="n">${st.n} random outputs, ${st.below === 0 ? "none" : st.below} below the optimum.</p></div>
</body></html>`;
const tmp = path.join(outDir, "_og.html");
fs.writeFileSync(tmp, html);
const { launch } = await import("./test/browser.mjs");
const browser = await launch(["--force-color-profile=srgb"]);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(base.replace(/\/$/, "") + "/neural-dual-bounds/_og.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(outDir, "og-card.png") });
await browser.close();
fs.unlinkSync(tmp);
console.log("wrote", path.join(outDir, "og-card.png"), (fs.statSync(path.join(outDir, "og-card.png")).size / 1024).toFixed(0) + " KB");
