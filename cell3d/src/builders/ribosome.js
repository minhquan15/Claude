import * as THREE from 'three';
import { ORG } from '../data/organelles.js';
import { NUC } from '../layout.js';
import { createMaterial } from './materials.js';
import { insideCell } from '../layout.js';
import { rand } from '../util.js';

export const RIBO_BOUND = 3600;
export const RIBO_FREE = 1400;

export function buildRibosomes(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'ribosomes';
  const geo = new THREE.OctahedronGeometry(0.062, 0);
  const base = new THREE.Color(ORG.ribosome.color);

  const mkMesh = (count, name) => {
    const mat = createMaterial('ribosome', { color: '#ffffff', roughness: 0.5, envMapIntensity: 0.8 });
    const im = new THREE.InstancedMesh(geo, mat, count);
    im.userData.org = 'ribosome';
    im.name = name;
    return im;
  };
  const bound = mkMesh(RIBO_BOUND, 'ribosomes-bound');
  const free = mkMesh(RIBO_FREE, 'ribosomes-free');

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), n = new THREE.Vector3();
  const c = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  const setColor = (im, i) => {
    c.copy(base).offsetHSL(rand(rng, -0.02, 0.02), 0, rand(rng, -0.08, 0.06));
    im.setColorAt(i, c);
  };
  const boundPos = [];
  for (let i = 0; i < RIBO_BOUND; i++) {
    ctx.rerTriangleSample(rng, p, n);
    p.addScaledVector(n, 0.06);
    q.setFromUnitVectors(up, n);
    const k = rand(rng, 0.85, 1.2);
    s.set(k, k * rand(rng, 0.8, 1.1), k);
    m.compose(p, q, s);
    bound.setMatrixAt(i, m);
    setColor(bound, i);
    boundPos.push(p.clone());
  }
  // ribosome tự do trong tế bào chất
  let placed = 0, tries = 0;
  const R = new THREE.Vector3();
  while (placed < RIBO_FREE && tries++ < RIBO_FREE * 40) {
    R.set(rand(rng, -9, 9), rand(rng, -7.8, 7.8), rand(rng, -8.5, 8.5));
    if (!insideCell(R, 0.86) || !ctx.occ.isFree(R, 0.1, 0.05)) continue;
    q.setFromEuler(new THREE.Euler(rng() * 6.28, rng() * 6.28, rng() * 6.28));
    const k = rand(rng, 0.85, 1.2);
    s.set(k, k, k);
    m.compose(R, q, s);
    free.setMatrixAt(placed, m);
    setColor(free, placed);
    placed++;
  }
  free.count = placed;
  ctx.ribosomeFreeCount = placed;
  bound.instanceMatrix.needsUpdate = true;
  bound.instanceColor.needsUpdate = true;
  free.instanceMatrix.needsUpdate = true;
  free.instanceColor.needsUpdate = true;
  bound.computeBoundingSphere();
  free.computeBoundingSphere();
  // điểm tiêu cự: ribosome bám gần vị trí gợi ý trong organelles.js
  const hint = new THREE.Vector3(...ORG.ribosome.position);
  ctx.ribosomeFocus = boundPos.reduce((a, b) => (a.distanceToSquared(hint) < b.distanceToSquared(hint) ? a : b)).clone();
  group.add(bound, free);
  return group;
}
