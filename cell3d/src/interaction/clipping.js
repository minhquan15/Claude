import * as THREE from 'three';
import { clipPlane } from '../builders/materials.js';

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

export function createClipping(renderer) {
  renderer.localClippingEnabled = true;
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
