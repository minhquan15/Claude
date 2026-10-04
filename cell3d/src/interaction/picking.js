import * as THREE from 'three';
import { clipPlane } from '../builders/materials.js';
import { WINDOW_DIR, WINDOW_COS } from '../builders/membrane.js';
import { CELL } from '../layout.js';

const TAP_PX = 6;

/**
 * Chọn bào quan bằng chạm/nhấp. Phân biệt chạm và kéo bằng ngưỡng ~6 px.
 * InstancedMesh: raycast trả về instanceId; mọi instance của một mesh thuộc cùng một bào quan.
 */
export function createPicking({ canvas, camera, world, onPick }) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pointers = new Map();
  let multi = false;
  let enabled = true;

  canvas.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    if (pointers.size > 1) multi = true;
  });
  canvas.addEventListener('pointerup', (e) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (!p) return;
    const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y);
    const wasMulti = multi;
    if (pointers.size === 0) multi = false;
    if (!enabled || wasMulti || moved > TAP_PX || performance.now() - p.t > 700) return;
    if (e.button !== undefined && e.button !== 0) return;
    const hit = pick(e.clientX, e.clientY);
    onPick(hit ? hit.id : null, hit);
  });
  canvas.addEventListener('pointercancel', (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size === 0) multi = false;
  });

  const ellip = new THREE.Vector3();
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(world.pickables, false);
    let membraneHit = null;
    let firstOrg = null, firstHit = null, nucleolusHit = null;
    for (const h of hits) {
      if (clipPlane.distanceToPoint(h.point) < 0) continue; // phần đã bị cắt bỏ thì không chạm được
      const o = h.object;
      if (o.userData.org === 'membrane' && o.userData.isMembrane) {
        if (!membraneHit) {
          const front = h.face ? h.face.normal.dot(ray.ray.direction) < 0 : true;
          ellip.set(h.point.x / CELL.a, h.point.y / CELL.b, h.point.z / CELL.c).normalize();
          const inWindow = front && ellip.dot(WINDOW_DIR) > WINDOW_COS;
          if (!inWindow) membraneHit = { id: front ? 'membrane' : 'cytoplasm', hit: h };
        }
        continue;
      }
      // bỏ qua vật đã bị làm mờ gần như vô hình
      const mat = o.material;
      if (mat && mat.opacity < 0.05) continue;
      if (o.userData.org === 'nucleolus' && !nucleolusHit) nucleolusHit = h;
      if (!firstHit) {
        firstHit = h;
        firstOrg = o.userData.org === 'cortex' ? 'membrane' : o.userData.org;
      }
    }
    if (firstHit) {
      // nhìn xuyên qua màng nhân mờ thấy hạch nhân => chọn hạch nhân
      if (firstOrg === 'nucleus' && nucleolusHit) return { id: 'nucleolus', hit: nucleolusHit };
      return { id: firstOrg, hit: firstHit };
    }
    return membraneHit ? { id: membraneHit.id, hit: membraneHit.hit } : null;
  }

  return { pick, setEnabled: (v) => (enabled = v) };
}
