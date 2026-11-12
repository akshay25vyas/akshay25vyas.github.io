// Finds Playwright and a Chrome to drive. Set CHROME_PATH to use a specific browser binary.
import fs from "node:fs";
import { createRequire } from "node:module";

export async function launch(extraArgs = []) {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch { ({ chromium } = createRequire("/opt/npm-tools/node_modules/")("playwright")); }
  const exe = process.env.CHROME_PATH || ["/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
  return chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--disable-gpu", ...extraArgs] });
}
