import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ORG } from '../data/organelles.js';
import { insideCell } from '../layout.js';
import { createMaterial } from './materials.js';
import { rand, randomUnit } from '../util.js';

export const MITO_TOTAL = 17;
export const MITO_SLICED = 5;
const R_OUT = 0.5, H_OUT = 0.5;

function capsuleProfile(r, h, seg = 6) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = -Math.PI / 2 + (i / seg) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.0005, r * Math.cos(a)), -h + r * Math.sin(a)));
  }
  for (let i = 1; i <= seg; i++) {
    const a = (i / seg) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.0005, r * Math.cos(a)), h + r * Math.sin(a)));
  }
  return pts;
}

// Ti thể: dạng viên nang. Một số bị cắt lát (khoét một góc) để lộ màng trong gấp nếp (cristae) và chất nền.
export function buildMitochondria(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'mitochondria';
  const SEG = 20;
  const PHI_LEN = Math.PI * 1.45;
  const PHI_START = 0;
  const openCenter = PHI_START + PHI_LEN + (Math.PI * 2 - PHI_LEN) / 2; // góc giữa của chỗ khoét
  const openLocal = new THREE.Vector3(Math.sin(openCenter), 0, Math.cos(openCenter));

  const color = new THREE.Color(ORG.mitochondria.color);
  const solidGeo = new THREE.LatheGeometry(capsuleProfile(R_OUT, H_OUT), SEG);
  const outerCutGeo = new THREE.LatheGeometry(capsuleProfile(R_OUT, H_OUT), SEG, PHI_START, PHI_LEN);
  const innerCutGeo = new THREE.LatheGeometry(capsuleProfile(R_OUT * 0.74, H_OUT * 0.94, 5), SEG, PHI_START, PHI_LEN);
  // cristae: các tấm gấp nếp nhô vào từ màng trong, đan xen hai bên
  const cr = [];
  const nCr = 8;
  for (let i = 0; i < nCr; i++) {
    const y = -0.66 + (i / (nCr - 1)) * 1.32;
    const g = new THREE.CircleGeometry(R_OUT * 0.7, 14, i % 2 ? 0 : Math.PI, Math.PI * 1.15);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) p.setY(k, 0.035 * Math.sin(p.getX(k) * 14 + p.getZ(k) * 9 + i));
    g.rotateY(i * 0.5);
    g.translate(0, y, 0);
    cr.push(g);
  }
  const cristaeGeo = mergeGeometries(cr);
  cr.forEach((g) => g.dispose());

  const outerSolidMat = createMaterial('mitochondria', { color, roughness: 0.4, inner: true, opacity: 1 });
  const outerCutMat = createMaterial('mitochondria', { color, roughness: 0.4, inner: '#d9706c', opacity: 0.9 });
  const innerMat = createMaterial('mitochondria', {
    color: color.clone().lerp(new THREE.Color('#ffc2b8'), 0.25), roughness: 0.5, inner: '#cf7f78', opacity: 1,
  });
  const cristaMat = createMaterial('mitochondria', { color: '#ff9a8d', roughness: 0.6, double: true, opacity: 1 });

  const nSolid = MITO_TOTAL - MITO_SLICED;
  const solid = new THREE.InstancedMesh(solidGeo, outerSolidMat, nSolid);
  const outerCut = new THREE.InstancedMesh(outerCutGeo, outerCutMat, MITO_SLICED);
  const innerCut = new THREE.InstancedMesh(innerCutGeo, innerMat, MITO_SLICED);
  const cristae = new THREE.InstancedMesh(cristaeGeo, cristaMat, MITO_SLICED);
  [solid, outerCut, innerCut, cristae].forEach((im, i) => {
    im.userData.org = 'mitochondria';
    im.name = ['mito-solid', 'mito-cut-outer', 'mito-cut-inner', 'mito-cristae'][i];
    im.frustumCulled = false;
    group.add(im);
  });
  outerCut.renderOrder = 3;

  // ----- đặt vị trí (không chồng bào quan khác) -----
  const items = []; // {pos, quat, scale, phase, sliced}
  const hint = new THREE.Vector3(...ORG.mitochondria.position);
  const Y = new THREE.Vector3(0, 1, 0);
  const place = (sliced, fixed) => {
    for (let tries = 0; tries < 400; tries++) {
      const p = fixed ? hint.clone() : new THREE.Vector3(rand(rng, -9, 9), rand(rng, -7.5, 7.5), rand(rng, -8.2, 8.2));
      if (!insideCell(p, 0.82) || !ctx.occ.isFree(p, 0.95, 0.1)) {
        if (fixed) break;
        continue;
      }
      const axis = randomUnit(rng);
      if (fixed) axis.set(0.5, 0.75, 0.2).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(Y, axis);
      if (sliced) {
        // xoay quanh trục sao cho chỗ khoét hướng về phía người xem (+z)
        const o = openLocal.clone().applyQuaternion(q);
        const want = new THREE.Vector3(0.1, 0.25, 1);
        want.addScaledVector(axis, -want.dot(axis)).normalize();
        const ang = Math.atan2(o.clone().cross(want).dot(axis), o.dot(want));
        q.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, ang));
      }
      const sc = rand(rng, 0.9, 1.15) * (fixed ? 1.12 : 1);
      ctx.occ.add(p, 0.95 * sc);
      items.push({ pos: p, quat: q, scale: sc, phase: rng() * 6.28, sliced });
      return true;
    }
    return false;
  };
  // ti thể cắt lát đầu tiên nằm đúng vị trí gợi ý (là ti thể được chọn khi bấm "Ti thể"); các ti thể khác xếp sau
  place(true, true);
  let guard = 0;
  while (items.filter((i) => i.sliced).length < MITO_SLICED && guard++ < 3000) place(true, false);
  guard = 0;
  while (items.length < MITO_TOTAL && guard++ < 3000) place(false, false);

  const solidItems = items.filter((i) => !i.sliced);
  const cutItems = items.filter((i) => i.sliced);
  solid.count = solidItems.length;
  outerCut.count = innerCut.count = cristae.count = cutItems.length;
  ctx.mitoCount = items.length;

  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpP = new THREE.Vector3(), tmpS = new THREE.Vector3();
  const spin = new THREE.Quaternion(), eul = new THREE.Euler();
  function writeAll(t, motion) {
    const set = (mesh, list, scaleMul = 1) => {
      list.forEach((it, i) => {
        const a = t * 0.12 + it.phase;
        tmpP.set(Math.sin(a * 1.1) * 0.22, Math.cos(a * 0.9) * 0.2, Math.sin(a * 0.8 + 1) * 0.2).multiplyScalar(motion).add(it.pos);
        eul.set(Math.sin(a * 0.7) * 0.14 * motion, Math.sin(a * 0.5) * 0.3 * motion, Math.cos(a * 0.6) * 0.14 * motion);
        spin.setFromEuler(eul);
        tmpQ.copy(it.quat).multiply(spin);
        tmpS.setScalar(it.scale * scaleMul);
        tmpM.compose(tmpP, tmpQ, tmpS);
        mesh.setMatrixAt(i, tmpM);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    set(solid, solidItems);
    set(outerCut, cutItems);
    set(innerCut, cutItems);
    set(cristae, cutItems);
  }
  writeAll(0, 0);
  [solid, outerCut, innerCut, cristae].forEach((im) => {
    im.computeBoundingSphere();
    if (im.boundingSphere) im.boundingSphere.radius += 1.2;
  });
  group.userData.update = (t, motion) => writeAll(t, motion);
  ctx.mitoFocus = items[0].pos.clone();
  return group;
}
