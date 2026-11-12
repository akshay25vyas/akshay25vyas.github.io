// Builds neural-dual-bounds/index.html from src/ and data/.
//   node build.mjs <output-dir> [paper.pdf]
// Figures are drawn here, into the HTML, by the same code the browser runs (src/viz.js).
// Numbers quoted in the prose are computed from data/page-data.json and checked below,
// so a wrong count stops the build instead of reaching the page.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const katex = require("katex");
const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, p), "utf8");
const outDir = path.resolve(process.argv[2] || path.join(here, "out/neural-dual-bounds"));
const PDF_NAME = "Neural_Dual_Bounds_NeurIPS_2026.pdf";

const V = require("./src/viz.js"), M = require("./src/model.js");
const D = JSON.parse(read("data/page-data.json"));
const check = (cond, msg) => { if (!cond) throw new Error("check failed: " + msg); };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MINUS = "−", TIMES = "×";

/* ---------- numbers quoted in the text, with their checks ---------- */
const distinct = D.map.filter((r) => !r.dup);
check(distinct.length === 15, "15 distinct MAP models");
const count = (ci, f) => distinct.filter((r) => f(r.d[ci])).length;
const pos = (ci) => count(ci, (d) => d[3] === 1 && d[0] > 0), neg = (ci) => count(ci, (d) => d[3] === 1 && d[0] < 0);
const N = { pos0: pos(0), neg0: neg(0), pos10: pos(1), neg10: neg(1), pos50: pos(2), neg50: neg(2) };
check(N.pos10 === 9 && N.neg10 === 1, `iteration 10: expected 9 for / 1 against, got ${N.pos10}/${N.neg10}`);
const seg14 = D.map.find((r) => r.k === "seg_14"), seg16 = D.map.find((r) => r.k === "seg_16");
check(Math.abs(Math.pow(10, seg14.d[1][0]) - 8.55) < 0.06, "Seg_14 effect at iteration 10 is 8.6x");
check(distinct.every((r) => Math.pow(10, r.d[1][0]) <= Math.pow(10, seg14.d[1][0]) + 1e-9), "Seg_14 is the largest effect at iteration 10");
check(distinct.filter((r) => r.d[1][3] && r.d[1][0] < 0).map((r) => r.k).join() === "grid10×10.f10", "only grid10x10.f10 favours zero init at iteration 10");
check(distinct.every((r) => r.d[2][0] <= seg16.d[2][0]) && Math.round(Math.pow(10, seg16.d[2][0])) === 178, "Seg_16 is the largest effect at iteration 50 (178x)");
check(distinct.every((r) => Math.abs(r.d[4][0]) < 0.03), "by iteration 500 the two starts agree to within a few percent");
check(seg14.J[2][0] < 0.002 && seg14.N[2][0] < 0.002, "Seg_14 mean gaps at iteration 50 are near 0.001");

const cm = D.cmpe.filter((r) => !r.dup), far = cm.filter((r) => r.fam !== "bn"), bn = cm.filter((r) => r.fam === "bn");
check(cm.length === 14 && far.length === 10 && bn.length === 4, "CMPE K=2 has 14 distinct models, 10 of them grid or segmentation");
for (let bi = 0; bi < 3; bi++) check(far.every((r) => r.tta[bi][0] < Math.min(r.jglp[bi][0], r.nn[bi][0], r.ws[bi][0])), "NN+TTA is the tightest method on every grid and segmentation model at budget " + bi);
check(far.every((r) => r.ws[0][0] > r.jglp[0][0]), "at 10 iterations JGLP+WS is looser than zero init on every grid and segmentation model");
const ratio = (bi) => far.map((r) => r.ws[bi][0] / r.tta[bi][0]);
const round2 = (v) => v >= 100 ? Math.round(v / 10) * 10 : v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
const span = (bi) => { const a = ratio(bi); return [round2(Math.min(...a)), round2(Math.max(...a))]; };
const bnSpan = (bi) => Math.ceil(Math.max(...bn.map((r) => Math.max(r.ws[bi][0] / r.tta[bi][0], r.tta[bi][0] / r.ws[bi][0]))));
const p2 = D.cmpe.filter((r) => r.fam !== "bn").map((r) => r.p[0]), p1 = D.cmpe1.filter((r) => r.fam !== "bn").map((r) => r.p[0]);
check(p2.every((c) => c[3] === 1 && c[0] > 0) && p1.every((c) => c[3] === 1 && c[0] > 0), "NN+TTA significantly ahead of JGLP+WS on every grid and segmentation row at 10 iterations, K=1 and K=2");
const bn1 = D.cmpe1.filter((r) => r.fam === "bn").map((r) => r.p[0][0]);
check(bn1.every((v) => v <= -3 && v >= -4), "K=1 Bayesian networks: lambda-continuity ahead by three to four orders");
check(D.cmpe.filter((r) => r.fam === "bn").filter((r) => r.p[0][3] === 1).length <= 1, "K=2 Bayesian networks: comparable");
const one = (v) => v.toFixed(1);

