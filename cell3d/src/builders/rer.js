import * as THREE from 'three';
import { ORG } from '../data/organelles.js';
import { NUC, D_GOLGI } from '../layout.js';
import { createMaterial } from './materials.js';
import { smoothstep } from '../util.js';

// Lưới nội chất hạt = các "chồng" tấm dẹt gấp nếp bao quanh nhân.
// Mỗi chồng (gò) gồm 4 tấm xếp song song; lớp ngoài hẹp hơn lớp trong. Mỗi tấm nối với tấm bên dưới
// ở một phía (như trang sách gấp), phía còn lại là rìa tự do nên nhìn thấy khe giữa các tấm.
// Tấm trong cùng nối liền với màng ngoài của nhân (rìa tấm trùng khít với vỏ nhân).
const SHEETS = [
  { base: 3.68, alpha: 0.62, amp: 0.1 },
  { base: 4.3, alpha: 0.55, amp: 0.12 },
  { base: 4.92, alpha: 0.48, amp: 0.14 },
  { base: 5.54, alpha: 0.4, amp: 0.16 },
];
const PATCH_CENTERS = [
  [-0.67, -0.62, 0.24], // hướng lưới nội chất trơn
  [-0.85, 0.45, 0.25],
  [-0.3, 0.85, -0.4],
  [-0.2, -0.9, -0.3],
  [-0.6, 0.1, -0.8],
  [0.3, -0.55, 0.75],
  [0.2, 0.55, -0.8],
  [-0.95, -0.1, -0.2],
].map((a) => new THREE.Vector3(...a).normalize());
// mỗi gò có hệ trục riêng: u = trục nếp, v = vuông góc
const PATCH_FRAMES = PATCH_CENTERS.map((c, i) => {
  const u = new THREE.Vector3(Math.sin(i * 2.3 + 0.4), Math.cos(i * 1.7 + 1.1), Math.sin(i * 3.1));
  u.addScaledVector(c, -u.dot(c)).normalize();
  const v = c.clone().cross(u).normalize();
  return { u, v };
});

