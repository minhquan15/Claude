import * as THREE from 'three';
import { clipPlane } from '../builders/materials.js';
import { CELL } from '../layout.js';

/**
 * Cắt lớp bằng clippingPlanes. Mặt bị cắt được "đậy" nhờ vật liệu tô màu mặt trong (xem materials.js).
 * percent 0..100: 0 = không cắt, 100 = cắt gần hết (còn ~5% phía sau).
 */
const AXES = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const HALF = { x: 10.2, y: 8.8, z: 9.6 };

export function createClipping(renderer, scene) {
  renderer.localClippingEnabled = true;
  // Mặt cắt của tế bào: đĩa elip mờ màu bào tương + viền, đặt đúng tại mặt phẳng cắt
  const cap = new THREE.Group();
  const capDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1, 72),
    new THREE.MeshBasicMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
  );
  const capRim = new THREE.Mesh(
    new THREE.RingGeometry(0.975, 1, 72),
    new THREE.MeshBasicMaterial({ color: '#ffd6e6', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
  );
  capDisc.renderOrder = 9;
  capRim.renderOrder = 9;
  cap.add(capDisc, capRim);
  cap.visible = false;
  cap.name = 'cut-cap';
  if (scene) scene.add(cap);
  const state = { axis: 'z', percent: 0, flip: false };
  function apply() {
    const a = AXES[state.axis];
    const sign = state.flip ? -1 : 1;
    // giữ phần có (sign*a·p) <= c, tức cắt bỏ phần phía +sign
    const c = HALF[state.axis] * (1 - 2 * 0.95 * (state.percent / 100)) * 1.0;
    // c ở phần trăm 0 phải >= bán kính để không cắt gì
    const cEff = state.percent <= 0 ? 1e4 : c;
    clipPlane.normal.copy(a).multiplyScalar(-sign);
    clipPlane.constant = cEff;
    // đặt mặt cắt
    const active = state.percent > 0;
    cap.visible = active;
    if (active) {
      const p = sign * c; // vị trí dọc trục
      const half = { x: CELL.a, y: CELL.b, z: CELL.c }[state.axis];
      const k = Math.sqrt(Math.max(0, 1 - Math.min(1, (p / half) ** 2))) * 0.965;
      cap.position.copy(a).multiplyScalar(p);
      cap.rotation.set(0, 0, 0);
      if (state.axis === 'z') cap.scale.set(CELL.a * k, CELL.b * k, 1);
      else if (state.axis === 'x') { cap.rotation.y = Math.PI / 2; cap.scale.set(CELL.c * k, CELL.b * k, 1); }
      else { cap.rotation.x = -Math.PI / 2; cap.scale.set(CELL.a * k, CELL.c * k, 1); }
      cap.visible = k > 0.02;
    }
  }
  apply();
  return {
    state,
    setPercent(p) { state.percent = Math.max(0, Math.min(100, p)); apply(); },
    setAxis(a) { state.axis = a; apply(); },
    setFlip(f) { state.flip = f; apply(); },
    isActive: () => state.percent > 0,
  };
}
