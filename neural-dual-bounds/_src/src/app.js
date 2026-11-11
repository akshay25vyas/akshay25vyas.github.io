/* Page behaviour. Everything here enhances markup that is already complete in the HTML:
   the figures are drawn at build time, and this script redraws them at the reader's width,
   adds hover readouts, and runs the worked example. */
(function () {
  "use strict";
  var V = NDBViz, M = NDBModel;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var DATA = JSON.parse($("#ndb-data").textContent);
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var txt = function (el, s) { if (el) el.textContent = s; };
  var el = function (tag, cls, s) { var n = document.createElement(tag); if (cls) n.className = cls; if (s != null) n.textContent = s; return n; };

  /* ---- Tooltip, one per plot ---- */
  function tipFor(plot) {
    var t = plot._tip;
    if (!t) { t = plot._tip = el("div", "tip"); t.setAttribute("role", "status"); t.hidden = true; plot.appendChild(t); }
    return t;
  }
  function tipRow(tip, key, label, value) {
    var r = el("div", "tr"), a = el("span"), k = el("i");
    if (key) { k.style.color = key; a.appendChild(k); }
    a.appendChild(document.createTextNode(label)); r.appendChild(a); r.appendChild(el("strong", "", value)); tip.appendChild(r);
  }
  function placeTip(plot, tip, clientX, clientY) {
    var b = plot.getBoundingClientRect(); tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight, x = clientX - b.left + 14, y = clientY - b.top - h - 12;
    if (x + w > b.width) x = clientX - b.left - w - 14;
    if (x < 0) x = 0;
    if (y < -8) y = clientY - b.top + 18;
    tip.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
  }
  var css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };

  /* ---- The worked example: one message vector, shown in the header histogram and in the tables ---- */
  var st = M.initial().st, m = [0, 0, 0, 0];
  var rand = function () { return Math.random(); };
  var histBox = $("#proof-plot");
  function drawHist() { if (histBox) histBox.innerHTML = V.hist(st, histBox.clientWidth || 440); }
  function readouts() { txt($("#pf-n"), V.thousands(st.n)); txt($("#pf-bad"), String(st.below)); txt($("#pf-exact"), V.thousands(st.exact)); }
  /* Which table entries each message touches: one column of the scatter matrix A. */
  var TOUCH = [[[0, "j", 0, -1], [1, "i", 0, 1]], [[0, "j", 1, -1], [1, "i", 1, 1]], [[1, "j", 0, -1], [2, "i", 0, 1]], [[1, "j", 1, -1], [2, "i", 1, 1]]];
  var fmt = function (v) { return (v < 0 ? V.MINUS : "") + Math.abs(v); };
  function renderLab() {
    var r = M.evaluate(m), c, i, j;
    for (c = 0; c < 3; c++) for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
      var cell = $('[data-c="' + c + '"][data-i="' + i + '"][data-j="' + j + '"]'); if (!cell) continue;
      txt($(".v", cell), fmt(r.t[c][i][j]));
      cell.classList.toggle("max", r.t[c][i][j] === r.max[c]);
    }
    for (c = 0; c < 3; c++) txt($("#cl-max-" + c), fmt(r.max[c]));
    $$("input[data-m]").forEach(function (inp) { var k = +inp.dataset.m; if (+inp.value !== m[k]) inp.value = m[k]; txt($('output[data-mo="' + k + '"]'), fmt(m[k])); inp.setAttribute("aria-valuetext", String(m[k])); });
    var x = M.MAP.x, o = [r.t[0][x[0]][x[1]], r.t[1][x[1]][x[2]], r.t[2][x[2]][x[3]]], gapv = r.D - M.MAP.value;
    txt($("#v-sum"), fmt(r.max[0]) + " + " + fmt(r.max[1]) + " + " + fmt(r.max[2]) + " = " + fmt(r.D));
    txt($("#v-state"), gapv === 0 ? "exact" : "gap of " + gapv);
    txt($("#v-opt"), o.map(function (v) { return v < 0 ? "(" + fmt(v) + ")" : fmt(v); }).join(" + ") + " = " + fmt(o[0] + o[1] + o[2]));
    txt($("#v-inv"), M.unchanged(r.t) + " of 16");
    st.cur = r.D;
    return r;
  }
  function setM(next, countIt) {
    m = next.slice(); var r = renderLab();
    if (countIt) M.record(st, r.D);
    st.live = true; drawHist(); readouts();
  }
  $$("input[data-m]").forEach(function (inp) {
    var k = +inp.dataset.m;
    inp.addEventListener("input", function () { var next = m.slice(); next[k] = +inp.value; setM(next, false); });
    var active = false;
    var mark = function (on) {
      active = on;
      TOUCH[k].forEach(function (t) {
        $$('[data-c="' + t[0] + '"]').forEach(function (cell) {
          if (+cell.dataset[t[1]] !== t[2]) return;
          cell.classList.toggle("touch", on);
          var d = t[3] * m[k]; txt($(".d", cell), on ? (d < 0 ? V.MINUS : "+") + Math.abs(d) : "");
        });
      });
    };
    inp.addEventListener("input", function () { if (active) mark(true); });
    inp.addEventListener("focus", function () { mark(true); }); inp.addEventListener("blur", function () { mark(false); });
    inp.addEventListener("pointerenter", function () { mark(true); }); inp.addEventListener("pointerleave", function () { if (document.activeElement !== inp) mark(false); });
  });
  var on = function (sel, fn) { var b = $(sel); if (b) b.addEventListener("click", fn); };
  on("#pf-one", function () { setM(M.draw(rand), true); });
  on("#lab-scramble", function () { setM(M.draw(rand), true); });
  on("#lab-zero", function () { setM([0, 0, 0, 0], false); });
  on("#lab-paper", function () { setM(M.PAPER_M, true); });
  on("#pf-many", function () {
    var btn = this, left = 500, last = m;
    var step = function () {
      var k = calm ? left : Math.min(left, 25), i;
      for (i = 0; i < k; i++) { last = M.draw(rand); M.record(st, M.evaluate(last).D); }
      left -= k; st.live = true; drawHist(); readouts();
      if (left > 0) requestAnimationFrame(step); else { btn.disabled = false; setM(last, false); }
    };
    btn.disabled = true; step();
  });
  renderLab();

  /* ---- Figure 1: crosshair and readout ---- */
  function convHover(plot, p) {
    var svg = $("svg", plot), hit = $(".hit", svg), g = $(".hover", svg); if (!hit) return;
    var L = +hit.dataset.l, pw = +hit.dataset.pw, T = +hit.dataset.t, ph = +hit.dataset.ph, lo = +hit.dataset.lo, hi = +hit.dataset.hi;
    var y = function (v) { return T + (hi - v) / (hi - lo) * ph; }, dp = Math.abs(p.zero[0]) > 1000 ? 1 : 2;
    var f = function (v) { return (v < 0 ? V.MINUS : "") + V.thousands(Math.abs(v).toFixed(dp)); };
    var show = function (t, cx, cy) {
      t = Math.max(0, Math.min(200, t));
      var X = L + t / 200 * pw, line = $("line", g), dots = $$("circle", g);
      line.setAttribute("x1", X); line.setAttribute("x2", X);
      dots[0].setAttribute("cx", X); dots[0].setAttribute("cy", y(p.zero[t]));
      dots[1].setAttribute("cx", X); dots[1].setAttribute("cy", y(p.neural[t]));
      g.setAttribute("visibility", "visible");
      var tip = tipFor(plot); tip.textContent = "";
      tip.appendChild(el("b", "", "Iteration " + t));
      tipRow(tip, css("--s-ctx"), "zero init", f(p.zero[t]));
      tipRow(tip, css("--s-ours"), "warm start", f(p.neural[t]));
      var k = -1, i; for (i = 0; i <= 200; i++) if (p.zero[i] <= p.neural[t] + 1e-9) { k = i; break; }
      tip.appendChild(el("div", "tn", k < 0 ? "Zero init does not reach this level within 200 iterations." : k <= t ? "Zero init is at or below this level here." : "Zero init reaches this level at iteration " + k + "."));
      placeTip(plot, tip, cx, cy);
    };
    var move = function (e) { var b = hit.getBoundingClientRect(); show(Math.round((e.clientX - b.left) / b.width * 200), e.clientX, e.clientY); };
    var hide = function () { g.setAttribute("visibility", "hidden"); if (plot._tip) plot._tip.hidden = true; };
    hit.addEventListener("pointermove", move); hit.addEventListener("pointerdown", move); hit.addEventListener("pointerleave", hide);
    svg.setAttribute("tabindex", "0"); svg._t = svg._t == null ? 10 : svg._t;
    svg.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
      e.preventDefault(); svg._t = Math.max(0, Math.min(200, svg._t + d * (e.shiftKey ? 10 : 1)));
      var b = hit.getBoundingClientRect(); show(svg._t, b.left + svg._t / 200 * b.width, b.top + 30);
    });
    svg.addEventListener("blur", hide);
  }

  /* ---- Row charts: readout per model ---- */
  function rowHover(plot, fill) {
    $$(".row", plot).forEach(function (row) {
      var hit = $(".hit", row);
      var show = function (e) { $$(".row.on", plot).forEach(function (r) { r.classList.remove("on"); }); row.classList.add("on"); var tip = tipFor(plot); tip.textContent = ""; fill(tip, row.dataset.k); placeTip(plot, tip, e.clientX, e.clientY); };
      hit.addEventListener("pointermove", show); hit.addEventListener("pointerdown", show);
      hit.addEventListener("pointerleave", function () { row.classList.remove("on"); if (plot._tip) plot._tip.hidden = true; });
    });
  }
  var byKey = function (rows, k) { for (var i = 0; i < rows.length; i++) if (rows[i].k === k) return rows[i]; };
  var sel = { forest: 1, cmpe: 0 };
  function forestTip(tip, k) {
    var r = byKey(DATA.map, k), ci = sel.forest, d = r.d[ci], w = r.w[ci];
    tip.appendChild(el("b", "", r.name + ", iteration " + DATA.iters[ci]));
    tipRow(tip, null, "median effect", V.factor(d[0]));
    tipRow(tip, null, "median log₁₀ ratio", V.signed(d[0], 3));
    tipRow(tip, null, "95% interval", V.signed(d[1], 3) + " to " + V.signed(d[2], 3));
    tipRow(tip, null, "seeds won or tied", w[0] + "% of " + r.n);
    tipRow(tip, css("--s-ctx"), "mean gap, zero init", V.gap(r.J[ci][0]));
    tipRow(tip, css("--s-ours"), "mean gap, warm start", V.gap(r.N[ci][0]));
    tip.appendChild(el("div", "tn", d[3] ? "Significant at 0.05 after Holm correction." : "Not significant after Holm correction."));
  }
  function cmpeTip(tip, k) {
    var r = byKey(DATA.cmpe, k), bi = sel.cmpe, p = r.p[bi], pm = function (a) { return V.gap(a[bi][0]) + " ± " + V.gap(a[bi][1]); };
    tip.appendChild(el("b", "", r.name + ", " + DATA.cmpeIters[bi] + " inner iterations"));
    tipRow(tip, css("--s-ours"), "NN+TTA", pm(r.tta));
    tipRow(tip, css("--s-ctx"), "JGLP+WS", pm(r.ws));
    tipRow(tip, css("--s-ctx"), "frozen NN", pm(r.nn));
    tipRow(tip, css("--s-ctx"), "zero init", pm(r.jglp));
    tip.appendChild(el("div", "tn", "Paired per seed, NN+TTA is " + V.factor(p[0]) + " than JGLP+WS at the median" + (p[3] ? ", significant after Holm correction." : ", not significant.")));
  }

  /* ---- Draw and redraw ---- */
  var charts = [];
  $$(".plot[data-chart]").forEach(function (plot) {
    var kind = plot.dataset.chart, width = 0;
    var render = function (force) {
      var w = plot.clientWidth; if (!w || (!force && Math.abs(w - width) < 4)) return; width = w;
      var keep = plot._tip; if (keep) keep.remove();
      if (kind === "conv") { var p = DATA.fig1[+plot.dataset.i]; plot.innerHTML = V.conv(p, w); convHover(plot, p); }
      else if (kind === "forest") { plot.innerHTML = V.forest(DATA.map, sel.forest, w); rowHover(plot, forestTip); }
      else if (kind === "cmpe") { plot.innerHTML = V.cmpe(DATA.cmpe, sel.cmpe, w); rowHover(plot, cmpeTip); }
      if (keep) { keep.hidden = true; plot.appendChild(keep); }
    };
    charts.push({ kind: kind, render: render }); render(true);
  });
  $$("[data-seg]").forEach(function (group) {
    var kind = group.dataset.seg;
    $$("button", group).forEach(function (b) {
      b.addEventListener("click", function () {
        sel[kind] = +b.dataset.v;
        $$("button", group).forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        txt($("#" + kind + "-title"), b.dataset.title); txt($("#" + kind + "-note"), b.dataset.note);
        charts.forEach(function (c) { if (c.kind === kind) c.render(true); });
      });
    });
  });
  var redraw = function () { drawHist(); charts.forEach(function (c) { c.render(false); }); };
  if (window.ResizeObserver) { var ro = new ResizeObserver(function () { requestAnimationFrame(redraw); }); ro.observe(document.documentElement); }
  else window.addEventListener("resize", redraw);
  if (histBox && Math.abs((histBox.clientWidth || 440) - 440) > 4) { st.live = true; drawHist(); }

  /* ---- Copy the citation ---- */
  $$("[data-copy-from]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = $("#" + btn.dataset.copyFrom).textContent, label = btn.dataset.label || (btn.dataset.label = btn.textContent);
      var done = function (ok) { btn.textContent = ok ? "Copied" : "Press Ctrl+C to copy"; clearTimeout(btn._t); btn._t = setTimeout(function () { btn.textContent = label; }, 1800); };
      var legacy = function () {
        var ta = document.createElement("textarea"), ok = false; ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
        document.body.appendChild(ta); try { ta.select(); ok = document.execCommand("copy"); } catch (e) { ok = false; } ta.remove();
        if (!ok) { try { var r = document.createRange(); r.selectNodeContents($("#" + btn.dataset.copyFrom)); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e2) { /* selection unavailable */ } }
        done(ok);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, legacy); else legacy();
    });
  });

  /* ---- Mark the section in view in the top bar ---- */
  var links = $$(".bar-nav a"), targets = links.map(function (a) { return $(a.getAttribute("href")); });
  if (window.IntersectionObserver && targets.every(Boolean)) {
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      var cur = null; targets.forEach(function (t) { if (seen[t.id] && !cur) cur = t.id; });
      links.forEach(function (a) { if (cur && a.getAttribute("href") === "#" + cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    }, { rootMargin: "-20% 0px -65% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }
})();