const val = D.validity, vAll = val.find((r) => r.source.startsWith("all")), vZero = val.find((r) => r.source.startsWith("zero"));
const vNet = val.filter((r) => r !== vAll && r !== vZero);
check(vAll.n === 9588 && vZero.n === 1598 && vNet.length === 5 && vNet.every((r) => r.n === 1598 && r.min > 0), "validity: 5 network sources x 1,598 queries, all strictly positive");
check(Math.max(...val.map((r) => r.ds)) < 2.5e-10, "largest score change is below 2.5e-10");

const start = M.initial();
check(start.st.below === 0 && start.st.n === 300 && M.MAP.value === 17 && M.evaluate([0, 0, 0, 0]).D === 19 && M.evaluate(M.PAPER_M).D === 17, "worked example: optimum 17, bound 19 without messages, 17 with the paper's messages");
{ const r = M.rng(7); for (let i = 0; i < 200000; i++) { const m = [0, 0, 0, 0].map(() => Math.round((r() - 0.5) * 200)); const e = M.evaluate(m); check(e.D >= 17 && M.unchanged(e.t) === 16, "bound below the optimum for m = " + m); } }

const T = {
  pdf: PDF_NAME, spot: "292", subs: "30,709", spotpct: (292 / 30709 * 100).toFixed(2),
  "val.q": "1,598", "val.net": "7,990", "val.all": "9,588", "val.zero": "53",
  "map.models": "15", "map.pos10": String(N.pos10),
  "hist.n": String(start.st.n), "hist.below": String(start.st.below), "hist.exact": String(start.st.exact),
  "tta.k1": "36", "tta.k2": "25",
  "p2.lo": one(Math.min(...p2.map((c) => c[0]))), "p2.hi": one(Math.max(...p2.map((c) => c[0]))),
  "p1.lo": one(Math.min(...p1.map((c) => c[0]))), "p1.hi": one(Math.max(...p1.map((c) => c[0]))),
  "forest.title0": `The forward pass alone beats the mini-bucket start on ${N.pos0} of 15 models and loses on ${N.neg0}`,
  "forest.note0": "Before any JGLP iteration, the comparison is the network's bound against the moment-matched mini-bucket start. A prediction is always valid but not always the better start, which is why a solver can take the lower of the two.",
  "forest.title1": `At iteration 10 the warm start is significantly tighter on ${N.pos10} of 15 models`,
  "forest.note1": `The largest effects are on the segmentation models, up to 8.6${TIMES} on Seg_14. Zero initialization is significantly tighter on one model, grid10${TIMES}10.f10, where the mini-bucket start is already at the optimum on many seeds.`,
  "forest.title2": `By iteration 50 zero initialization has caught up, and it is ahead on ${N.neg50} of 15 models`,
  "forest.note2": `A tighter start does not imply a faster path to high precision. The ratios are large because the gaps are by now tiny: on Seg_14 both mean gaps are near ${V.gap(seg14.N[2][0])}. The warm start is still significantly ahead on ${N.pos50} models, by about 180${TIMES} on Seg_16. The benefit is confined to the early iterations.`,
  "cmpe.title": "With two constraints, the adapted network is the tightest start on every grid and segmentation model",
  "cmpe.note0": `At 10 inner iterations NN+TTA is ${span(0)[0]}${TIMES} to ${span(0)[1]}${TIMES} tighter than JGLP+WS on the grid and segmentation models, where reusing a stale solution is worse than starting from zero. On the Bayesian networks the two are within a factor of ${bnSpan(0)}.`,
  "cmpe.note1": `At 50 inner iterations the ordering holds: NN+TTA is ${span(1)[0]}${TIMES} to ${span(1)[1]}${TIMES} tighter than JGLP+WS on the grid and segmentation models. On the Bayesian networks the two are within a factor of ${bnSpan(1)}.`,
  "cmpe.note2": `At 100 inner iterations NN+TTA is still ${span(2)[0]}${TIMES} to ${span(2)[1]}${TIMES} tighter than JGLP+WS on the grid and segmentation models. On the Bayesian networks the two are within a factor of ${bnSpan(2)}.`,
};

