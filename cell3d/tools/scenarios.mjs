// Chụp 6 trạng thái x 3 khung hình, đồng thời kiểm tra console. Dùng: node tools/scenarios.mjs
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || 'screenshots';
fs.mkdirSync(OUT, { recursive: true });
const FRAMES = [['portrait', 390, 844], ['landscape', 844, 390], ['desktop', 1440, 900]];
const only = process.argv[3];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const issues = [];
for (const [name, w, h] of FRAMES) {
  if (only && only !== name) continue;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 900, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (['warning', 'error'].includes(m.type())) issues.push(`${name}: [${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => issues.push(`${name}: [pageerror] ${e.message}`));
  await page.goto('http://localhost:8123/index.html');
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  const shot = async (label) => {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${name}_${label}.png` });
  };
  await shot('1_default');
  // 2. cắt lớp 50%
  await page.evaluate(() => { window.cell3d.clipping.setPercent(50); window.cell3d.panel.setTab('tools'); });
  await shot('2_slice50');
  await page.evaluate(() => { window.cell3d.clipping.setPercent(0); });
  // 3. chọn ti thể
  await page.evaluate(() => window.cell3d.actions.selectFromUI('mitochondria'));
  await shot('3_mito');
  await page.evaluate(() => { window.cell3d.selection.clear(); window.cell3d.rig.reset(0); window.cell3d.actions.toggleLabels(); });
  await shot('4_labels');
  await page.evaluate(() => { window.cell3d.actions.toggleLabels(); window.cell3d.actions.toggleTour(); window.cell3d.tour.next(); window.cell3d.tour.next(); window.cell3d.tour.next(); window.cell3d.tour.next(); window.cell3d.tour.next(); window.cell3d.tour.next(); });
  await shot('5_tour');
  await page.evaluate(() => { window.cell3d.tour.stop(); window.cell3d.selection.clear(); window.cell3d.actions.togglePathway(); window.cell3d.pathway.setTime(0); window.cell3d.pathway.state.paused = true; window.cell3d.pathway.jump(3); });
  await shot('6_pathway');
  await ctx.close();
}
console.log(issues.length ? issues.join('\n') : 'Console: không có cảnh báo/lỗi nào');
await browser.close();
