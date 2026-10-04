import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ORG } from '../data/organelles.js';
import { CENTRO } from '../layout.js';
import { createMaterial } from './materials.js';

// Mỗi trung tử: 9 bộ ba vi ống xếp vòng. Hai trung tử đặt vuông góc nhau.
function centriole(len, radius) {
  const geos = [];
  const tubeR = 0.032;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    // ba vi ống của một bộ ba xếp sát nhau, hơi nghiêng theo tiếp tuyến
    for (let k = 0; k < 3; k++) {
      const g = new THREE.CylinderGeometry(tubeR, tubeR, len, 6, 1, false);
      const tang = (k - 1) * tubeR * 1.9;
      const rr = radius + (k === 0 ? 0.012 : k === 2 ? -0.012 : 0);
      g.translate(0, 0, 0);
      g.rotateY(0);
      g.translate(Math.cos(a) * rr - Math.sin(a) * tang, 0, Math.sin(a) * rr + Math.cos(a) * tang);
      geos.push(g);
    }
  }
  // trục giữa (cartwheel) mờ
  const hub = new THREE.CylinderGeometry(0.03, 0.03, len * 0.6, 6);
  geos.push(hub);
  const g = mergeGeometries(geos);
  geos.forEach((x) => x.dispose());
  return g; // trục dọc theo Y
}

export function buildCentrosome(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'centrosome';
  group.position.copy(CENTRO.center);
  const len = 0.95, R = 0.3;
  const g1 = centriole(len, R);
  const g2 = g1.clone();
  g1.rotateZ(Math.PI / 2); // trung tử 1 nằm ngang (trục X)
  // trung tử 2 vuông góc: trục Z, đặt sát đầu bên của trung tử 1
  g2.rotateX(Math.PI / 2);
  g2.translate(0, 0, len / 2 + R + 0.12);
  g1.translate(0, 0, 0);
  const geo = mergeGeometries([g1, g2]);
  g1.dispose(); g2.dispose();
  const mat = createMaterial('centrosome', { color: ORG.centrosome.color, roughness: 0.4, emissive: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.org = 'centrosome';
  mesh.name = 'centrioles';
  mesh.position.set(0, 0, -(len / 2 + R + 0.12) / 2);
  group.add(mesh);
  // chất quanh trung tử (pericentriolar material): khối mờ, giúp dễ chạm chọn
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 16, 12),
    createMaterial('centrosome', { color: ORG.centrosome.color, opacity: 0.16, depthWrite: false, roughness: 0.6 })
  );
  cloud.userData.org = 'centrosome';
  cloud.renderOrder = 5;
  group.add(cloud);
  // hướng trục: nghiêng nhẹ cho nhìn rõ hai trung tử vuông góc từ camera mặc định
  group.rotation.set(-0.5, 0.35, 0.2);
  ctx.occ.add(CENTRO.center, 1.1);
  return group;
}