/* ---------- worked example markup ---------- */
function labHTML(m) {
  const r = M.evaluate(m), opt = M.MAP.x, sub = ["₀", "₁", "₂", "₃"], f = (v) => (v < 0 ? MINUS : "") + Math.abs(v);
  const cluster = (c) => {
    const a = "x" + sub[c], b = "x" + sub[c + 1];
    let rows = "";
    for (let i = 0; i < 2; i++) {
      rows += `<tr><th scope="row">${a}=${i}</th>`;
      for (let j = 0; j < 2; j++) {
        const cls = ["cell"]; if (r.t[c][i][j] === r.max[c]) cls.push("max"); if (opt[c] === i && opt[c + 1] === j) cls.push("opt");
        rows += `<td><div class="${cls.join(" ")}" data-c="${c}" data-i="${i}" data-j="${j}"><span class="d" aria-hidden="true"></span><span class="v">${f(r.t[c][i][j])}</span><span class="o">was ${f(M.T[c][i][j])}</span></div></td>`;
      }
      rows += "</tr>";
    }
    return `<div class="cl"><div class="cl-h">Cluster C${sub[c + 1]}<span>${a}, ${b}</span></div><table><thead><tr><td></td><th scope="col">${b}=0</th><th scope="col">${b}=1</th></tr></thead><tbody>${rows}</tbody></table><div class="cl-max"><span>cluster maximum</span><b id="cl-max-${c}">${f(r.max[c])}</b></div></div>`;
  };
  const edge = (e) => {
    const v = "x" + sub[e + 1], from = "C" + sub[e + 1], to = "C" + sub[e + 2];
    const msg = (k, val) => `<div class="msg"><label for="m${k}">message at ${v}=${val}</label><input type="range" id="m${k}" data-m="${k}" min="-10" max="10" step="1" value="${m[k]}"><output data-mo="${k}" for="m${k}">${f(m[k])}</output></div>`;
    return `<div class="edge"><div class="edge-in"><div class="edge-h">shared variable <b>${v}</b><br>${from} gives up, ${to} gains</div>${msg(2 * e, 0)}${msg(2 * e + 1, 1)}</div></div>`;
  };
  const o = [r.t[0][opt[0]][opt[1]], r.t[1][opt[1]][opt[2]], r.t[2][opt[2]][opt[3]]];
  T["lab.sum"] = `${f(r.max[0])} + ${f(r.max[1])} + ${f(r.max[2])} = ${f(r.D)}`;
  T["lab.state"] = r.D === 17 ? "exact" : "gap of " + (r.D - 17);
  T["lab.opt"] = `${o.map(f).join(" + ")} = ${f(o[0] + o[1] + o[2])}`;
  return `<div class="lab-grid" id="lab">${cluster(0)}${edge(0)}${cluster(1)}${edge(1)}${cluster(2)}</div>`;
}