export function buildRER(rng, ctx) {
  const { noise } = ctx;
  const NU = 140, NV = 84; // lưới kinh-vĩ
  const nV = (NU + 1) * (NV + 1);
  const dirs = new Float32Array(nV * 3);
  const vid = (i, j) => j * (NU + 1) + i;
  for (let j = 0; j <= NV; j++) {
    const th = (j / NV) * Math.PI;
    for (let i = 0; i <= NU; i++) {
      const ph = (i / NU) * Math.PI * 2;
      const k = vid(i, j) * 3;
      dirs[k] = Math.sin(th) * Math.cos(ph);
      dirs[k + 1] = Math.cos(th);
      dirs[k + 2] = Math.sin(th) * Math.sin(ph);
    }
  }
  const d = new THREE.Vector3();
  const positions = [], colors = [], indices = [];
  let vOffset = 0;
  const prevR = new Float32Array(nV).fill(NUC.rOuter + 0.004);
  const prevCol = new Float32Array(nV * 3);
  const shellCol = new THREE.Color(ORG.nucleus.color).lerp(new THREE.Color(ORG.rer.color), 0.65);
  const rerCol = new THREE.Color(ORG.rer.color);
  const tmpC = new THREE.Color();
  for (let i = 0; i < nV; i++) { prevCol[i * 3] = shellCol.r; prevCol[i * 3 + 1] = shellCol.g; prevCol[i * 3 + 2] = shellCol.b; }
  const anchors = [];

  SHEETS.forEach((sh, si) => {
    const w = new Float32Array(nV), r = new Float32Array(nV), fold = new Float32Array(nV), keep = new Uint8Array(nV);
    for (let id = 0; id < nV; id++) {
      d.set(dirs[id * 3], dirs[id * 3 + 1], dirs[id * 3 + 2]);
      let ww = 0, best = 0, bestAng = 0;
      const jit = 0.14 * noise(d.x * 3.1 + si * 5, d.y * 3.1, d.z * 3.1);
      for (let pj = 0; pj < PATCH_CENTERS.length; pj++) {
        const ang = Math.acos(Math.min(1, Math.max(-1, d.dot(PATCH_CENTERS[pj])))) + jit;
        const wj = 1 - smoothstep(sh.alpha * 0.76, sh.alpha, ang);
        if (wj > ww) { ww = wj; best = pj; bestAng = ang; }
      }
      // chừa nón về phía Golgi (túi vận chuyển nảy chồi, trung thể, Golgi cần chỗ)
      const gang = Math.acos(Math.min(1, Math.max(-1, d.dot(D_GOLGI))));
      ww *= smoothstep(1.02, 1.3, gang);
      w[id] = ww;
      // phía nối với tấm dưới: góc phương vị quanh tâm gò
      const fr = PATCH_FRAMES[best];
      const psi = Math.atan2(d.dot(fr.v), d.dot(fr.u));
      const conn = smoothstep(-0.2, 0.7, Math.cos(psi - (si * 1.9 + best * 0.7)));
      const eff = 1 - conn * (1 - ww); // 1 = nổi ở độ cao gốc, ww = hạ xuống tấm dưới
      keep[id] = ww > 0.02 + (1 - conn) * 0.4 ? 1 : 0;
      const ph = Math.sin(19 * d.dot(fr.u) + 1.7 * si + 2 * noise(d.x * 2, d.y * 2 + si, d.z * 2));
      fold[id] = ph;
      const target = sh.base + sh.amp * ph * (0.35 + 0.65 * ww);
      r[id] = prevR[id] + (target - prevR[id]) * eff * (ww > 0 ? 1 : 0);
      if (ww <= 0) r[id] = prevR[id];
      w[id] = eff * ww;
    }
    const used = new Int32Array(nV).fill(-1);
    let cnt = 0;
    const remap = (id) => {
      if (used[id] < 0) {
        used[id] = cnt++;
        d.set(dirs[id * 3], dirs[id * 3 + 1], dirs[id * 3 + 2]);
        positions.push(d.x * r[id], d.y * r[id], d.z * r[id]);
        const shade = 0.5 + 0.72 * (0.5 + 0.5 * fold[id]) + 0.07 * si;
        tmpC.copy(rerCol).multiplyScalar(shade);
        // rìa tự do sẫm hơn để nhìn rõ đường viền của từng tấm
        const rim = 0.62 + 0.38 * smoothstep(0.08, 0.5, w[id]);
        tmpC.multiplyScalar(Math.min(1, rim));
        const mix = smoothstep(0.04, 0.35, w[id]);
        colors.push(
          prevCol[id * 3] + (tmpC.r - prevCol[id * 3]) * mix,
          prevCol[id * 3 + 1] + (tmpC.g - prevCol[id * 3 + 1]) * mix,
          prevCol[id * 3 + 2] + (tmpC.b - prevCol[id * 3 + 2]) * mix
        );
        if (si === SHEETS.length - 1 && w[id] > 0.85) anchors.push(new THREE.Vector3(d.x * r[id], d.y * r[id], d.z * r[id]).add(NUC.center));
      }
      return vOffset + used[id];
    };
    for (let j = 0; j < NV; j++)
      for (let i = 0; i < NU; i++) {
        const a = vid(i, j), b = vid(i + 1, j), c = vid(i + 1, j + 1), e = vid(i, j + 1);
        if (!(keep[a] && keep[b] && keep[c] && keep[e])) continue;
        const ia = remap(a), ib = remap(b), ic = remap(c), ie = remap(e);
        indices.push(ia, ib, ic, ia, ic, ie);
      }
    vOffset += cnt;
    // kế tiếp: lớp trên nối vào lớp này (chỉ ở các đỉnh có mặt)
    for (let id = 0; id < nV; id++) {
      if (used[id] < 0) continue;
      prevR[id] = r[id];
      const base = (colors.length / 3 - cnt + used[id]) * 3;
      prevCol[id * 3] = colors[base]; prevCol[id * 3 + 1] = colors[base + 1]; prevCol[id * 3 + 2] = colors[base + 2];
    }
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = createMaterial('rer', { color: '#ffffff', vertexColors: true, double: true, opacity: 0.94, roughness: 0.4, glow: ORG.rer.color });
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = 1;
  mat.polygonOffsetUnits = 1;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(NUC.center);
  mesh.userData.org = 'rer';
  mesh.name = 'rer';

  // ---- Mẫu điểm để đặt ribosome bám lên tấm (xa bề mặt nhân) ----
  const pos = geo.attributes.position;
  const triCount = indices.length / 3;
  const elig = [];
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    va.fromBufferAttribute(pos, indices[t * 3]);
    vb.fromBufferAttribute(pos, indices[t * 3 + 1]);
    vc.fromBufferAttribute(pos, indices[t * 3 + 2]);
    if (va.length() > 3.9 && vb.length() > 3.9 && vc.length() > 3.9) elig.push(t);
  }
  ctx.rer = { mesh, geo, anchors, eligibleTris: elig, triCount };
  ctx.rerTriangleSample = (rngFn, outPos, outNormal) => {
    const t = elig[Math.floor(rngFn() * elig.length)];
    va.fromBufferAttribute(pos, indices[t * 3]);
    vb.fromBufferAttribute(pos, indices[t * 3 + 1]);
    vc.fromBufferAttribute(pos, indices[t * 3 + 2]);
    let u = rngFn(), v = rngFn();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    outPos.copy(va).multiplyScalar(1 - u - v).addScaledVector(vb, u).addScaledVector(vc, v);
    vb.sub(va); vc.sub(va);
    outNormal.copy(vb).cross(vc).normalize();
    if (rngFn() < 0.5) outNormal.negate();
    outPos.add(NUC.center);
    return t;
  };
  ctx.rerFocus = anchors.length ? anchors.reduce((best, p) => (p.z > best.z ? p : best), anchors[0]).clone() : new THREE.Vector3(...ORG.rer.position);
  return mesh;
}
