import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CELL, NUC, CENTRO, GOLGI, RER_MAX_R, cellRadiusAlong, insideCell } from '../layout.js';
import { createMaterial, shared } from './materials.js';
import { rand, randomUnit } from '../util.js';

function tubeWithAttrs(curve, segs, radius, radial, phase) {
  const g = new THREE.TubeGeometry(curve, segs, radius, radial, false);
  const n = g.attributes.position.count;
  const aS = new Float32Array(n), aP = new Float32Array(n);
  const ring = radial + 1;
  for (let i = 0; i < n; i++) {
    aS[i] = Math.floor(i / ring) / segs;
    aP[i] = phase;
  }
  g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  g.setAttribute('aP', new THREE.BufferAttribute(aP, 1));
  return g;
}

// đẩy điểm ra khỏi hình cầu (c, r)
function pushOut(p, c, r) {
  const d = p.clone().sub(c);
  const l = d.length();
  if (l < r) p.copy(c).addScaledVector(d.normalize(), r);
  return p;
}

export function buildCytoskeleton(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'cytoskeleton';

  // ---- Vi ống: tỏa ra từ trung thể về phía màng, có xung sáng gợi ý protein động cơ ----
  const mt = [];
  const origin = CENTRO.center.clone();
  const nMT = 24;
  for (let i = 0; i < nMT; i++) {
    const dir = randomUnit(rng);
    // hướng ra ngoài tế bào, tránh bị nhân chắn quá nhiều
    const target = dir.clone().multiplyScalar(1).multiply(new THREE.Vector3(CELL.a, CELL.b, CELL.c).multiplyScalar(0.9));
    const pts = [];
    const steps = 9;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const p = origin.clone().lerp(target, t);
      // cong nhẹ
      p.add(randomUnit(rng).multiplyScalar(0.45 * Math.sin(Math.PI * t)));
      if (k > 0) {
        pushOut(p, NUC.center, RER_MAX_R * 0.97);
        pushOut(p, GOLGI.center, 2.1);
      }
      if (!insideCell(p, 0.93)) p.multiplyScalar(0.93 / Math.sqrt((p.x / CELL.a) ** 2 + (p.y / CELL.b) ** 2 + (p.z / CELL.c) ** 2));
      pts.push(p);
    }
    mt.push(tubeWithAttrs(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5), 40, 0.055, 5, rng()));
  }

  // ---- Sợi trung gian: lưới sợi nối quanh nhân ra tới gần màng ----
  const itm = [];
  for (let i = 0; i < 18; i++) {
    const d = randomUnit(rng);
    const a = NUC.center.clone().addScaledVector(d, 3.55);
    const b = d.clone().multiply(new THREE.Vector3(CELL.a, CELL.b, CELL.c)).multiplyScalar(0.86).add(randomUnit(rng).multiplyScalar(0.5));
    const pts = [];
    for (let k = 0; k <= 7; k++) {
      const t = k / 7;
      const p = a.clone().lerp(b, t).add(randomUnit(rng).multiplyScalar(0.5 * Math.sin(Math.PI * t) + 0.12));
      if (!insideCell(p, 0.92)) p.multiplyScalar(0.92 / Math.sqrt((p.x / CELL.a) ** 2 + (p.y / CELL.b) ** 2 + (p.z / CELL.c) ** 2));
      pts.push(p);
    }
    itm.push(tubeWithAttrs(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5), 30, 0.055, 4, 0));
  }

  // ---- Actin: lớp vỏ dưới màng (thuộc Màng sinh chất) + vài bó xuyên bào tương ----
  const cortex = [];
  const e = new THREE.Vector3(CELL.a, CELL.b, CELL.c);
  for (let i = 0; i < 40; i++) {
    let dir = randomUnit(rng);
    const tang = new THREE.Vector3();
    const pts = [];
    const heading = rng() * 6.28;
    let h = heading;
    for (let k = 0; k < 14; k++) {
      pts.push(dir.clone().multiply(e).multiplyScalar(0.945 + 0.01 * Math.sin(k + i)));
      // bước dọc theo mặt cầu
      tang.set(-dir.y, dir.x, 0);
      if (tang.lengthSq() < 1e-4) tang.set(0, -dir.z, dir.y);
      tang.normalize();
      const b = dir.clone().cross(tang);
      h += rand(rng, -0.5, 0.5);
      const step = tang.multiplyScalar(Math.cos(h)).addScaledVector(b, Math.sin(h)).multiplyScalar(0.16);
      dir = dir.add(step).normalize();
    }
    cortex.push(tubeWithAttrs(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5), 22, 0.032, 4, 0));
  }
  const bundles = [];
  for (let i = 0; i < 9; i++) {
    const a = randomUnit(rng).multiply(e).multiplyScalar(0.93);
    const b = randomUnit(rng).multiply(e).multiplyScalar(0.93);
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const p = a.clone().lerp(b, t);
      pushOut(p, NUC.center, RER_MAX_R * 0.97);
      pushOut(p, GOLGI.center, 2.0);
      p.add(randomUnit(rng).multiplyScalar(0.3 * Math.sin(Math.PI * t)));
      pts.push(p);
    }
    bundles.push(tubeWithAttrs(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5), 32, 0.05, 4, 0));
  }

  const addMesh = (geos, org, color, name, pulsed) => {
    const geo = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    const mat = createMaterial(org, { color, roughness: 0.5, glow: color });
    if (pulsed) {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = shared.uTime;
        shader.uniforms.uMotion = shared.uMotion;
        shader.vertexShader = shader.vertexShader
          .replace('void main() {', 'attribute float aS; attribute float aP; varying float vS; varying float vP;\nvoid main() {')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvS = aS; vP = aP;');
        shader.fragmentShader = shader.fragmentShader
          .replace('void main() {', 'varying float vS; varying float vP; uniform float uTime; uniform float uMotion;\nvoid main() {')
          .replace(
            '#include <opaque_fragment>',
            `float pp = fract(uTime * 0.16 + vP * 3.0);
             float pulse = smoothstep(0.07, 0.0, abs(vS - pp)) * uMotion;
             outgoingLight += vec3(0.75, 0.9, 1.0) * pulse * 0.9;
             #include <opaque_fragment>`
          );
      };
      mat.customProgramCacheKey = () => 'mt-pulse-v1';
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.org = org;
    mesh.name = name;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };
  addMesh(mt, 'cytoskeleton', '#60a5fa', 'microtubules', true);
  addMesh(itm, 'cytoskeleton', '#f59e0b', 'intermediate', false);
  addMesh(bundles, 'cytoskeleton', '#fb7185', 'actin-bundles', false);
  addMesh(cortex, 'cortex', '#ff9db5', 'actin-cortex', false);
  return group;
}