/* ---------- table views ---------- */
const sci = (v) => { if (v === 0) return "0"; const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return (m < 0 ? MINUS : "") + Math.abs(m).toFixed(2) + TIMES + "10" + String(e).replace("-", MINUS).replace(/[−\d]/g, (c) => c === MINUS ? "⁻" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]); };
const sig3 = (v) => { const a = Math.abs(v), e = Math.floor(Math.log10(a)), dp = Math.max(0, 2 - e); return (v < 0 ? MINUS : "") + V.thousands(a.toFixed(dp)); };
const smart = (v) => (v === 0 ? "0" : Math.abs(v) >= 0.01 && Math.abs(v) < 100000 ? sig3(v) : sci(v));
const SRC = { "zero": "No messages (the mini-bucket bound)", "trained": "Trained network", "untrained": "Untrained network, random initialization", "anti-trained": `Trained messages multiplied by ${MINUS}5`, "adversarial Gaussian": `Gaussian noise at 10${TIMES} the trained scale`, "adversarial extreme": "Extreme values, ±10⁴", "all": "All sources" };
function validityTable() {
  const name = (s) => { const k = Object.keys(SRC).filter((k) => s.startsWith(k)).sort((a, b) => b.length - a.length)[0]; check(k, "validity source " + s); return SRC[k]; };
  const body = val.map((r) => `<tr${r === vAll ? ' class="grp"' : ""}><td>${esc(name(r.source))}</td><td>${smart(r.min)}</td><td>${smart(r.med)}</td><td>${smart(r.rel)}</td><td>${V.thousands(r.n)}</td><td>${r.ds === 0 ? "0" : sci(r.ds)}</td></tr>`).join("");
  return `<table class="data wrap-first"><thead><tr><th scope="col">Message source</th><th scope="col">Smallest margin</th><th scope="col">Median margin</th><th scope="col">Smallest relative margin</th><th scope="col">Bounds</th><th scope="col">Largest change in a total score</th></tr></thead><tbody>${body}</tbody></table>`;
}
function convTable() {
  const its = [0, 1, 5, 10, 20, 50, 100, 200];
  const f = (p, v) => (v < 0 ? MINUS : "") + V.thousands(Math.abs(v).toFixed(Math.abs(p.zero[0]) > 1000 ? 1 : 2));
  const head = `<tr><th scope="col">Iteration</th>${D.fig1.map((p) => `<th scope="col">${esc(p.name)}, zero init</th><th scope="col">${esc(p.name)}, warm start</th>`).join("")}</tr>`;
  const body = its.map((t) => `<tr><td>${t}</td>${D.fig1.map((p) => `<td>${f(p, p.zero[t])}</td><td>${f(p, p.neural[t])}</td>`).join("")}</tr>`).join("");
  return `<table class="data"><thead>${head}</thead><tbody>${body}</tbody><caption>Bound value at selected JGLP iterations. The warm start's value at iteration 0 is the forward pass alone.</caption></table>`;
}
function groupRows(rows, cols, cell) {
  let out = "", last = null;
  for (const r of rows) { if (r.fam !== last) { out += `<tr class="grp"><td colspan="${cols}">${V.FAM[r.fam]}</td></tr>`; last = r.fam; } out += cell(r); }
  return out;
}
function forestTable() {
  const c = (d) => `${V.signed(d[0], 3)}${d[3] ? "*" : ""} [${V.signed(d[1], 3)}, ${V.signed(d[2], 3)}]`;
  const head = `<tr><th scope="col">Model</th>${D.iters.map((t) => `<th scope="col">Iteration ${t}: median, 95% interval</th><th scope="col">Seeds won or tied</th>`).join("")}</tr>`;
  const body = groupRows(D.map, 11, (r) => `<tr><td>${esc(r.name)}${r.dup ? " (same file as Grids_29)" : ""}</td>${r.d.map((d, i) => `<td${d[3] ? ' class="yes"' : ""}>${c(d)}</td><td>${r.w[i][0]}%</td>`).join("")}</tr>`);
  return `<table class="data"><thead>${head}</thead><tbody>${body}</tbody><caption>Median over seeds of log₁₀(zero-init gap ÷ warm-start gap). Positive favours the warm start and one unit is one order of magnitude. An asterisk marks significance at 0.05 after Holm correction. At iterations 100 and 500 both starts are at or near the LP solver's working accuracy on several models, so the paper cautions against reading those differences as a result in either direction.</caption></table>`;
}
function cmpeTable() {
  const pm = (a) => `${V.gap(a[0])} ± ${V.gap(a[1])}`;
  return D.cmpeIters.map((it, bi) => {
    const head = `<tr><th scope="col">Model</th><th scope="col">JGLP from zero</th><th scope="col">NN, frozen</th><th scope="col">JGLP+WS</th><th scope="col">NN+TTA</th><th scope="col">Paired median, NN+TTA against JGLP+WS</th></tr>`;
    const body = groupRows(D.cmpe, 6, (r) => `<tr><td>${esc(r.name)}${r.dup ? " (same file as Grids_29)" : ""}</td><td>${pm(r.jglp[bi])}</td><td>${pm(r.nn[bi])}</td><td>${pm(r.ws[bi])}</td><td class="yes">${pm(r.tta[bi])}</td><td>${V.signed(r.p[bi][0], 2)}${r.p[bi][3] ? "*" : ""} [${V.signed(r.p[bi][1], 2)}, ${V.signed(r.p[bi][2], 2)}]</td></tr>`);
    return `<table class="data"${bi ? ' style="margin-top:22px"' : ""}><thead>${head}</thead><tbody>${body}</tbody><caption>${it} inner JGLP iterations, two constraints. Mean ± standard deviation of the gap to the LP optimum over 5,000 trials per cell. The last column is the median over seeds of log₁₀(JGLP+WS gap ÷ NN+TTA gap) with its 95% interval; an asterisk marks significance after Holm correction.</caption></table>`;
  }).join("");
}

