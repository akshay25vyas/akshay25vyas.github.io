// Interaction test for the built page. Serve the site root first, for example
//   python3 -m http.server 8765 --bind 127.0.0.1     (from the repository root)
//   node test/interact.mjs [url]
import { launch } from "./browser.mjs";
const URL = process.argv[2] || "http://127.0.0.1:8765/neural-dual-bounds/";
const browser = await launch();
const results = []; const ok = (name, cond, extra) => { results.push((cond ? "PASS " : "FAIL ") + name + (extra ? "  [" + extra + "]" : "")); };
async function run(label, viewport, colorScheme) {
  const ctx = await browser.newContext({ viewport, colorScheme, reducedMotion: "reduce", permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage(); const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL, { waitUntil: "networkidle" }); await page.evaluate(() => document.fonts.ready);
  const T = (sel) => page.locator(sel).first().innerText();
  // hero instrument
  ok(label + " initial readouts", (await T("#pf-n")) === "300" && (await T("#pf-bad")) === "0");
  await page.click("#pf-one"); ok(label + " draw one", (await T("#pf-n")) === "301");
  await page.click("#pf-many"); await page.waitForFunction(() => !document.querySelector("#pf-many").disabled);
  ok(label + " draw 500", (await T("#pf-n")) === "801" && (await T("#pf-bad")) === "0", "exact=" + (await T("#pf-exact")));
  await page.locator(".proof").screenshot({ path: `shots/${label}-proof-after.png` });
  // worked example
  await page.click("#lab-paper");
  ok(label + " paper messages give 17", (await T("#v-sum")).replace(/\s/g, "") === "9+7+1=17" && (await T("#v-state")) === "exact", await T("#v-sum"));
  ok(label + " optimum cells sum to 17", (await T("#v-opt")).endsWith("= 17"), await T("#v-opt"));
  ok(label + " invariance 16 of 16", (await T("#v-inv")) === "16 of 16");
  await page.locator("figure[aria-labelledby=lab-title]").screenshot({ path: `shots/${label}-lab-paper.png` });
  // slider: set m0 to 7 via keyboard
  await page.focus("#m0"); for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
  const sum = await T("#v-sum"); const D = +sum.split("=")[1].trim().replace("−", "-");
  ok(label + " slider keeps bound >= 17", D >= 17 && (await T("#v-inv")) === "16 of 16" && (await T("#v-opt")).endsWith("= 17"), sum + " | " + (await T("#v-opt")));
  await page.locator("figure[aria-labelledby=lab-title]").screenshot({ path: `shots/${label}-lab-slider.png` });
  for (let k = 0; k < 40; k++) { await page.click("#lab-scramble"); const s = await T("#v-sum"); const d = +s.split("=")[1].trim().replace("−", "-"); if (d < 17 || (await T("#v-inv")) !== "16 of 16") { ok(label + " scramble " + k, false, s); break; } if (k === 39) ok(label + " 40 scrambles stay valid", true); }
  await page.click("#lab-zero"); ok(label + " remove messages gives 19", (await T("#v-sum")).replace(/\s/g, "") === "7+8+4=19" && (await T("#v-state")) === "gap of 2");
  // segmented controls
  await page.click('[data-seg="forest"] button[data-v="2"]');
  ok(label + " forest title switches", (await T("#forest-title")).startsWith("By iteration 50"), await T("#forest-title"));
  await page.locator("figure[aria-labelledby=forest-title]").screenshot({ path: `shots/${label}-forest-50.png` });
  await page.click('[data-seg="forest"] button[data-v="0"]');
  ok(label + " forest forward-pass view", (await T("#forest-title")).startsWith("The forward pass alone"));
  await page.locator("figure[aria-labelledby=forest-title]").screenshot({ path: `shots/${label}-forest-0.png` });
  await page.click('[data-seg="forest"] button[data-v="1"]');
  await page.click('[data-seg="cmpe"] button[data-v="2"]');
  ok(label + " cmpe note switches", (await T("#cmpe-note")).startsWith("At 100 inner iterations"));
  await page.locator("figure[aria-labelledby=cmpe-title]").screenshot({ path: `shots/${label}-cmpe-100.png` });
  await page.click('[data-seg="cmpe"] button[data-v="0"]');
  // tooltips
  const hover = async (sel, name, fx = 0.3, fy = 0.5) => {
    const loc = page.locator(sel).first(); await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox();
    await page.mouse.move(b.x + b.width * fx, b.y + b.height * fy); await page.waitForTimeout(120);
    const tip = await page.evaluate((s) => { const el = document.querySelector(s).closest(".plot").querySelector(".tip"); return el && !el.hidden ? el.innerText : null; }, sel);
    ok(label + " tooltip " + name, !!tip, tip ? tip.replace(/\n+/g, " | ").slice(0, 170) : "none"); return loc;
  };
  await hover('.plot[data-chart="conv"][data-i="0"] .hit', "convergence", 0.05);
  await page.locator("figure[aria-labelledby=conv-title]").screenshot({ path: `shots/${label}-conv-tip.png` });
  await hover('.plot[data-chart="forest"] .row[data-k="seg_14"] .hit', "forest");
  await page.locator("figure[aria-labelledby=forest-title]").screenshot({ path: `shots/${label}-forest-tip.png` });
  await hover('.plot[data-chart="cmpe"] .row[data-k="seg_14"] .hit', "cmpe");
  await page.locator("figure[aria-labelledby=cmpe-title]").screenshot({ path: `shots/${label}-cmpe-tip.png` });
  await page.mouse.move(2, 2);
  // table views
  const nDetails = await page.locator("details.tableview").count();
  for (let i = 0; i < nDetails; i++) await page.locator("details.tableview summary").nth(i).click();
  ok(label + " table views open", (await page.locator("details.tableview[open] table").count()) >= 5, "tables=" + (await page.locator("details.tableview[open] table").count()));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  ok(label + " no horizontal overflow with tables open", !overflow);
  await page.locator("figure[aria-labelledby=forest-title] details").screenshot({ path: `shots/${label}-forest-table.png` });
  // copy
  await page.locator("[data-copy-from]").scrollIntoViewIfNeeded(); await page.click("[data-copy-from]");
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
  ok(label + " copy BibTeX", clip.startsWith("@inproceedings{vyas2026neural") && (await T("[data-copy-from]")) === "Copied");
  // links
  const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));
  const anchors = links.filter((h) => h.startsWith("#")); const missing = [];
  for (const a of new Set(anchors)) if (!(await page.locator(a).count())) missing.push(a);
  ok(label + " in-page anchors resolve", missing.length === 0, missing.join(","));
  // video: the hero button and the resources row carry the same outside address and open in a new tab
  const vid = await page.evaluate(() => [".actions a", ".res a"].map((s) => { const a = [...document.querySelectorAll(s)].find((a) => /video/i.test(a.textContent)); return a ? [a.href, a.target, a.rel, a.getBoundingClientRect().width > 0] : null; }));
  ok(label + " video links", vid.every(Boolean) && vid[0][0] === vid[1][0] && vid.every((v) => /^https:\/\/\S+$/.test(v[0]) && v[1] === "_blank" && v[2] === "noopener" && v[3]), vid[0] ? vid[0][0] : "none");
  ok(label + " no console errors", errs.length === 0, errs.join(" || ").slice(0, 300));
  await ctx.close();
  return links;
}
const links = await run("desk", { width: 1440, height: 900 }, "light");
await run("phone", { width: 390, height: 844 }, "light");
await run("dark", { width: 1280, height: 800 }, "dark");
console.log(results.join("\n"));
console.log("LINKS", JSON.stringify([...new Set(links)].filter((h) => !h.startsWith("#"))));
await browser.close();
