import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ORG } from '../data/organelles.js';
import { NUC, D_SER, GOLGI, CENTRO, insideCell } from '../layout.js';
import { randomUnit, rand } from '../util.js';
import { createMaterial } from './materials.js';

/**
 * Lưới nội chất trơn: mạng ống phân nhánh (TubeGeometry theo Catmull-Rom),
 * bắt đầu từ các điểm trên tấm lưới nội chất hạt ngoài cùng => nối tiếp với lưới nội chất hạt.
 */
export function buildSER(rng, ctx) {
  const anchors = ctx.rer.anchors.filter((p) => p.clone().sub(NUC.center).normalize().dot(D_SER) > 0.6);
  anchors.sort((a, b) => b.distanceTo(NUC.center) - a.distanceTo(NUC.center));
  const roots = [];
  for (const p of anchors) {
    if (roots.length >= 7) break;
    if (roots.every((q) => q.distanceTo(p) > 1.2)) roots.push(p);
  }
  const geos = [];
  const samples = []; // điểm thuộc SER, để đánh dấu chỗ đã chiếm
  const junctions = [];
  const tmp = new THREE.Vector3();

  const blocked = (p) =>
    !insideCell(p, 0.84) ||
    p.distanceTo(GOLGI.center) < 2.6 ||
    p.distanceTo(CENTRO.center) < 1.3 ||
    p.distanceTo(NUC.center) < 4.2;

  function grow(start, dir, level, radius) {
    const pts = [start.clone()];
    let p = start.clone();
    const d = dir.clone();
    const segLen = level === 0 ? 1.15 : level === 1 ? 0.95 : 0.8;
    const nSeg = level === 0 ? 4 : 3;
    for (let k = 0; k < nSeg; k++) {
      d.add(randomUnit(rng, tmp).multiplyScalar(0.75)).normalize();
      const next = p.clone().addScaledVector(d, segLen * rand(rng, 0.8, 1.2));
      if (blocked(next)) break;
      pts.push(next);
      p = next;
    }
    if (pts.length < 3) return;
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    geos.push(new THREE.TubeGeometry(curve, pts.length * 6, radius, 7, false));
    for (let t = 0; t <= 1.001; t += 0.25) samples.push(curve.getPoint(Math.min(t, 1)));
    junctions.push({ p: pts[pts.length - 1].clone(), r: radius });
    if (level < 2) {
      const nb = level === 0 ? 3 : 2;
      for (let b = 0; b < nb; b++) {
        const t = rand(rng, 0.45, 1);
        const bp = curve.getPoint(t);
        const tg = curve.getTangent(t);
        const nd = tg.clone().add(randomUnit(rng, tmp).multiplyScalar(1.1)).normalize();
        junctions.push({ p: bp.clone(), r: radius * 1.05 });
        grow(bp, nd, level + 1, radius * 0.82);
      }
    }
  }
  roots.forEach((r) => {
    const outward = r.clone().sub(NUC.center).normalize().add(D_SER.clone().multiplyScalar(0.5)).normalize();
    junctions.push({ p: r.clone(), r: 0.2 });
    grow(r, outward, 0, 0.125);
  });
  // chấm phình ở các nhánh cụt (cho giống các túi nhỏ của lưới ống)
  const sph = (j) => {
    const g = new THREE.SphereGeometry(j.r * 1.12, 8, 6);
    g.translate(j.p.x, j.p.y, j.p.z);
    return g;
  };
  junctions.forEach((j) => geos.push(sph(j)));
  const geo = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());

  const mat = createMaterial('ser', { color: ORG.ser.color, roughness: 0.45, opacity: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.org = 'ser';
  mesh.name = 'ser';

  samples.forEach((s) => ctx.occ.add(s, 0.42));
  ctx.serFocus = samples.length
    ? samples.reduce((a, s) => a.add(s), new THREE.Vector3()).multiplyScalar(1 / samples.length)
    : new THREE.Vector3(...ORG.ser.position);
  ctx.serRoots = roots;
  return mesh;
}
