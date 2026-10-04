import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ORG } from '../data/organelles.js';
import { GOLGI, D_GOLGI, NUC } from '../layout.js';
import { createMaterial } from './materials.js';

// Bộ máy Golgi: chồng đĩa cong dẹt, mép phình ra. Trục cục bộ +Y = hướng cis -> trans
// (từ nhân ra phía màng). Mặt cis quay về lưới nội chất/nhân, mặt trans quay ra màng.
export function golgiDiscY(k) {
  return (k - (GOLGI.discs - 1) / 2) * GOLGI.spacing;
}

function discGeometry(R, thick, bend) {
  const prof = [];
  const rim = 0.085 + thick * 0.3;
  prof.push(new THREE.Vector2(0.001, thick));
  prof.push(new THREE.Vector2(R * 0.35, thick * 0.95));
  prof.push(new THREE.Vector2(R * 0.7, thick * 0.9));
  prof.push(new THREE.Vector2(R - rim * 2.2, thick * 0.9));
  // mép phình tròn
  for (const a of [135, 100, 65, 30, 0, -30, -65, -100, -135]) {
    const t = THREE.MathUtils.degToRad(a);
    prof.push(new THREE.Vector2(R - rim + Math.cos(t) * rim, Math.sin(t) * (rim * 0.95)));
  }
  prof.push(new THREE.Vector2(R - rim * 2.2, -thick * 0.9));
  prof.push(new THREE.Vector2(R * 0.7, -thick * 0.9));
  prof.push(new THREE.Vector2(R * 0.35, -thick * 0.95));
  prof.push(new THREE.Vector2(0.001, -thick));
  const g = new THREE.LatheGeometry(prof, 40);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const rr = Math.hypot(p.getX(i), p.getZ(i));
    p.setY(i, p.getY(i) + bend * rr * rr); // rìa cong lên về phía trans
  }
  g.computeVertexNormals();
  return g;
}

export function buildGolgi(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'golgi';
  group.position.copy(GOLGI.center);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), D_GOLGI);
  const geos = [];
  const cis = new THREE.Color('#ffb86b');
  const trans = new THREE.Color('#ff7a3d');
  const c = new THREE.Color();
  for (let k = 0; k < GOLGI.discs; k++) {
    const t = k / (GOLGI.discs - 1);
    const R = GOLGI.radius * (1.0 - 0.3 * t) * (0.97 + 0.06 * Math.sin(k * 2.1));
    const g = discGeometry(R, 0.032, 0.17 - 0.05 * t);
    g.translate(0, golgiDiscY(k), 0);
    c.copy(cis).lerp(trans, t);
    const cols = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < cols.length; i += 3) { cols[i] = c.r; cols[i + 1] = c.g; cols[i + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geos.push(g);
  }
  const geo = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  const mat = createMaterial('golgi', { color: '#ffffff', vertexColors: true, roughness: 0.42, double: true, glow: ORG.golgi.color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.org = 'golgi';
  mesh.name = 'golgi-stack';
  group.add(mesh);
  ctx.occ.add(GOLGI.center, 2.5);
  ctx.golgiGroup = group;
  return group;
}
