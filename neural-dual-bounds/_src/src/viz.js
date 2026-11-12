/* Chart renderers for the Neural Dual Bounds page.
   Each function takes data and a pixel width and returns an SVG string, so the same code
   draws the figures at build time (they are in the HTML before any script runs) and again
   in the browser at the reader's actual width. Colours come from CSS classes, never from here. */
var NDBViz = (function () {
  "use strict";
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var r1 = function (v) { return Math.round(v * 10) / 10; };
  var MINUS = "−", TIMES = "×";
  var sup = function (n) { return String(n).replace(/-/g, "⁻").replace(/\d/g, function (d) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]; }); };
  var thousands = function (n) { var p = String(n).split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); return p.join("."); };
  function sig2(v) { if (v === 0) return "0"; var p = Math.pow(10, 1 - Math.floor(Math.log10(Math.abs(v)))); return thousands(Math.round(v * p) / p); }
  /* A dual gap, as the paper prints it: plain decimals down to 0.001, powers of ten below. */
  function gap(v) {
    if (v === 0) return "0";
    var a = Math.abs(v), s = v < 0 ? MINUS : "";
    if (a >= 100) return s + thousands(Math.round(a));
    if (a >= 10) return s + a.toFixed(1);
    if (a >= 1) return s + a.toFixed(2);
    if (a >= 0.001) return s + a.toFixed(3);
    var e = Math.floor(Math.log10(a)), m = a / Math.pow(10, e);
    return s + m.toFixed(1) + TIMES + "10" + sup(e);
  }
  /* A paired effect in log10 units, as a plain-language factor. */
  function factor(d) {
    var f = Math.pow(10, Math.abs(d)), dir = d > 0 ? " tighter" : " looser";
    if (f < 1.005) return "no difference";
    if (f < 1.095) return Math.round((f - 1) * 100) + "%" + dir;
    return (f < 10 ? f.toFixed(1) : f < 100 ? String(Math.round(f)) : sig2(f)) + TIMES + dir;
  }
  function signed(v, dp) { return (v < 0 ? MINUS : "+") + Math.abs(v).toFixed(dp); }
  var FAM = { bn: "Bayesian networks", seg: "Image segmentation", grid: "Grid Markov random fields" };

  /* ---------- Header instrument: histogram of bound values on the worked example ---------- */
  var H_LO = 11, H_HI = 44, H_OPT = 17;
  function hist(st, W) {
    W = Math.max(280, Math.round(W || 440));
    var H = 244, L = 30, R = 10, T = 30, B = 44, pw = W - L - R, ph = H - T - B;
    var nb = H_HI - H_LO + 1, bw = pw / nb, barW = Math.max(3, Math.min(24, bw - 3));
    var x = function (v) { return L + (v - H_LO + 0.5) * bw; };
    var maxC = 0, i; for (i = 0; i < st.counts.length; i++) if (st.counts[i] > maxC) maxC = st.counts[i];
    var top = maxC <= 8 ? 8 : maxC <= 20 ? 20 : maxC <= 40 ? 40 : Math.ceil(maxC / 50) * 50;
    var y = function (c) { return T + ph - (c / top) * ph; };
    var wallX = L + (H_OPT - H_LO) * bw, o = [];
    o.push('<svg class="viz proof-plot' + (st.live ? " live" : "") + '" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Histogram of ' + st.n + " bounds on the worked example. " + st.below + ' fall below the optimum of 17.">');
    o.push('<rect class="zone" x="' + L + '" y="' + T + '" width="' + r1(wallX - L) + '" height="' + ph + '"/>');
    [0.5, 1].forEach(function (f) { o.push('<line class="gridline" x1="' + r1(wallX) + '" x2="' + (W - R) + '" y1="' + r1(y(top * f)) + '" y2="' + r1(y(top * f)) + '"/>'); o.push('<text class="tick" x="' + (W - R) + '" y="' + r1(y(top * f) - 5) + '" text-anchor="end">' + Math.round(top * f) + "</text>"); });
    for (i = 0; i < nb; i++) {
      var c = st.counts[i]; if (!c) continue;
      var h = Math.max(2, (c / top) * ph), bx = x(H_LO + i) - barW / 2, by = T + ph - h, rr = Math.min(4, barW / 2, h);
      o.push('<path class="bar-ours" style="--i:' + i + '" d="M' + r1(bx) + " " + r1(T + ph) + "V" + r1(by + rr) + "Q" + r1(bx) + " " + r1(by) + " " + r1(bx + rr) + " " + r1(by) + "H" + r1(bx + barW - rr) + "Q" + r1(bx + barW) + " " + r1(by) + " " + r1(bx + barW) + " " + r1(by + rr) + "V" + r1(T + ph) + 'Z"/>');
    }
    o.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '"/>');
    o.push('<line class="wall" x1="' + r1(wallX) + '" x2="' + r1(wallX) + '" y1="' + (T - 14) + '" y2="' + (T + ph + 5) + '"/>');
    o.push('<text class="strong" x="' + r1(wallX + 7) + '" y="' + (T - 6) + '">true optimum, 17</text>');
    if (wallX - L >= 62) o.push('<text class="lab" x="' + r1((L + wallX) / 2) + '" y="' + r1(T + ph / 2 - 4) + '" text-anchor="middle"><tspan x="' + r1((L + wallX) / 2) + '">no output</tspan><tspan x="' + r1((L + wallX) / 2) + '" dy="15">lands here</tspan></text>');
    [17, 20, 25, 30, 35, 40].forEach(function (v) { o.push('<text class="tick" x="' + r1(x(v)) + '" y="' + (T + ph + 18) + '" text-anchor="middle">' + v + "</text>"); });
    o.push('<text class="tick" x="' + r1(x(H_HI)) + '" y="' + (T + ph + 18) + '" text-anchor="middle">' + H_HI + "+</text>");
    o.push('<text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">value of the bound</text>');
    if (st.cur != null) {
      var cx = x(Math.max(H_LO, Math.min(H_HI, Math.round(st.cur))));
      o.push('<path class="cur" d="M' + r1(cx) + " " + (T + ph + 24) + "l5 8h-10z" + '"/>');
      o.push('<text class="strong" x="' + r1(Math.min(W - R - 92, cx + 9)) + '" y="' + (H - 6) + '">current m: ' + st.cur + "</text>");
    }
    o.push("</svg>");
    return o.join("");
  }

  /* ---------- Figure 1: bound against JGLP iterations, one panel per model ---------- */
  function niceTicks(lo, hi, n) {
    var span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), e = raw / mag;
    var step = (e > 5 ? 10 : e > 2 ? 5 : e > 1 ? 2 : 1) * mag, out = [], v = Math.ceil(lo / step) * step;
    for (; v <= hi + 1e-9; v += step) out.push(Math.round(v / step) * step);
    return { ticks: out, step: step };
  }
  function conv(p, W) {
    W = Math.max(260, Math.round(W || 340));
    var H = 232, L = 54, R = 14, T = 12, B = 34, pw = W - L - R, ph = H - T - B, n = p.zero.length - 1;
    var lo = Math.min(p.zero[n], p.neural[n]), hi = p.zero[0], pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
    var x = function (t) { return L + (t / n) * pw; }, y = function (v) { return T + (hi - v) / (hi - lo) * ph; };
    var tk = niceTicks(lo, hi, 5), dp = tk.step >= 1 ? 0 : tk.step >= 0.1 ? 1 : 2, o = [];
    var path = function (a) { var s = "", t; for (t = 0; t <= n; t++) s += (t ? "L" : "M") + r1(x(t)) + " " + r1(y(a[t])); return s; };
    o.push('<svg class="viz" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(p.name) + ": bound over 200 JGLP iterations. Zero initialization starts at " + p.zero[0].toFixed(2) + ", the warm start at " + p.neural[0].toFixed(2) + '.">');
    tk.ticks.forEach(function (v) { o.push('<line class="gridline" x1="' + L + '" x2="' + (W - R) + '" y1="' + r1(y(v)) + '" y2="' + r1(y(v)) + '"/><text class="tick" x="' + (L - 8) + '" y="' + r1(y(v) + 4) + '" text-anchor="end">' + (v < 0 ? MINUS : "") + thousands(Math.abs(v).toFixed(dp)) + "</text>"); });
    o.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '"/>');
    [0, 50, 100, 150, 200].forEach(function (t) { o.push('<text class="tick" x="' + r1(x(t)) + '" y="' + (T + ph + 18) + '" text-anchor="' + (t === 0 ? "start" : t === 200 ? "end" : "middle") + '">' + t + "</text>"); });
    o.push('<path class="line ctx" d="' + path(p.zero) + '"/><path class="line ours" d="' + path(p.neural) + '"/>');
    o.push('<circle class="dot-ours" cx="' + r1(x(0)) + '" cy="' + r1(y(p.neural[0])) + '" r="5"/>');
    var k = 0; while (k < n && p.zero[k] > p.neural[0]) k++;
    var ly = y(p.neural[0]), lx = x(Math.min(k + 9, 110));
    o.push('<line class="cross" x1="' + r1(x(0) + 8) + '" x2="' + r1(lx - 5) + '" y1="' + r1(ly) + '" y2="' + r1(ly) + '"/>');
    o.push('<text class="lab" x="' + r1(lx) + '" y="' + r1(ly + 4) + '">forward pass alone</text>');
    o.push('<g class="hover" visibility="hidden"><line class="cross" y1="' + T + '" y2="' + (T + ph) + '"/><circle class="dot-ctx-fill" r="4.5"/><circle class="dot-ours" r="4.5"/></g>');
    o.push('<rect class="hit" x="' + L + '" y="' + T + '" width="' + pw + '" height="' + ph + '" data-l="' + L + '" data-pw="' + pw + '" data-t="' + T + '" data-ph="' + ph + '" data-lo="' + lo + '" data-hi="' + hi + '"/>');
    o.push("</svg>");
    return o.join("");
  }

  /* ---------- Row charts share one layout: a label column beside the marks when there is room,
     the label on its own line above the marks when there is not. ---------- */
  function grouped(rows) { var out = [], last = null; rows.forEach(function (r) { if (r.dup) return; if (r.fam !== last) { out.push({ head: FAM[r.fam] }); last = r.fam; } out.push(r); }); return out; }
  function rowLayout(list, W, narrow, T, B, side) {
    var y = T, items = list.map(function (r) { var h = r.head ? (narrow ? 30 : 27) : (narrow ? 44 : 27), it = { r: r, top: y, h: h }; y += h; return it; });
    return { items: items, H: y + B, L: narrow ? 8 : 128, R: narrow ? 8 : side, labelX: narrow ? 8 : 10, halo: narrow ? " halo" : "",
      text: function (it) { return narrow ? it.top + 17 : it.top + it.h / 2 + 4; }, mark: function (it) { return narrow ? it.top + 31 : it.top + it.h / 2; } };
  }
  function rowOpen(o, it, W) { o.push('<g class="row" data-k="' + esc(it.r.k) + '"><rect class="rowband" x="0" y="' + r1(it.top + 1) + '" width="' + W + '" height="' + (it.h - 2) + '" rx="6"/>'); }
  function rowClose(o, it, W) { o.push('<rect class="hit" x="0" y="' + it.top + '" width="' + W + '" height="' + it.h + '"/></g>'); }

  /* ---------- Paired comparison for MAP: median log10 gap ratio with interval, per model ---------- */
  var FOREST = [
    { dom: [-0.62, 0.62], ticks: [[-0.4771, "3" + TIMES], [-0.301, "2" + TIMES], [0, "equal"], [0.301, "2" + TIMES], [0.4771, "3" + TIMES]], few: [[-0.301, "2" + TIMES], [0, "equal"], [0.301, "2" + TIMES]] },
    { dom: [-0.36, 1.2], ticks: [[-0.301, "2" + TIMES], [0, "equal"], [0.301, "2" + TIMES], [0.699, "5" + TIMES], [1, "10" + TIMES]], few: [[0, "equal"], [0.301, "2" + TIMES], [0.699, "5" + TIMES], [1, "10" + TIMES]] },
    { dom: [-4.6, 3.1], ticks: [[-4, "10,000" + TIMES], [-3, "1,000" + TIMES], [-2, "100" + TIMES], [-1, "10" + TIMES], [0, "equal"], [1, "10" + TIMES], [2, "100" + TIMES], [3, "1,000" + TIMES]], few: [[-4, "10⁴" + TIMES], [-2, "100" + TIMES], [0, "equal"], [2, "100" + TIMES]] }
  ];
  function forest(rows, ci, W) {
    W = Math.max(280, Math.round(W || 900));
    var narrow = W < 620, cfg = FOREST[ci], WW = narrow ? 0 : 76, lay = rowLayout(grouped(rows), W, narrow, 34, 34, 118 + 76 + 8);
    var L = lay.L, pw = W - L - lay.R, H = lay.H, o = [];
    var x = function (v) { return L + (v - cfg.dom[0]) / (cfg.dom[1] - cfg.dom[0]) * pw; }, x0 = x(0);
    o.push('<svg class="viz" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Paired comparison of zero-initialized and warm-started JGLP per model. The table view below lists every value.">');
    o.push('<text x="' + r1(x0 - 10) + '" y="14" text-anchor="end">' + (x0 - L < 118 ? "zero init" : "zero init tighter") + '</text><text class="strong" x="' + r1(x0 + 10) + '" y="14">warm start tighter</text>');
    if (!narrow) { o.push('<text x="' + (W - WW - 8) + '" y="14" text-anchor="end">median effect</text>'); o.push('<text x="' + W + '" y="14" text-anchor="end">won or tied</text>'); }
    (narrow ? cfg.few : cfg.ticks).forEach(function (t) { var tx = x(t[0]); o.push('<line class="' + (t[0] === 0 ? "zero" : "gridline") + '" x1="' + r1(tx) + '" x2="' + r1(tx) + '" y1="22" y2="' + (H - 30) + '"/><text class="tick" x="' + r1(tx) + '" y="' + (H - 12) + '" text-anchor="middle">' + t[1] + "</text>"); });
    lay.items.forEach(function (it) {
      var r = it.r, ty = lay.text(it), cy = lay.mark(it);
      if (r.head) { o.push('<text class="strong" x="0" y="' + r1(it.top + it.h - 8) + '">' + esc(r.head) + "</text>"); return; }
      var d = r.d[ci], w = r.w[ci], med = d[0], lo = Math.max(cfg.dom[0], d[1]), hi = Math.min(cfg.dom[1], d[2]), sigf = d[3] === 1;
      var cls = !sigf ? "dot-ctx" : med > 0 ? "dot-ours" : "dot-ctx-fill", stroke = sigf && med > 0 ? "ours" : "ctx";
      rowOpen(o, it, W);
      o.push('<text class="lab' + lay.halo + '" x="' + lay.labelX + '" y="' + r1(ty) + '">' + esc(r.name) + "</text>");
      o.push('<line class="whisk ' + stroke + '" x1="' + r1(x(lo)) + '" x2="' + r1(x(hi)) + '" y1="' + r1(cy) + '" y2="' + r1(cy) + '"/>');
      if (d[1] < cfg.dom[0]) o.push('<path class="whisk ' + stroke + '" fill="none" d="M' + r1(x(lo) + 6) + " " + r1(cy - 4) + "L" + r1(x(lo)) + " " + r1(cy) + "L" + r1(x(lo) + 6) + " " + r1(cy + 4) + '"/>');
      o.push('<circle class="' + cls + '" cx="' + r1(x(Math.max(cfg.dom[0], Math.min(cfg.dom[1], med)))) + '" cy="' + r1(cy) + '" r="5"/>');
      o.push('<text class="' + (sigf && med > 0 ? "strong" : "lab") + ' tick' + lay.halo + '" x="' + (W - WW - 8) + '" y="' + r1(ty) + '" text-anchor="end">' + factor(med) + "</text>");
      if (WW) o.push('<text class="lab tick" x="' + W + '" y="' + r1(ty) + '" text-anchor="end">' + w[0] + "%</text>");
      rowClose(o, it, W);
    });
    o.push("</svg>");
    return o.join("");
  }

  /* ---------- Constrained MAP: mean gap per model for three starts, log scale ---------- */
  function cmpe(rows, bi, W) {
    W = Math.max(280, Math.round(W || 900));
    var narrow = W < 620, lay = rowLayout(grouped(rows), W, narrow, 24, 34, 132 + 8), lo = Infinity, hi = -Infinity;
    rows.forEach(function (r) { if (r.dup) return; [r.jglp, r.ws, r.tta].forEach(function (a) { var v = Math.log10(a[bi][0]); if (v < lo) lo = v; if (v > hi) hi = v; }); });
    lo = Math.floor(lo - 0.15); hi = hi + 0.22;
    var L = lay.L, pw = W - L - lay.R, H = lay.H, o = [], e, per = pw / (hi - lo), step = per < 22 ? 3 : per < 44 ? 2 : 1;
    var x = function (v) { return L + (Math.log10(v) - lo) / (hi - lo) * pw; };
    o.push('<svg class="viz" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Mean dual gap per model for three ways of starting each inner solve. The table view below lists every value.">');
    o.push('<text x="' + W + '" y="14" text-anchor="end">adapted network vs reuse</text>');
    for (e = lo; e <= Math.floor(hi); e += 1) {
      var tx = L + (e - lo) / (hi - lo) * pw, lab = e >= -3 && e <= 3 ? (e >= 0 ? thousands(Math.pow(10, e)) : String(Math.pow(10, e).toFixed(-e))) : "10" + sup(e);
      o.push('<line class="gridline" x1="' + r1(tx) + '" x2="' + r1(tx) + '" y1="22" y2="' + (H - 30) + '"/>');
      if ((e - lo) % step === 0) o.push('<text class="tick" x="' + r1(tx) + '" y="' + (H - 12) + '" text-anchor="middle">' + lab + "</text>");
    }
    lay.items.forEach(function (it) {
      var r = it.r, ty = lay.text(it), cy = lay.mark(it);
      if (r.head) { o.push('<text class="strong" x="0" y="' + r1(it.top + it.h - 8) + '">' + esc(r.head) + "</text>"); return; }
      var a = r.jglp[bi][0], b = r.ws[bi][0], c = r.tta[bi][0], d = Math.log10(b / c);
      rowOpen(o, it, W);
      o.push('<text class="lab' + lay.halo + '" x="' + lay.labelX + '" y="' + r1(ty) + '">' + esc(r.name) + "</text>");
      o.push('<line class="axis" x1="' + r1(x(b)) + '" x2="' + r1(x(c)) + '" y1="' + r1(cy) + '" y2="' + r1(cy) + '" style="stroke-width:2"/>');
      o.push('<circle class="dot-ctx-fill" cx="' + r1(x(a)) + '" cy="' + r1(cy) + '" r="3.5"/>');
      o.push('<circle class="dot-ctx" cx="' + r1(x(b)) + '" cy="' + r1(cy) + '" r="5"/>');
      o.push('<circle class="dot-ours" cx="' + r1(x(c)) + '" cy="' + r1(cy) + '" r="5.5"/>');
      o.push('<text class="' + (d > 0.3 ? "strong" : "lab") + ' tick' + lay.halo + '" x="' + W + '" y="' + r1(ty) + '" text-anchor="end">' + factor(d) + "</text>");
      rowClose(o, it, W);
    });
    o.push("</svg>");
    return o.join("");
  }

  return { hist: hist, conv: conv, forest: forest, cmpe: cmpe, gap: gap, factor: factor, signed: signed, FAM: FAM, H_LO: H_LO, H_HI: H_HI, esc: esc, thousands: thousands, MINUS: MINUS, TIMES: TIMES };
})();
if (typeof module !== "undefined" && module.exports) module.exports = NDBViz;
