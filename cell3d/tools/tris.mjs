import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('console', (m) => m.type() !== 'info' && console.log(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(process.argv[2] || 'http://localhost:8123/index.html');
await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 120000 });
const rows = await page.evaluate(() => {
  const out = [];
  window.cell3d.world.root.traverse((o) => {
    if (!(o.isMesh || o.isInstancedMesh)) return;
    const g = o.geometry;
    const per = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    const n = o.isInstancedMesh ? o.count : 1;
    out.push([o.name || o.parent.name, Math.round(per * n), n, o.visible]);
  });
  return out;
});
let tot = 0;
for (const r of rows) { console.log(r.join('\t')); if (r[3]) tot += r[1]; }
console.log('TOTAL', tot, 'meshes', rows.length);
await browser.close();
