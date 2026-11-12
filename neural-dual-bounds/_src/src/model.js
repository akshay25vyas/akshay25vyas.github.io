/* The worked example of Appendix A.2 (Table 5): four binary variables x0..x3 in three clusters
   C1(x0,x1), C2(x1,x2), C3(x2,x3), chained by the separators {x1} and {x2}.
   m = [m01(x1=0), m01(x1=1), m12(x2=0), m12(x2=1)].
   C1 gives up m01, C2 gains m01 and gives up m12, C3 gains m12, so every complete
   assignment keeps its total score and the sum of cluster maxima stays an upper bound. */
var NDBModel = (function () {
  "use strict";
  var T = [[[2, 5], [1, 7]], [[8, 1], [4, 6]], [[3, 0], [2, 4]]];
  var VARS = [["x₀", "x₁"], ["x₁", "x₂"], ["x₂", "x₃"]];
  function tables(m) {
    var a = [m[0], m[1]], b = [m[2], m[3]], out = [[[0, 0], [0, 0]], [[0, 0], [0, 0]], [[0, 0], [0, 0]]], i, j;
    for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
      out[0][i][j] = T[0][i][j] - a[j];
      out[1][i][j] = T[1][i][j] + a[i] - b[j];
      out[2][i][j] = T[2][i][j] + b[i];
    }
    return out;
  }
  function max2(t) { return Math.max(t[0][0], t[0][1], t[1][0], t[1][1]); }
  function evaluate(m) {
    var t = tables(m), mx = [max2(t[0]), max2(t[1]), max2(t[2])];
    return { t: t, max: mx, D: mx[0] + mx[1] + mx[2] };
  }
  function score(t, x) { return t[0][x[0]][x[1]] + t[1][x[1]][x[2]] + t[2][x[2]][x[3]]; }
  /* Brute-force the optimum and count assignments whose score a message vector leaves unchanged. */
  var MAP = (function () {
    var best = -Infinity, arg = null, k;
    for (k = 0; k < 16; k++) { var x = [k >> 3 & 1, k >> 2 & 1, k >> 1 & 1, k & 1], s = score(T, x); if (s > best) { best = s; arg = x; } }
    return { value: best, x: arg };
  })();
  function unchanged(t) {
    var n = 0, k;
    for (k = 0; k < 16; k++) { var x = [k >> 3 & 1, k >> 2 & 1, k >> 1 & 1, k & 1]; if (Math.abs(score(t, x) - score(T, x)) < 1e-9) n++; }
    return n;
  }
  /* Small seeded generator so the figure in the HTML and the one the script takes over are identical. */
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = s + 0x6D2B79F5 >>> 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  var RANGE = 6, SEED = 30709, FIRST = 300, LO = 11, HI = 44;
  function draw(rand) { var m = [0, 0, 0, 0], i; for (i = 0; i < 4; i++) m[i] = Math.floor(rand() * (2 * RANGE + 1)) - RANGE; return m; }
  function fresh() { var counts = [], i; for (i = LO; i <= HI; i++) counts.push(0); return { counts: counts, n: 0, below: 0, exact: 0, cur: null, live: false }; }
  function record(st, D) {
    st.n++; if (D < MAP.value - 1e-9) st.below++; if (Math.abs(D - MAP.value) < 1e-9) st.exact++;
    st.counts[Math.max(LO, Math.min(HI, Math.round(D))) - LO]++;
  }
  function initial() {
    var st = fresh(), rand = rng(SEED), i;
    for (i = 0; i < FIRST; i++) record(st, evaluate(draw(rand)).D);
    st.cur = evaluate([0, 0, 0, 0]).D;
    return { st: st, rand: rand };
  }
  return { T: T, VARS: VARS, MAP: MAP, PAPER_M: [-3, -2, -2, -3], RANGE: RANGE, tables: tables, evaluate: evaluate, score: score, unchanged: unchanged, rng: rng, draw: draw, fresh: fresh, record: record, initial: initial };
})();
if (typeof module !== "undefined" && module.exports) module.exports = NDBModel;
