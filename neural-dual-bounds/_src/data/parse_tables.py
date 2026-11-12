"""Parse the result tables of the camera-ready PDF text (pdftotext -layout) into JSON.
Every number on the project page comes from this file's output, so the page can be
re-checked against the paper mechanically."""
import re, json, sys
src = sys.argv[1]; out = sys.argv[2]
L = open(src, encoding="utf-8").read().split("\n")

def find(prefix, start=0):
    for i in range(start, len(L)):
        if L[i].lstrip().startswith(prefix):
            return i
    raise SystemExit("not found: " + prefix)

NUM = r"[-+−]?\d+(?:\.\d+)?(?:e[-+]\d+)?"
def num(s):
    return float(s.replace("−", "-"))
PM = re.compile(r"(" + NUM + r")\s*±\s*(" + NUM + r")")

def clean_name(s):
    s = s.strip().replace("†", "").replace("‡", "").strip()
    return s

def pm_rows(start, end, ncols):
    rows = []
    for i in range(start, end):
        line = L[i]
        pairs = PM.findall(line)
        if len(pairs) == ncols:
            name = clean_name(line[:PM.search(line).start()])
            rows.append((name, [(num(a), num(b)) for a, b in pairs]))
    return rows

data = {}

# ---- Table 22: MAP, 100 seeds, 5 checkpoints, J/N ----
i = find("Table 22:")
rows = pm_rows(i, i + 30, 10)
assert len(rows) == 16, len(rows)
iters = [0, 10, 50, 100, 500]
data["map_table22"] = {"iters": iters, "rows": [
    {"pgm": n, "J": [{"mean": v[2*k][0], "std": v[2*k][1]} for k in range(5)],
               "N": [{"mean": v[2*k+1][0], "std": v[2*k+1][1]} for k in range(5)]} for n, v in rows]}

# ---- Table 1 (main body) for cross-check: iters 10, 50, 100 ----
i = find("Table 1:")
rows1 = pm_rows(i, i + 32, 6)
assert len(rows1) == 16, len(rows1)
data["map_table1"] = {"iters": [10, 50, 100], "rows": [
    {"pgm": n, "J": [v[0], v[2], v[4]], "N": [v[1], v[3], v[5]]} for n, v in rows1]}

# ---- Table 31: paired per-seed delta with CI ----
i = find("Table 31:")
CI = re.compile(r"(" + NUM + r")(†?)\s*\[(" + NUM + r"),\s*(" + NUM + r")\]")
rows = []
for k in range(i, i + 40):
    cells = CI.findall(L[k])
    if len(cells) == 5:
        name = clean_name(L[k][:CI.search(L[k]).start()])
        rows.append({"pgm": name, "cells": [{"median": num(a), "sig": bool(d), "lo": num(b), "hi": num(c)} for a, d, b, c in cells]})
assert len(rows) == 16, len(rows)
data["map_table31"] = {"iters": iters, "rows": rows}

# ---- Table 32: win rates with Clopper-Pearson CI ----
i = find("Table 32:")
WR = re.compile(r"(\d+)%\s*\[(\d+),\s*(\d+)\]")
rows = []
for k in range(i, i + 30):
    cells = WR.findall(L[k])
    if len(cells) == 5:
        head = L[k][:WR.search(L[k]).start()].split()
        rows.append({"pgm": head[0], "n": int(head[1]), "cells": [{"win": int(a), "lo": int(b), "hi": int(c)} for a, b, c in cells]})
assert len(rows) == 16, len(rows)
data["map_table32"] = {"iters": iters, "rows": rows}

# ---- Tables 2 and 3: CMPE K=2 ----
i2 = find("Table 2:"); i3 = find("Table 3:")
r2 = pm_rows(i2, i3, 6); r3 = pm_rows(i3, i3 + 30, 6)
assert len(r2) == 15 and len(r3) == 15, (len(r2), len(r3))
assert [a for a, _ in r2] == [a for a, _ in r3]
cm = []
for (n, a), (_, b) in zip(r2, r3):
    cm.append({"pgm": n,
               "JGLP":    [{"mean": a[0][0], "std": a[0][1]}, {"mean": a[2][0], "std": a[2][1]}, {"mean": a[4][0], "std": a[4][1]}],
               "NN":      [{"mean": a[1][0], "std": a[1][1]}, {"mean": a[3][0], "std": a[3][1]}, {"mean": a[5][0], "std": a[5][1]}],
               "JGLP+WS": [{"mean": b[0][0], "std": b[0][1]}, {"mean": b[2][0], "std": b[2][1]}, {"mean": b[4][0], "std": b[4][1]}],
               "NN+TTA":  [{"mean": b[1][0], "std": b[1][1]}, {"mean": b[3][0], "std": b[3][1]}, {"mean": b[5][0], "std": b[5][1]}]})