/* ---------- assemble ---------- */
/* The paper thumbnail's size, read from the JPEG header so the img tag reserves the right space. */
const jpegSize = (file) => { const b = fs.readFileSync(file); let i = 2; while (i < b.length) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; i += 2 + len; } throw new Error("no JPEG size in " + file); };
{ const t = jpegSize(path.join(outDir, "paper-first-page.jpg")); T["thumb.w"] = String(t.w); T["thumb.h"] = String(t.h); }
const convs = D.fig1.map((p, i) => `<div><p class="panel-h">${esc(p.name)}<span>${esc(p.family)}</span></p><div class="plot" data-chart="conv" data-i="${i}">${V.conv(p, 340)}</div></div>`).join("\n        ");
const parts = {
  css: read("src/styles.css"), viz: read("src/viz.js"), model: read("src/model.js"), app: read("src/app.js"),
  data: JSON.stringify(D).replace(/</g, "\\u003c"),
  hist: V.hist(start.st, 440), lab: labHTML([0, 0, 0, 0]), convs,
  forest: V.forest(D.map, 1, 1060), cmpe: V.cmpe(D.cmpe, 0, 1060),
  "table:validity": validityTable(), "table:conv": convTable(), "table:forest": forestTable(), "table:cmpe": cmpeTable(),
};
let html = read("src/page.html");
const macros = {};
let nMath = 0;
const tex = (src, displayMode) => { nMath++; return katex.renderToString(src.trim(), { displayMode, throwOnError: true, strict: "error", output: "htmlAndMathml", macros }); };
html = html.replace(/\\\[([\s\S]+?)\\\]/g, (_, s) => tex(s, true)).replace(/\\\((.+?)\\\)/g, (_, s) => tex(s, false));
const textKeys = new Set(Object.keys(T));
html = html.replace(/\{\{([a-zA-Z0-9.:]+)\}\}/g, (all, k) => {
  if (k in parts) return parts[k];
  if (textKeys.has(k)) return esc(T[k]);
  throw new Error("unknown placeholder " + all);
});
check(!/\{\{[a-zA-Z0-9.:]+\}\}/.test(html.replace(/<script>[\s\S]*?<\/script>/g, "")), "unfilled placeholder");
check(!/—/.test(html), "em dash in the page");

fs.mkdirSync(path.join(outDir, "katex", "fonts"), { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html);
const kdist = path.join(here, "node_modules/katex/dist");
fs.copyFileSync(path.join(kdist, "katex.min.css"), path.join(outDir, "katex", "katex.min.css"));
fs.copyFileSync(path.join(here, "node_modules/katex/LICENSE"), path.join(outDir, "katex", "LICENSE-KaTeX.txt"));
for (const f of fs.readdirSync(path.join(kdist, "fonts"))) if (f.endsWith(".woff2")) fs.copyFileSync(path.join(kdist, "fonts", f), path.join(outDir, "katex", "fonts", f));
if (process.argv[3]) fs.copyFileSync(process.argv[3], path.join(outDir, PDF_NAME));
console.log(`built ${path.join(outDir, "index.html")} (${(html.length / 1024).toFixed(0)} KB, ${nMath} formulas)`);
console.log("counts", JSON.stringify(N), "| CMPE spans", JSON.stringify([span(0), span(1), span(2)]), "BN within", [bnSpan(0), bnSpan(1), bnSpan(2)].join("/"), "| paired K2", T["p2.lo"], T["p2.hi"], "K1", T["p1.lo"], T["p1.hi"], "| exact at optimum", start.st.exact);
