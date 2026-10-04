import * as THREE from 'three';
import { ORG } from '../data/organelles.js';
import { GOLGI, D_GOLGI, NUC, insideCell } from '../layout.js';
import { createMaterial } from './materials.js';
import { golgiDiscY } from './golgi.js';
import { rand, randomUnit } from '../util.js';

export const LYSO_COUNT = 8;
export const PEROX_COUNT = 8;

function scatter(rng, ctx, count, hintId, radius, bounds = [9, 7.5, 8.2]) {
  const out = [];
  const hint = new THREE.Vector3(...ORG[hintId].position);
  if (ctx.occ.isFree(hint, radius, 0.05)) {
    out.push(hint.clone());
    ctx.occ.add(hint, radius);
  }
  let g = 0;
  while (out.length < count && g++ < 4000) {
    const p = new THREE.Vector3(rand(rng, -bounds[0], bounds[0]), rand(rng, -bounds[1], bounds[1]), rand(rng, -bounds[2], bounds[2]));
    if (!insideCell(p, 0.84) || !ctx.occ.isFree(p, radius, 0.12)) continue;
    out.push(p);
    ctx.occ.add(p, radius);
  }
  return out;
}

export function buildLysosomes(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'lysosomes';
  const positions = scatter(rng, ctx, LYSO_COUNT, 'lysosome', 0.45);
  const geo = new THREE.IcosahedronGeometry(0.34, 2);
  const mat = createMaterial('lysosome', { color: ORG.lysosome.color, roughness: 0.3, inner: '#bff5cf', opacity: 0.62, depthWrite: false });
  const body = new THREE.InstancedMesh(geo, mat, positions.length);
  // hạt enzyme thủy phân bên trong
  const gGeo = new THREE.IcosahedronGeometry(0.055, 0);
  const gMat = createMaterial('lysosome', { color: '#14532d', roughness: 0.6 });
  const per = 6;
  const granules = new THREE.InstancedMesh(gGeo, gMat, positions.length * per);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), tmp = new THREE.Vector3();
  positions.forEach((p, i) => {
    const sc = rand(rng, 0.92, 1.12);
    m.compose(p, q.identity(), s.setScalar(sc));
    body.setMatrixAt(i, m);
    for (let k = 0; k < per; k++) {
      randomUnit(rng, tmp).multiplyScalar(rand(rng, 0.0, 0.2)).add(p);
      m.compose(tmp, q.identity(), s.setScalar(rand(rng, 0.8, 1.4)));
      granules.setMatrixAt(i * per + k, m);
    }
  });
  body.renderOrder = 4;
  [body, granules].forEach((im) => {
    im.userData.org = 'lysosome';
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    group.add(im);
  });
  body.name = 'lysosome-body';
  ctx.lysoFocus = positions[0].clone();
  return group;
}

export function buildPeroxisomes(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'peroxisomes';
  const positions = scatter(rng, ctx, PEROX_COUNT, 'peroxisome', 0.45);
  const geo = new THREE.IcosahedronGeometry(0.32, 2);
  const mat = createMaterial('peroxisome', { color: ORG.peroxisome.color, roughness: 0.35, inner: '#ecfccb', opacity: 0.66, depthWrite: false });
  const body = new THREE.InstancedMesh(geo, mat, positions.length);
  const coreGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const coreMat = createMaterial('peroxisome', { color: '#4d7c0f', roughness: 0.55 });
  const core = new THREE.InstancedMesh(coreGeo, coreMat, positions.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), e = new THREE.Euler();
  positions.forEach((p, i) => {
    e.set(rng() * 3, rng() * 3, rng() * 3);
    q.setFromEuler(e);
    const sc = rand(rng, 0.9, 1.1);
    m.compose(p, q, s.set(sc, sc * 0.86, sc));
    body.setMatrixAt(i, m);
    m.compose(p, q, s.setScalar(sc));
    core.setMatrixAt(i, m);
  });
  body.renderOrder = 4;
  [body, core].forEach((im) => {
    im.userData.org = 'peroxisome';
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    group.add(im);
  });
  body.name = 'peroxisome-body';
  ctx.peroxFocus = positions[0].clone();
  return group;
}

/**
 * Túi vận chuyển và túi tiết (tĩnh). Gồm: túi ở mặt cis (giữa nhân và Golgi), túi ở mặt trans,
 * và vài túi trôi giữa lưới nội chất và Golgi.
 */
export function buildVesicles(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'vesicles';
  const geo = new THREE.IcosahedronGeometry(0.17, 2);
  const mat = createMaterial('vesicle', { color: ORG.vesicle.color, roughness: 0.3, inner: '#e0f6ff', opacity: 0.8, depthWrite: false });
  const items = [];
  const up = D_GOLGI.clone();
  const right = new THREE.Vector3(0, 1, 0).cross(up).normalize();
  const fwd = up.clone().cross(right).normalize();
  const place = (along, ang, rad, size) => {
    const p = GOLGI.center.clone()
      .addScaledVector(up, along)
      .addScaledVector(right, Math.cos(ang) * rad)
      .addScaledVector(fwd, Math.sin(ang) * rad);
    items.push({ p, size });
  };
  const yCis = golgiDiscY(0) - 0.55;
  const yTrans = golgiDiscY(GOLGI.discs - 1) + 0.6;
  for (let i = 0; i < 5; i++) place(yCis - rand(rng, 0, 0.5), i * 1.25 + rng(), rand(rng, 0.5, 1.5), rand(rng, 0.8, 1.0));
  for (let i = 0; i < 5; i++) place(yTrans + rand(rng, 0, 0.6), i * 1.25 + rng(), rand(rng, 0.4, 1.4), rand(rng, 1.0, 1.4));
  // đường từ lưới nội chất tới Golgi
  for (let i = 0; i < 4; i++) {
    const t = 0.25 + i * 0.17;
    const p = NUC.center.clone().addScaledVector(up, 4.2 + t * 1.2).addScaledVector(right, rand(rng, -1.6, 1.6)).addScaledVector(fwd, rand(rng, -1.4, 1.4));
    items.push({ p, size: 1 });
  }
  // hai túi trong cùng khối nằm gần mặt trước để dễ chạm
  items.push({ p: new THREE.Vector3(...ORG.vesicle.position), size: 1.15 });
  const im = new THREE.InstancedMesh(geo, mat, items.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  items.forEach((it, i) => {
    m.compose(it.p, q, s.setScalar(it.size));
    im.setMatrixAt(i, m);
    ctx.occ.add(it.p, 0.3);
  });
  im.userData.org = 'vesicle';
  im.instanceMatrix.needsUpdate = true;
  im.computeBoundingSphere();
  im.renderOrder = 4;
  im.name = 'vesicles';
  group.add(im);
  return group;
}
