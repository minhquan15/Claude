import * as THREE from 'three';
import { ORG } from '../data/organelles.js';

/**
 * Điều phối chọn bào quan: highlight + camera bay tới + thông báo cho giao diện.
 */
export function createSelection({ world, highlight, cameraRig, labels }) {
  let current = null;
  const listeners = [];
  const emit = () => listeners.forEach((f) => f(current));
  const tgt = new THREE.Vector3(), dir = new THREE.Vector3();

  function select(id, { fly = true } = {}) {
    if (id && !ORG[id]) return;
    current = id;
    highlight.setSelected(id);
    labels.setSelected(id);
    if (id && fly) {
      const o = ORG[id];
      tgt.copy(world.focus[id]);
      dir.set(...o.cam.dir);
      cameraRig.flyToView(tgt, dir, o.cam.dist, 1.15);
    }
    emit();
  }
  return {
    select,
    clear: () => select(null, { fly: false }),
    get current() { return current; },
    onChange: (f) => listeners.push(f),
  };
}
