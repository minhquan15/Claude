import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PATHWAY_STEPS } from '../data/organelles.js';
import { GOLGI, D_GOLGI, NUC, CELL, rayEllipsoidExit, ellipsoidNormal } from '../layout.js';
import { golgiDiscY } from './golgi.js';
import { clipPlanes, shared } from './materials.js';
import { easeInOut, easeOut, clamp01 } from '../util.js';

export const PATH_TAIL = 0.8; // dừng ngắn giữa hai vòng lặp

/**
 * Đường đi của protein: lưới nội chất hạt -> túi vận chuyển -> mặt cis -> các túi Golgi ->
 * mặt trans -> túi tiết -> hòa màng (xuất bào).
 * Các mesh ở đây không đăng ký vào sổ bào quan nên không bị làm mờ và không chọn được.
 */
export function buildPathway(rng, ctx) {
  const group = new THREE.Group();
  group.name = 'pathway';
  group.visible = false;

  const up = D_GOLGI.clone();
  const right = new THREE.Vector3(0, 1, 0).cross(up).normalize();
  const fwd = up.clone().cross(right).normalize();

  // ---- các điểm mốc ----
  // A: điểm trên lưới nội chất hạt gần Golgi nhất (rìa tấm, nơi túi nảy chồi)
  const rp = ctx.rer.geo.attributes.position;
  const v = new THREE.Vector3();
  let best = -2, A = new THREE.Vector3();
  for (let i = 0; i < rp.count; i++) {
    v.fromBufferAttribute(rp, i);
    const l = v.length();
    if (l < 4.0) continue;
    const s = v.dot(up) / l;
    if (s > best) { best = s; A.copy(v); }
  }
  const nrmA = A.clone().normalize();
  A.add(NUC.center).addScaledVector(nrmA, 0.22);

  const disc = (k) => GOLGI.center.clone().addScaledVector(up, golgiDiscY(k));
  const Pc = GOLGI.center.clone().addScaledVector(up, golgiDiscY(0) - 0.7);
  const Pt = GOLGI.center.clone().addScaledVector(up, golgiDiscY(GOLGI.discs - 1) + 0.75);
  const eDir = up.clone().multiplyScalar(0.55).add(new THREE.Vector3(0.45, -0.05, 0.55)).normalize();
  const E = Pt.clone().addScaledVector(eDir, rayEllipsoidExit(Pt, eDir, 0.97));
  const En = ellipsoidNormal(E);

  // đường cong A -> Pc  và  Pt -> E
  const mid1 = A.clone().lerp(Pc, 0.5).addScaledVector(right, 0.8).addScaledVector(fwd, 0.5);
  const curve1 = new THREE.CatmullRomCurve3([A, mid1, Pc], false, 'catmullrom', 0.5);
  const mid2 = Pt.clone().lerp(E, 0.5).addScaledVector(right, -0.5).addScaledVector(fwd, 0.9);
  const curve2 = new THREE.CatmullRomCurve3([Pt, mid2, E.clone().addScaledVector(En, -0.5)], false, 'catmullrom', 0.5);
  const stackPts = [];
  for (let k = 0; k < GOLGI.discs; k++) stackPts.push(disc(k));
  const stackCurve = new THREE.CatmullRomCurve3([Pc, ...stackPts, Pt], false, 'catmullrom', 0.5);

  // ---- vệt sáng chạy theo lộ trình ----
  const trailGeos = [];
  const lens = [curve1.getLength(), stackCurve.getLength(), curve2.getLength()];
  const totalLen = lens[0] + lens[1] + lens[2];
  let acc = 0;
  [curve1, stackCurve, curve2].forEach((c, i) => {
    const segs = 48;
    const g = new THREE.TubeGeometry(c, segs, 0.045, 5, false);
    const n = g.attributes.position.count;
    const aS = new Float32Array(n);
    for (let k = 0; k < n; k++) aS[k] = (acc + (Math.floor(k / 6) / segs) * lens[i]) / 1;
    acc += lens[i];
    g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
    trailGeos.push(g);
  });
  const trailGeo = mergeGeometries(trailGeos);
  trailGeos.forEach((g) => g.dispose());
  const trailMat = new THREE.MeshBasicMaterial({
    color: '#ffe066', transparent: true, opacity: 0.9, depthWrite: false, clippingPlanes: clipPlanes,
  });
  trailMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shared.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'attribute float aS; varying float vS;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvS = aS;');
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'varying float vS; uniform float uTime;\nvoid main() {')
      .replace(
        '#include <opaque_fragment>',
        `float dash = smoothstep(0.35, 0.5, fract(vS * 1.6 - uTime * 0.9));
         #include <opaque_fragment>
         gl_FragColor.a *= 0.18 + 0.82 * dash;`
      );
  };
  trailMat.customProgramCacheKey = () => 'trail-v1';
  const trail = new THREE.Mesh(trailGeo, trailMat);
  trail.renderOrder = 20;
  trail.frustumCulled = false;
  group.add(trail);

  // ---- vật mang protein (túi) ----
  const cargoMat = new THREE.MeshStandardMaterial({
    color: '#8fdcff', emissive: '#ffd54a', emissiveIntensity: 0.9, roughness: 0.25, transparent: true,
    clippingPlanes: clipPlanes, depthTest: false, // nhìn thấy cả khi đang ở bên trong các túi Golgi
  });
  const cargo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 2), cargoMat);
  cargo.renderOrder = 22;
  const haloMat = new THREE.MeshBasicMaterial({
    color: '#ffe066', transparent: true, opacity: 0.28, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, clippingPlanes: clipPlanes,
  });
  const haloMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), haloMat);
  haloMesh.renderOrder = 23;
  group.add(cargo, haloMesh);

  // vòng gợn trên màng khi xuất bào
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#fff3b0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: clipPlanes,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), ringMat);
  ring.renderOrder = 24;
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), En);
  ring.position.copy(E).addScaledVector(En, 0.03);
  group.add(ring);

  // hạt protein văng ra ngoài tế bào
  const NP = 7;
  const partMat = new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.9, depthWrite: false, clippingPlanes: clipPlanes });
  const parts = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075, 0), partMat, NP);
  parts.frustumCulled = false;
  parts.renderOrder = 25;
  group.add(parts);
  const partDirs = [];
  for (let i = 0; i < NP; i++) {
    const a = (i / NP) * Math.PI * 2;
    const t1 = new THREE.Vector3(1, 0, 0).cross(En).normalize();
    const t2 = En.clone().cross(t1);
    partDirs.push(En.clone().multiplyScalar(1).addScaledVector(t1, Math.cos(a) * 0.45).addScaledVector(t2, Math.sin(a) * 0.45).normalize());
  }

  // ---- đồng hồ & dựng pose ----
  const steps = PATHWAY_STEPS;
  const starts = [];
  let T = 0;
  steps.forEach((s) => { starts.push(T); T += s.duration; });
  const total = T + PATH_TAIL;

  const P = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const q = new THREE.Quaternion(), s3 = new THREE.Vector3(), m4 = new THREE.Matrix4();
  const qFlat = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);

  function pose(t) {
    const idx = (() => { for (let i = steps.length - 1; i >= 0; i--) if (t >= starts[i]) return i; return 0; })();
    const inTail = t >= T;
    const stepIdx = inTail ? steps.length - 1 : idx;
    const u = inTail ? 1 : clamp01((t - starts[idx]) / steps[idx].duration);
    let scale = 1, vis = 1, halo = 1, flat = 0, glow = 0.9;
    qFlat.identity();
    switch (stepIdx) {
      case 0: // tổng hợp trên lưới nội chất hạt
        P.copy(A); scale = 0.1 + 0.55 * easeOut(u); halo = 0.6 + 0.6 * Math.sin(u * 14); glow = 0.6 + 0.8 * u;
        break;
      case 1: { // túi vận chuyển nảy chồi và di chuyển tới Golgi
        const k = easeInOut(clamp01((u - 0.12) / 0.88));
        curve1.getPoint(k, P);
        scale = 0.65 + 0.35 * easeOut(clamp01(u / 0.2));
        break;
      }
      case 2: { // hòa màng với túi dẹt mặt cis
        const k = easeInOut(u);
        P.copy(Pc).lerp(disc(0), k);
        scale = 1 - 0.5 * k; flat = k;
        qFlat.setFromUnitVectors(yAxis, up);
        break;
      }
      case 3: { // đi qua các túi Golgi
        const k = easeInOut(u) * (GOLGI.discs - 1);
        const i0 = Math.min(GOLGI.discs - 2, Math.floor(k));
        const f = k - i0;
        P.copy(disc(i0)).lerp(disc(i0 + 1), f);
        P.addScaledVector(right, Math.sin(k * 3.0) * 0.35);
        scale = 0.5 + 0.12 * Math.sin(f * Math.PI);
        break;
      }
      case 4: { // mặt trans: đóng gói, nảy chồi thành túi tiết
        const k = easeInOut(u);
        P.copy(disc(GOLGI.discs - 1)).lerp(Pt, k);
        scale = 0.5 + 0.7 * easeOut(u);
        break;
      }
      case 5: { // túi tiết đi về phía màng
        curve2.getPoint(easeInOut(u), P);
        scale = 1.2;
        break;
      }
      default: { // hòa màng - xuất bào
        scale = 1.2;
        const approach = clamp01(u / 0.4);
        const merge = easeInOut(clamp01((u - 0.35) / 0.4));
        curve2.getPoint(1, tmp2);
        P.copy(tmp2).lerp(tmp.copy(E).addScaledVector(En, -0.08), easeInOut(approach));
        flat = merge;
        qFlat.setFromUnitVectors(yAxis, En);
        vis = 1 - clamp01((u - 0.7) / 0.25);
        halo = 1 - merge * 0.6;
      }
    }
    cargo.position.copy(P);
    haloMesh.position.copy(P);
    if (flat > 0) {
      // đè dẹt: dẹt theo pháp tuyến, loe ra theo mặt tiếp xúc => túi hòa vào màng
      cargo.quaternion.copy(qFlat);
      cargo.scale.set(scale * (1 + 1.2 * flat), scale * (1 - 0.82 * flat), scale * (1 + 1.2 * flat));
    } else {
      cargo.quaternion.identity();
      cargo.scale.setScalar(scale);
    }
    haloMesh.quaternion.copy(cargo.quaternion);
    haloMesh.scale.copy(cargo.scale).multiplyScalar(1.9);
    cargoMat.opacity = vis;
    cargoMat.emissiveIntensity = glow;
    haloMat.opacity = 0.28 * halo * vis;
    cargo.visible = vis > 0.01;
    haloMesh.visible = vis > 0.01;

    // vòng gợn + hạt văng ra
    if (stepIdx === 6) {
      const e = clamp01((u - 0.45) / 0.55);
      const rs = 0.3 + 2.2 * e;
      ring.scale.setScalar(rs);
      ringMat.opacity = 0.7 * Math.sin(Math.PI * Math.min(1, e * 1.2)) * (e > 0 ? 1 : 0);
      parts.visible = e > 0;
      for (let i = 0; i < NP; i++) {
        tmp.copy(E).addScaledVector(partDirs[i], 0.1 + e * 2.2 + (i % 3) * 0.1);
        s3.setScalar(1 - e * 0.5);
        m4.compose(tmp, q.identity(), s3);
        parts.setMatrixAt(i, m4);
      }
      parts.instanceMatrix.needsUpdate = true;
      partMat.opacity = 0.9 * (1 - e * e);
    } else {
      ringMat.opacity = 0;
      parts.visible = false;
    }
    return stepIdx;
  }

  // Khung nhìn gợi ý cho chế độ này
  const mid = A.clone().add(E).multiplyScalar(0.5);
  const frame = { target: mid.clone().add(new THREE.Vector3(0, 0.4, 0.8)), dir: new THREE.Vector3(0.12, 0.28, 1).normalize(), dist: 19 };

  group.userData.pose = pose;
  return {
    group,
    steps, starts, total, T, frame,
    points: { A, Pc, Pt, E, En },
    pose,
    stepAt(t) {
      if (t >= T) return steps.length - 1;
      for (let i = steps.length - 1; i >= 0; i--) if (t >= starts[i]) return i;
      return 0;
    },
  };
}
