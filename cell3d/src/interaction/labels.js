import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ORGANELLES, TOUR_ORDER } from '../data/organelles.js';
import { clipPlane } from '../builders/materials.js';
import { NUC } from '../layout.js';

const SVGNS = 'http://www.w3.org/2000/svg';

/**
 * Nhãn tên bào quan: CSS2DRenderer (nhãn), SVG (đường chỉ dẫn từ điểm neo trên bào quan tới nhãn).
 * Ẩn nhãn khi: bị nhân che (tia mắt-điểm neo cắt cầu nhân), điểm neo nằm sau tâm tế bào,
 * bị mặt cắt loại bỏ, hoặc không còn chỗ trên màn hình (thuật toán đặt nhãn tham lam, không chồng nhau).
 */
export function createLabels({ container, scene, camera, world }) {
  const renderer = new CSS2DRenderer();
  renderer.domElement.className = 'labels-layer';
  container.appendChild(renderer.domElement);
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'labels-lines');
  svg.setAttribute('aria-hidden', 'true');
  container.appendChild(svg);

  const order = [...TOUR_ORDER];
  const items = [];
  const byId = new Map();
  let enabled = false;
  let selectedId = null;

  for (const o of ORGANELLES) {
    const el = document.createElement('div');
    el.className = 'label';
    el.setAttribute('aria-hidden', 'true'); // danh sách bào quan đã là cách truy cập chính
    const span = document.createElement('span');
    span.className = 'label-in';
    span.textContent = o.name;
    span.style.setProperty('--c', o.color);
    el.appendChild(span);
    const obj = new CSS2DObject(el);
    const bubble = new THREE.Vector3(...o.label);
    obj.position.copy(bubble);
    obj.visible = false;
    scene.add(obj);
    const line = document.createElementNS(SVGNS, 'line');
    const dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('r', '2.6');
    line.setAttribute('stroke', o.color);
    dot.setAttribute('fill', o.color);
    svg.append(line, dot);
    const it = { id: o.id, el, span, obj, bubble, anchor: world.focus[o.id].clone(), line, dot, w: 0, h: 22, rank: order.indexOf(o.id), shown: false, dx: 0, dy: 0 };
    items.push(it);
    byId.set(o.id, it);
  }

  // Đo độ rộng nhãn bằng canvas (phần tử bị ẩn thì offsetWidth = 0)
  const mctx = document.createElement('canvas').getContext('2d');
  function measureAll() {
    mctx.font = '600 11.5px "Be Vietnam Pro", system-ui, sans-serif';
    for (const it of items) {
      it.w = Math.ceil(mctx.measureText(it.span.textContent).width) + 14 + 3 + 6; // chữ + đệm + viền + khe
      it.h = 22 + 4;
    }
  }
  measureAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAll);
  let width = 1, height = 1;
  function resize(w, h) {
    width = w; height = h;
    renderer.setSize(w, h);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  const A = new THREE.Vector3(), B = new THREE.Vector3(), cam = new THREE.Vector3(), seg = new THREE.Vector3(), oc = new THREE.Vector3();
  const pool = Array.from({ length: 24 }, () => ({ x0: 0, y0: 0, x1: 0, y1: 0 })); // hình chữ nhật đã đặt
  const sortList = items.slice().sort((a, b) => a.rank - b.rank);
  const OFFS = [[0, 0], [0, -26], [0, 26], [0, -52], [0, 52], [46, 0], [-46, 0], [46, -26], [-46, 26], [46, 26], [-46, -26], [0, -78], [0, 78]];

  function occludedByNucleus(it) {
    if (it.id === 'nucleus' || it.id === 'nucleolus') return false;
    // đoạn thẳng cam -> anchor cắt cầu nhân?
    seg.subVectors(it.anchor, cam);
    const L = seg.length();
    seg.multiplyScalar(1 / L);
    oc.subVectors(cam, NUC.center);
    const b = oc.dot(seg);
    const c = oc.lengthSq() - 3.25 * 3.25;
    const disc = b * b - c;
    if (disc < 0) return false;
    const t = -b - Math.sqrt(disc);
    return t > 0 && t < L - 0.2; // điểm vào nhân nằm giữa mắt và anchor
  }

  function update() {
    camera.getWorldPosition(cam);
    const target = camera.userData.target;
    if (!enabled) {
      for (const it of items) if (it.shown) hide(it);
      return;
    }
    let np = 0;
    // thứ tự ưu tiên: nhãn bào quan đang chọn trước, rồi theo thứ tự tham quan
    const list = sortList;
    for (let n = -1; n < list.length; n++) {
      const it = n < 0 ? (selectedId ? byId.get(selectedId) : null) : list[n];
      if (!it || (n >= 0 && it.id === selectedId)) continue;
      // điều kiện ẩn
      let ok = clipPlane.distanceToPoint(it.anchor) >= 0 && clipPlane.distanceToPoint(it.bubble) >= 0;
      if (ok) {
        // ở phía sau tâm tế bào (xa camera) -> ẩn
        const toCam = B.subVectors(cam, target).normalize();
        if (A.subVectors(it.anchor, target).dot(toCam) < -2.2) ok = false;
      }
      if (ok && occludedByNucleus(it)) ok = false;
      let sx = 0, sy = 0, ax = 0, ay = 0;
      if (ok) {
        B.copy(it.bubble).project(camera);
        if (B.z > 1 || B.z < -1) ok = false;
        sx = (B.x * 0.5 + 0.5) * width;
        sy = (-B.y * 0.5 + 0.5) * height;
        A.copy(it.anchor).project(camera);
        ax = (A.x * 0.5 + 0.5) * width;
        ay = (-A.y * 0.5 + 0.5) * height;
        if (A.z > 1) ok = false;
      }
      if (ok) {
        // tìm vị trí không chồng
        let found = false, fx = 0, fy = 0;
        for (let k = 0; k < OFFS.length && !found; k++) {
          const cx = sx + OFFS[k][0], cy = sy + OFFS[k][1];
          const x0 = cx - it.w / 2, x1 = cx + it.w / 2, y0 = cy - it.h / 2, y1 = cy + it.h / 2;
          if (x0 < 4 || x1 > width - 4 || y0 < 4 || y1 > height - 4) continue;
          let clash = false;
          for (let p = 0; p < np; p++) {
            const r = pool[p];
            if (x0 < r.x1 && x1 > r.x0 && y0 < r.y1 && y1 > r.y0) { clash = true; break; }
          }
          if (!clash) {
            found = true; fx = cx; fy = cy;
            const r = pool[np++];
            r.x0 = x0; r.y0 = y0; r.x1 = x1; r.y1 = y1;
          }
        }
        if (!found) ok = false;
        else {
          it.dx = fx - sx; it.dy = fy - sy;
          show(it, fx, fy, ax, ay);
        }
      }
      if (!ok && it.shown) hide(it);
    }
  }
  function show(it, fx, fy, ax, ay) {
    if (!it.shown) {
      it.shown = true;
      it.obj.visible = true;
      it.line.style.display = '';
      it.dot.style.display = '';
    }
    it.span.style.transform = `translate(${it.dx.toFixed(1)}px, ${it.dy.toFixed(1)}px)`;
    it.span.classList.toggle('sel', it.id === selectedId);
    it.line.setAttribute('x1', ax.toFixed(1));
    it.line.setAttribute('y1', ay.toFixed(1));
    it.line.setAttribute('x2', fx.toFixed(1));
    it.line.setAttribute('y2', fy.toFixed(1));
    it.dot.setAttribute('cx', ax.toFixed(1));
    it.dot.setAttribute('cy', ay.toFixed(1));
  }
  function hide(it) {
    it.shown = false;
    it.obj.visible = false;
    it.line.style.display = 'none';
    it.dot.style.display = 'none';
  }
  items.forEach(hide);

  return {
    update,
    render: () => renderer.render(scene, camera),
    resize,
    setEnabled(v) {
      enabled = v;
      renderer.domElement.style.display = v ? '' : 'none';
      svg.style.display = v ? '' : 'none';
    },
    get enabled() { return enabled; },
    setSelected(id) { selectedId = id; },
    visibleCount: () => items.filter((i) => i.shown).length,
    domElement: renderer.domElement,
  };
}
