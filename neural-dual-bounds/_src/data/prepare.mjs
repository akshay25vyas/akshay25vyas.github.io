// Turns the parsed paper tables into the compact dataset embedded in the page.
// Source of every value: data/tables.json (parsed from the camera-ready PDF) and
// data/fig1_curves.json (read off the vector paths of the paper's Figure 1).
import fs from "node:fs";
const T = JSON.parse(fs.readFileSync(new URL("./tables.json", import.meta.url)));
const F = JSON.parse(fs.readFileSync(new URL("./fig1_curves.json", import.meta.url)));

const key = (s) => s.toLowerCase().replace(/^segmentation_/, "seg_").replace(/(\d)x(\d)/g, "$1×$2").replace(/\.wrap$/, "");
const DISPLAY = { "bn_9": "BN_9", "bn_12": "BN_12", "bn_13": "BN_13", "bn_14": "BN_14",
  "seg_12": "Seg_12", "seg_14": "Seg_14", "seg_16": "Seg_16", "seg_18": "Seg_18", "seg_19": "Seg_19",
  "grids_26": "Grids_26", "grids_28": "Grids_28", "grids_29": "Grids_29",
  "grid10×10.f5": "grid10×10.f5", "grid10×10.f10": "grid10×10.f10", "grid20×20.f5": "grid20×20.f5", "grid20×20.f10": "grid20×20.f10",
  "grid40×40.f10": "grid40×40.f10", "grid40×40.f2": "grid40×40.f2" };
const FAMILY = (k) => k.startsWith("bn_") ? "bn" : k.startsWith("seg_") ? "seg" : "grid";
const ORDER = ["bn_9", "bn_12", "bn_13", "bn_14", "seg_12", "seg_14", "seg_16", "seg_18", "seg_19",
  "grids_26", "grids_28", "grids_29", "grid10×10.f5", "grid10×10.f10", "grid20×20.f5", "grid20×20.f10", "grid40×40.f10", "grid40×40.f2"];
const byOrder = (a, b) => ORDER.indexOf(a.k) - ORDER.indexOf(b.k);
const need = (k) => { if (!(k in DISPLAY)) throw new Error("unknown model " + k); return k; };

// --- MAP: paired per-seed statistics (Table 31), win rates (Table 32), mean gaps (Table 22)
const t31 = Object.fromEntries(T.map_table31.rows.map(r => [need(key(r.pgm)), r.cells]));
const t32 = Object.fromEntries(T.map_table32.rows.map(r => [need(key(r.pgm)), r]));
const t22 = Object.fromEntries(T.map_table22.rows.map(r => [need(key(r.pgm)), r]));
const mapRows = Object.keys(t31).map(k => ({
  k, name: DISPLAY[k], fam: FAMILY(k), dup: k === "grid20×20.f5",
  n: t32[k].n,
  d: t31[k].map(c => [c.median, c.lo, c.hi, c.sig ? 1 : 0]),
  w: t32[k].cells.map(c => [c.win, c.lo, c.hi]),
  J: t22[k].J.map(c => [c.mean, c.std]), N: t22[k].N.map(c => [c.mean, c.std]),
})).sort(byOrder);
if (mapRows.length !== 16) throw new Error("expected 16 MAP rows");

// --- CMPE with two constraints (Tables 2 and 3) and paired statistics (Table 33)
const t33 = {}; for (const r of T.cmpe_table33.rows) t33[r.K + "|" + need(key(r.pgm))] = r.cells;
const cm = T.cmpe_k2.rows.map(r => { const k = need(key(r.pgm)); return {
  k, name: DISPLAY[k], fam: FAMILY(k), dup: k === "grid20×20.f5",
  jglp: r["JGLP"].map(c => [c.mean, c.std]), nn: r["NN"].map(c => [c.mean, c.std]),
  ws: r["JGLP+WS"].map(c => [c.mean, c.std]), tta: r["NN+TTA"].map(c => [c.mean, c.std]),
  p: t33["2|" + k].map(c => [c.median, c.lo, c.hi, c.sig ? 1 : 0]) }; }).sort(byOrder);
const cm1 = T.cmpe_table33.rows.filter(r => r.K === 1).map(r => { const k = need(key(r.pgm)); return {
  k, name: DISPLAY[k], fam: FAMILY(k), dup: k === "grid20×20.f5", p: r.cells.map(c => [c.median, c.lo, c.hi, c.sig ? 1 : 0]) }; }).sort(byOrder);
if (cm.length !== 15 || cm1.length !== 17) throw new Error("unexpected CMPE row counts");

// --- Figure 1 curves, resampled at every integer iteration (the published curves are straight between vertices)
const resample = (pts) => { const out = []; let j = 0;
  for (let t = 0; t <= 200; t++) { while (j < pts.length - 2 && pts[j + 1][0] < t) j++;
    const [x0, y0] = pts[j], [x1, y1] = pts[j + 1]; const u = x1 === x0 ? 0 : Math.min(1, Math.max(0, (t - x0) / (x1 - x0)));
    out.push(+(y0 + u * (y1 - y0)).toFixed(4)); } return out; };
const fig1 = F.map(p => ({ name: p.name === "Segmentation_14" ? "Seg_14" : p.name === "grid20x20.f10" ? "grid20×20.f10" : p.name,
  family: p.family, dstar: p.dstar, zero: resample(p.zero), neural: resample(p.neural), star: +p.star[1].toFixed(4) }));
for (const p of fig1) if (Math.abs(p.neural[0] - p.star) > 0.01 * Math.abs(p.zero[0] - p.dstar)) throw new Error("star should sit on the neural curve at iteration 0: " + p.name);

const validity = T.validity_table29.map(r => ({ source: r.source, n: r.n, min: r.min_margin, rel: r.min_rel, med: r.median_margin, ds: r.max_dscore }));

const out = { iters: T.map_table31.iters, map: mapRows, cmpeIters: T.cmpe_k2.iters, cmpe: cm, cmpe1: cm1, fig1, validity };
fs.writeFileSync(new URL("./page-data.json", import.meta.url), JSON.stringify(out));
console.log("page-data.json", (JSON.stringify(out).length / 1024).toFixed(1) + " KB", "| MAP rows", mapRows.map(r => r.name).join(", "));
console.log("CMPE K=2 rows", cm.map(r => r.name).join(", "));
console.log("fig1", fig1.map(p => `${p.name}: zero ${p.zero[0]}→${p.zero[200]}, neural ${p.neural[0]}→${p.neural[200]}, D* ${p.dstar}`).join(" | "));