data["cmpe_k2"] = {"iters": [10, 50, 100], "rows": cm}

# ---- Table 24: CMPE K=1, M1/M2/M3 at 10/50/100/500 ----
i = find("Table 24:")
r = pm_rows(i, i + 30, 12)
assert len(r) == 16, len(r)
data["cmpe_k1"] = {"iters": [10, 50, 100, 500], "rows": [
    {"pgm": n, "M1": [{"mean": v[3*k][0], "std": v[3*k][1]} for k in range(4)],
               "M2": [{"mean": v[3*k+1][0], "std": v[3*k+1][1]} for k in range(4)],
               "M3": [{"mean": v[3*k+2][0], "std": v[3*k+2][1]} for k in range(4)]} for n, v in r]}

# ---- Table 33: paired CMPE, M4 (lambda-continuity) vs M3 (NN+TTA) ----
i = find("Table 33:")
rows = []
for k in range(i, i + 60):
    cells = CI.findall(L[k])
    if len(cells) == 3:
        head = L[k][:CI.search(L[k]).start()].split()
        rows.append({"pgm": head[0], "K": int(head[1]), "cells": [{"median": num(a), "sig": bool(d), "lo": num(b), "hi": num(c)} for a, d, b, c in cells]})
assert len(rows) == 32, len(rows)
data["cmpe_table33"] = {"iters": [10, 50, 100], "rows": rows}

# ---- Table 29: validity check ----
i = find("Table 29:")
rows = []
VAL = re.compile(r"^\s*(.+?)\s{2,}(\d+)\s+(" + NUM + r")\s+(" + NUM + r")\s+(" + NUM + r")\s+(" + NUM + r")\s*$")
for k in range(i, i + 30):
    m = VAL.match(L[k])
    if m:
        rows.append({"source": m.group(1).strip(), "n": int(m.group(2)), "min_margin": num(m.group(3)), "min_rel": num(m.group(4)), "median_margin": num(m.group(5)), "max_dscore": num(m.group(6))})
assert len(rows) == 7, (len(rows), rows)
data["validity_table29"] = rows

# ---- Table 18: benchmark suite ----
i = find("Table 18:")
rows = []
SU = re.compile(r"^\s*(\S+?)(†?)\s+(BN|Segmentation|ProteinFolding|Grid|Promedas)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d.]+)\s*$")
for k in range(i, i + 60):
    m = SU.match(L[k])
    if m:
        rows.append({"pgm": m.group(1), "new": bool(m.group(2)), "category": m.group(3), "n": int(m.group(4).replace(",", "")), "edim": int(m.group(5).replace(",", "")), "ldim": int(m.group(6).replace(",", "")), "mbe_jglp_gap": float(m.group(7))})
assert len(rows) == 40, len(rows)
data["suite_table18"] = rows

# ---- Table 34: gated initialization ----
i = find("Table 34:")
rows = []
GA = re.compile(r"^\s*(\S+)\s+(\d+)%\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$")
for k in range(i, i + 40):
    m = GA.match(L[k])
    if m:
        rows.append({"pgm": m.group(1), "gate": int(m.group(2)), "J": float(m.group(3)), "N": float(m.group(4)), "gated": float(m.group(5)), "worse10": int(m.group(6)), "worse100": int(m.group(7)), "worse500": int(m.group(8))})
assert len(rows) == 16, len(rows)
data["gated_table34"] = rows

# ---- Table 16: standalone bound quality / forward time ----
i = find("Table 16:")
rows = []
ST = re.compile(r"^\s*(\S+)\s+([\d,]+)\s+([\d,]+)\s+(\d+)%\s+([\d.]+)ms\s*$")
for k in range(i, i + 30):
    m = ST.match(L[k])
    if m:
        rows.append({"pgm": m.group(1), "vars": int(m.group(2).replace(",", "")), "edim": int(m.group(3).replace(",", "")), "better": int(m.group(4)), "fwd_ms": float(m.group(5))})
assert len(rows) == 13, len(rows)
data["standalone_table16"] = rows

json.dump(data, open(out, "w"), indent=1, ensure_ascii=False)
print("ok", {k: (len(v["rows"]) if isinstance(v, dict) else len(v)) for k, v in data.items()})
