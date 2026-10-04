// dùng: node tools/shot.mjs W H prefix "js1" "js2" ...  (mỗi js chạy trong trang, rồi chụp)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [w, h, prefix, ...steps] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: +w < 700 });
const page = await ctx.newPage();
if (process.env.REDUCED) await page.emulateMedia({ reducedMotion: 'reduce' });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(`http://localhost:8123/index.html${process.env.Q || ''}`);
await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 120000 });
await page.waitForTimeout(800);
let i = 0;
for (const s of steps.length ? steps : ['0']) {
  const r = await page.evaluate(s);
  if (r !== undefined && r !== null) console.log(JSON.stringify(r));
  await page.waitForTimeout(+process.env.WAIT || 1800);
  await page.screenshot({ path: `${prefix}_${i++}.png` });
}
console.log(JSON.stringify(await page.evaluate(() => window.cell3d.info())));
console.log(logs.filter((l) => !l.startsWith('[info]')).join('\n') || '(no console issues)');
await browser.close();
