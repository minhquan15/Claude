import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ORG } from '../data/organelles.js';
import { NUC } from '../layout.js';
import { fibonacciSphere, randomUnit, rand } from '../util.js';
import { createMaterial } from './materials.js';

export const PORE_COUNT = 200;

export function buildNucleus(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'nucleus';
  group.position.copy(NUC.center);

  const nucColor = new THREE.Color(ORG.nucleus.color);
  const rerColor = new THREE.Color(ORG.rer.color);
  // màng ngoài của nhân cùng tông với lưới nội chất (vì nó nối liền với lưới nội chất hạt)
  const outerColor = nucColor.clone().lerp(rerColor, 0.65);

  // Hai vỏ cầu sát nhau = màng nhân kép
  const innerMat = createMaterial('nucleus', {
    color: nucColor, opacity: 0.4, inner: nucColor.clone().lerp(new THREE.Color('#ffffff'), 0.2), roughness: 0.45, depthWrite: false,
  });
  const outerMat = createMaterial('nucleus', {
    color: outerColor, opacity: 0.42, inner: outerColor.clone().lerp(new THREE.Color('#ffffff'), 0.1), roughness: 0.4, depthWrite: false,
  });
  const innerShell = new THREE.Mesh(new THREE.SphereGeometry(NUC.rInner, 48, 32), innerMat);
  const outerShell = new THREE.Mesh(new THREE.SphereGeometry(NUC.rOuter, 56, 36), outerMat);
  innerShell.userData.org = 'nucleus';
  outerShell.userData.org = 'nucleus';
  innerShell.renderOrder = 1;
  outerShell.renderOrder = 2;
  group.add(innerShell, outerShell);

  // Lỗ nhân: InstancedMesh, phân bố bằng Fibonacci sphere
  const poreGeo = new THREE.TorusGeometry(0.17, 0.055, 5, 10);
  const poreMat = createMaterial('nucleus', { color: '#5b4fe0', roughness: 0.5, emissive: 0 });
  const pores = new THREE.InstancedMesh(poreGeo, poreMat, PORE_COUNT);
  const dirs = fibonacciSphere(PORE_COUNT);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const rm = (NUC.rInner + NUC.rOuter) / 2;
  dirs.forEach((d, i) => {
    q.setFromUnitVectors(zAxis, d);
    m.compose(d.clone().multiplyScalar(rm), q, s);
    pores.setMatrixAt(i, m);
  });
  pores.instanceMatrix.needsUpdate = true;
  pores.userData.org = 'nucleus';
  pores.name = 'pores';
  group.add(pores);
  ctx.poreCount = PORE_COUNT;

  // Hạch nhân: khối đặc, màu đậm, hơi gồ ghề
  const nGeo = new THREE.IcosahedronGeometry(0.95, 4);
  const np = nGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < np.count; i++) {
    v.fromBufferAttribute(np, i);
    const k = 1 + 0.07 * ctx.noise.fbm(v.x * 2.4 + 9, v.y * 2.4, v.z * 2.4, 3);
    v.multiplyScalar(k);
    np.setXYZ(i, v.x, v.y, v.z);
  }
  nGeo.computeVertexNormals();
  const nlMat = createMaterial('nucleolus', { color: ORG.nucleolus.color, roughness: 0.75, flat: false });
  const nucleolus = new THREE.Mesh(nGeo, nlMat);
  nucleolus.position.copy(new THREE.Vector3(...ORG.nucleolus.position).sub(NUC.center));
  nucleolus.userData.org = 'nucleolus';
  nucleolus.name = 'nucleolus';
  group.add(nucleolus);

  // Chất nhiễm sắc: các sợi cong mờ cuộn trong nhân
  const geos = [];
  const chromaColor = new THREE.Color('#a78bfa');
  for (let i = 0; i < 22; i++) {
    const pts = [];
    const c = randomUnit(rng).multiplyScalar(rand(rng, 0.8, 2.4));
    const dir = randomUnit(rng);
    let p = c.clone();
    for (let k = 0; k < 9; k++) {
      pts.push(p.clone());
      dir.add(randomUnit(rng).multiplyScalar(0.9)).normalize();
      p.addScaledVector(dir, rand(rng, 0.35, 0.6));
      const len = p.length();
      if (len > 2.8) p.multiplyScalar(2.8 / len);
      // tránh hạch nhân
      const dn = p.clone().sub(nucleolus.position);
      if (dn.length() < 1.15) p.add(dn.setLength(1.15 - dn.length()));
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    geos.push(new THREE.TubeGeometry(curve, 36, 0.05, 5, false));
  }
  const chroma = new THREE.Mesh(
    mergeGeometries(geos),
    createMaterial('nucleus', { color: chromaColor, opacity: 0.85, roughness: 0.6 })
  );
  chroma.userData.org = 'nucleus';
  chroma.name = 'chromatin';
  geos.forEach((g) => g.dispose());
  group.add(chroma);

  ctx.nucleolusWorld = new THREE.Vector3(...ORG.nucleolus.position);
  return group;
}
