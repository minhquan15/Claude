import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH || 'playwright');
const url = process.argv[2] || 'http://localhost:8123/index.html';
const w = +process.argv[3] || 1440, h = +process.argv[4] || 900;
const out = process.argv[5] || '/tmp/claude-0/s/out/smoke.png';
const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'],
});
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 120000 }).catch((e) => logs.push('timeout ready'));
await page.waitForTimeout(1500);
console.log(JSON.stringify(await page.evaluate(() => window.cell3d && window.cell3d.info())));
await page.screenshot({ path: out });
console.log(logs.join('\n'));
await browser.close();
