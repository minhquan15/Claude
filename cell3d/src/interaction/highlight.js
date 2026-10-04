import { registry, applyVisual } from '../builders/materials.js';

/**
 * Làm mờ các bào quan không được chọn, làm sáng bào quan được chọn.
 * Chuyển trạng thái có nội suy; chỉ ghi vào vật liệu khi giá trị đổi.
 */
export function createHighlight(world) {
  const cur = new Map(); // id -> {dim, glow}
  let selected = null;
  let focusSet = null; // Set id hoặc null
  const DIM = 0.13;

  const items = []; // mảng phẳng để vòng lặp render không phải cấp phát
  for (const [id, mats] of registry) {
    const s = { id, dim: 1, glow: 0, td: 1, tg: 0, mats: Array.from(mats) };
    cur.set(id, s);
    items.push(s);
  }
  const membraneMat = world.membraneMaterial;

  function recompute() {
    for (let i = 0; i < items.length; i++) {
      const s = items[i], id = s.id;
      let td = 1, tg = 0;
      const key = id === 'cortex' ? 'membrane' : id; // vỏ actin thuộc màng sinh chất khi chọn
      if (focusSet) {
        td = focusSet.has(id) ? 1 : DIM;
      } else if (selected && selected !== 'cytoplasm') {
        if (key === selected) { td = 1; tg = 1; }
        else td = DIM;
      } else if (selected === 'cytoplasm') {
        td = key === 'membrane' ? 1 : 0.8;
      }
      s.td = td;
      s.tg = tg;
    }
  }

  function setSelected(id) {
    selected = id;
    recompute();
  }
  function setFocusSet(ids) {
    focusSet = ids ? new Set(ids) : null;
    recompute();
  }

  let cytoGlow = 0;
  function update(dt, time, motion) {
    const k = 1 - Math.exp(-dt * 9);
    const pulse = motion ? 0.5 + 0.5 * Math.sin(time * 3.2) : 0.6;
    for (let i = 0; i < items.length; i++) {
      const s = items[i];
      const nd = s.dim + (s.td - s.dim) * k;
      const ng = s.glow + (s.tg - s.glow) * k;
      const changed = Math.abs(nd - s.dim) > 0.002 || Math.abs(ng - s.glow) > 0.002 || s.tg > 0.5;
      s.dim = Math.abs(nd - s.td) < 0.003 ? s.td : nd;
      s.glow = Math.abs(ng - s.tg) < 0.003 ? s.tg : ng;
      if (!changed) continue;
      const g = s.glow > 0.003 ? s.glow * (0.12 + 0.18 * pulse) : 0;
      for (let j = 0; j < s.mats.length; j++) applyVisual(s.mats[j], s.dim, g);
    }
    // tế bào chất: màng trong phát sáng nhẹ
    const tgt = selected === 'cytoplasm' ? 0.4 + 0.5 * pulse : 0;
    cytoGlow += (tgt - cytoGlow) * k;
    membraneMat.userData.cytoHook(cytoGlow);
  }
  return { setSelected, setFocusSet, update, get selected() { return selected; } };
}
