// node test/shot.mjs <url> <out-prefix> [--dark] [--w 1440] [--h 900] [--full] [--clip sel] [--js "code"]
import { launch } from "./browser.mjs";
const args = process.argv.slice(2);
const url = args[0], out = args[1];
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const flag = (k) => args.includes("--" + k);
const browser = await launch(["--force-color-profile=srgb"]);
const ctx = await browser.newContext({ viewport: { width: +opt("w", 1440), height: +opt("h", 900) }, deviceScaleFactor: +opt("dpr", 1), colorScheme: flag("dark") ? "dark" : "light", reducedMotion: flag("motion") ? "no-preference" : "reduce" });
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.type() + ": " + m.text()); });
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
page.on("requestfailed", (r) => logs.push("requestfailed: " + r.url() + " " + (r.failure() || {}).errorText));
page.on("response", (r) => { if (r.status() >= 400) logs.push("http " + r.status() + ": " + r.url()); });
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const js = opt("js", null); if (js) { await page.evaluate(js); await page.waitForTimeout(300); }
const sel = opt("clip", null);
if (sel) { const el = await page.$(sel); await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: out + ".png" }); }
else await page.screenshot({ path: out + ".png", fullPage: flag("full") });
const info = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight, fonts: [...document.fonts].filter(f => f.status === "loaded").map(f => f.family + " " + f.weight + " " + f.style) }));
console.log(JSON.stringify({ out: out + ".png", overflowX: info.w > info.cw, pageHeight: info.h, fontsLoaded: [...new Set(info.fonts)], logs }, null, 1));
await browser.close();
