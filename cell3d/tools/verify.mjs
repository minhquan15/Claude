// Kiểm tra nghiệm thu tự động: chọn bằng chạm/danh sách, quan hệ vị trí, số lượng, mạng, không WebGL.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = 'http://localhost:8123/index.html';
const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args: ARGS });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const issues = [], hosts = new Set();
page.on('console', (m) => { if (['warning', 'error'].includes(m.type())) issues.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => issues.push(`[pageerror] ${e.message}`));
page.on('request', (r) => hosts.add(new URL(r.url()).host));
await page.goto(base + '?debug');
await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 120000 });
await page.waitForTimeout(1500);

const out = {};
// ---- 1. chọn bằng danh sách ----
out.list = await page.evaluate(async () => {
  const res = {};
  const btns = [...document.querySelectorAll('.org-btn')];
  await window.cell3d.panel.setTab('list');
  for (const b of btns) {
    b.click();
    await new Promise((r) => setTimeout(r, 120));
    const title = document.querySelector('.card h2')?.textContent;
    res[b.dataset.id] = title && title === b.querySelector('.org-name').textContent && window.cell3d.selection.current === b.dataset.id;
    window.cell3d.panel.setTab('list');
  }
  return res;
});
// ---- 2. chọn bằng chạm thật (chuột/pointer): quét lưới quanh điểm tiêu cự, rồi bấm bằng chuột thật ----
const ids = await page.evaluate(() => Object.keys(window.cell3d.world.focus));
out.tap = {};
for (const id of ids) {
  const found = await page.evaluate((id) => {
    const c = window.cell3d;
    if (id === 'cytoplasm') c.rig.reset(0); else { c.selection.select(id); c.selection.clear(); }
    c.rig.update(0.016);
    c.rig.camera.updateMatrixWorld(true);
    const r = document.getElementById('gl').getBoundingClientRect();
    const v = c.world.focus[id].clone().project(c.rig.camera);
    const cx = r.left + (v.x * 0.5 + 0.5) * r.width, cy = r.top + (-v.y * 0.5 + 0.5) * r.height;
    const R = id === 'cytoplasm' ? 330 : 90, step = id === 'cytoplasm' ? 22 : 9;
    const sx = id === 'cytoplasm' ? r.left + r.width / 2 : cx, sy = id === 'cytoplasm' ? r.top + r.height / 2 : cy;
    let best = null;
    for (let dy = -R; dy <= R && !best; dy += step) for (let dx = -R; dx <= R; dx += step) {
      const x = sx + dx, y = sy + dy;
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const h = c.picking.pick(x, y);
      if (h && h.id === id) { best = { x, y, d: Math.hypot(dx, dy) }; break; }
    }
    return best;
  }, id);
  if (!found) { out.tap[id] = 'KHÔNG TÌM THẤY ĐIỂM CHẠM'; continue; }
  await page.waitForTimeout(100);
  await page.mouse.click(found.x, found.y);
  await page.waitForTimeout(100);
  out.tap[id] = (await page.evaluate(() => window.cell3d.selection.current)) === id ? 'OK' : 'SAI';
}
// ---- 3. quan hệ vị trí & số lượng ----
out.geo = await page.evaluate(() => {
  const c = window.cell3d, T = c.THREE, w = c.world;
  const L = {};
  const find = (name) => { let r = null; w.root.traverse((o) => { if (o.name === name) r = o; }); return r; };
  const N = new T.Vector3(); w.root.traverse((o) => { if (o.name === 'nucleus' && o.isGroup) o.getWorldPosition(N); });
  const rer = find('rer'), ser = find('ser');
  const posOf = (mesh) => { const a = mesh.geometry.attributes.position; const out = []; for (let i = 0; i < a.count; i++) out.push(new T.Vector3().fromBufferAttribute(a, i).applyMatrix4(mesh.matrixWorld)); return out; };
  rer.updateMatrixWorld(true); ser.updateMatrixWorld(true);
  const rp = posOf(rer), sp = posOf(ser);
  // (a) màng ngoài nhân nối liền lưới nội chất hạt
  const onShell = rp.filter((p) => Math.abs(p.distanceTo(N) - 3.404) < 0.01).length;
  const first = rp.filter((p) => p.distanceTo(N) < 3.75).length;
  L.rerAttachedVerts = onShell; L.rerVertsNearNucleus = first; L.rerVerts = rp.length;
  L.rerRadiusRange = [Math.min(...rp.map((p) => p.distanceTo(N))).toFixed(2), Math.max(...rp.map((p) => p.distanceTo(N))).toFixed(2)];
  // (b) SER xa nhân hơn RER, nối tiếp RER
  const cen = (arr) => arr.reduce((a, p) => a.add(p), new T.Vector3()).multiplyScalar(1 / arr.length);
  L.rerMeanDist = (rp.reduce((a, p) => a + p.distanceTo(N), 0) / rp.length).toFixed(2);
  L.serMeanDist = (sp.reduce((a, p) => a + p.distanceTo(N), 0) / sp.length).toFixed(2);
  // khoảng cách nhỏ nhất giữa SER và RER (nối tiếp)
  let minD = 1e9; for (let i = 0; i < sp.length; i += 3) for (let j = 0; j < rp.length; j += 4) minD = Math.min(minD, sp[i].distanceTo(rp[j]));
  L.serToRerMinDist = minD.toFixed(3);
  // SER có ống phân nhánh: số ống ~ số điểm
  L.serTris = ser.geometry.index ? ser.geometry.index.count / 3 : 0;
  // (c) Golgi
  const g = find('golgi'); g.updateMatrixWorld(true);
  const up = new T.Vector3(0, 1, 0).applyQuaternion(g.quaternion);
  const gc = g.position.clone();
  const spacing = 0.44, nd = 6;
  const cis = gc.clone().addScaledVector(up, -(nd - 1) / 2 * spacing), trans = gc.clone().addScaledVector(up, (nd - 1) / 2 * spacing);
  L.golgiDiscs = nd;
  L.golgiToNucleusSurface = (gc.distanceTo(N) - 3.4).toFixed(2);
  L.cisToNucleus = cis.distanceTo(N).toFixed(2); L.transToNucleus = trans.distanceTo(N).toFixed(2);
  // khoảng cách tới màng theo hướng ellipsoid (xấp xỉ bằng ellipsoid value)
  const ev = (p) => Math.sqrt((p.x / 10) ** 2 + (p.y / 8.6) ** 2 + (p.z / 9.4) ** 2);
  L.cisEllip = ev(cis).toFixed(3); L.transEllip = ev(trans).toFixed(3); // trans gần màng hơn => giá trị lớn hơn
  // (d) trung thể sát nhân; vi ống tỏa từ trung thể
  const cs = find('centrosome'); const cp = cs.position.clone();
  L.centrosomeToNucleusSurface = (cp.distanceTo(N) - 3.4).toFixed(2);
  L.centrosomeToGolgi = cp.distanceTo(gc).toFixed(2);
  const mt = find('microtubules'); const a = mt.geometry.attributes; const starts = []; const ends = [];
  for (let i = 0; i < a.position.count; i++) { const s = a.aS.getX(i); const p = new T.Vector3().fromBufferAttribute(a.position, i); if (s === 0) starts.push(p); else if (s === 1) ends.push(p); }
  L.mtStartMeanToCentrosome = (starts.reduce((x, p) => x + p.distanceTo(cp), 0) / starts.length).toFixed(2);
  L.mtEndMeanEllip = (ends.reduce((x, p) => x + ev(p), 0) / ends.length).toFixed(3);
  const ac = find('actin-cortex'); const aa = ac.geometry.attributes.position; let sm = 0; for (let i = 0; i < aa.count; i++) sm += ev(new T.Vector3().fromBufferAttribute(aa, i)); L.actinCortexMeanEllip = (sm / aa.count).toFixed(3);
  // (e) ti thể rải rác, không chồng bào quan khác
  const mitoGroup = find('mitochondria'); const ps = [];
  const m4 = new T.Matrix4();
  const solid = find('mito-solid'), cut = find('mito-cut-outer');
  [solid, cut].forEach((im) => { for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); ps.push(new T.Vector3().setFromMatrixPosition(m4)); } });
  L.mitoCount = ps.length; L.mitoSliced = cut.count;
  let mn = 1e9; for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) mn = Math.min(mn, ps[i].distanceTo(ps[j]));
  L.mitoMinPairDist = mn.toFixed(2);
  L.mitoMinToNucleusCenter = Math.min(...ps.map((p) => p.distanceTo(N))).toFixed(2);
  L.mitoMinToGolgi = Math.min(...ps.map((p) => p.distanceTo(gc))).toFixed(2);
  L.mitoMaxEllip = Math.max(...ps.map(ev)).toFixed(2);
  // số lượng khác
  const cnt = (n) => { const o = find(n); return o ? (o.isInstancedMesh ? o.count : 1) : 0; };
  L.lysosome = cnt('lysosome-body'); L.peroxisome = cnt('peroxisome-body'); L.pores = cnt('pores');
  L.ribosomeBound = cnt('ribosomes-bound'); L.ribosomeFree = cnt('ribosomes-free'); L.ribosomeTotal = L.ribosomeBound + L.ribosomeFree;
  L.vesicles = cnt('vesicles');
  // lysosome/peroxisome không chồng nhân + RER
  const inst = (n) => { const im = find(n); const r = []; for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); r.push(new T.Vector3().setFromMatrixPosition(m4)); } return r; };
  L.lysoMinToNucleusCenter = Math.min(...inst('lysosome-body').map((p) => p.distanceTo(N))).toFixed(2);
  L.peroxMinToNucleusCenter = Math.min(...inst('peroxisome-body').map((p) => p.distanceTo(N))).toFixed(2);
  return L;
});
// ---- 4. số liệu kết xuất ----
out.render = await page.evaluate(() => { const c = window.cell3d; return { ...c.info(), drawCallsNote: 'mặc định, góc nhìn đầy đủ' }; });
// ---- 5. mạng ----
out.network = [...hosts];
out.timing = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { domContentLoadedMs: Math.round(n.domContentLoadedEventEnd), loadMs: Math.round(n.loadEventEnd), transferKB: Math.round(performance.getEntriesByType('resource').reduce((a, r) => a + (r.encodedBodySize || 0), 0) / 1024) }; });
out.issues = issues;
console.log(JSON.stringify(out, null, 1));
await ctx.close();

// ---- 6. không có WebGL ----
const b2 = await chromium.launch({ args: ['--disable-gpu', '--disable-3d-apis', '--disable-webgl', '--disable-software-rasterizer'] });
const p2 = await b2.newPage({ viewport: { width: 390, height: 844 } });
await p2.goto(base);
await p2.waitForTimeout(2500);
console.log('NO-WEBGL:', JSON.stringify(await p2.evaluate(() => ({ text: document.querySelector('#loader')?.innerText, cls: document.querySelector('#loader')?.className }))));
await p2.screenshot({ path: process.argv[2] || '/tmp/claude-0/s/out/nowebgl.png' });
await b2.close();
await browser.close();
