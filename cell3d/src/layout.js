import * as THREE from 'three';
import { ORG } from './data/organelles.js';

// Bố cục chung của tế bào (mọi bộ dựng dùng chung để các quan hệ vị trí luôn nhất quán).
export const SEED = 20240611;

// Bán trục của màng tế bào (hình cầu hơi dẹt)
export const CELL = { a: 10, b: 8.6, c: 9.4 };

export const NUC = {
  center: new THREE.Vector3(...ORG.nucleus.position),
  rInner: 3.2,
  rOuter: 3.4,
};

export const GOLGI = {
  center: new THREE.Vector3(...ORG.golgi.position),
  discs: 6,
  spacing: 0.44,
  radius: 1.5,
};
// hướng "từ nhân tới Golgi" = trục xếp chồng của Golgi (cis -> trans)
export const D_GOLGI = GOLGI.center.clone().sub(NUC.center).normalize();

export const CENTRO = { center: new THREE.Vector3(...ORG.centrosome.position) };

// hướng ưu tiên cho lưới nội chất trơn (xa nhân, phía dưới-trái)
export const D_SER = new THREE.Vector3(-0.67, -0.62, 0.24).normalize();

export const RER_MAX_R = 5.9; // bán kính ngoài của vùng lưới nội chất hạt quanh nhân

// Ellipsoid: bán kính tế bào theo hướng d (d chuẩn hóa) từ gốc.
export function cellRadiusAlong(d) {
  return 1 / Math.sqrt((d.x * d.x) / (CELL.a * CELL.a) + (d.y * d.y) / (CELL.b * CELL.b) + (d.z * d.z) / (CELL.c * CELL.c));
}

// "Giá trị ellipsoid" của điểm p: <1 là bên trong màng.
export function insideCell(p, scale = 1) {
  return (p.x * p.x) / (CELL.a * CELL.a) + (p.y * p.y) / (CELL.b * CELL.b) + (p.z * p.z) / (CELL.c * CELL.c) <= scale * scale;
}

// Giao tia - ellipsoid (tia bắt đầu bên trong). Trả về t > 0.
export function rayEllipsoidExit(o, d, scale = 1) {
  const ax = CELL.a * scale, ay = CELL.b * scale, az = CELL.c * scale;
  const A = (d.x * d.x) / (ax * ax) + (d.y * d.y) / (ay * ay) + (d.z * d.z) / (az * az);
  const B = 2 * ((o.x * d.x) / (ax * ax) + (o.y * d.y) / (ay * ay) + (o.z * d.z) / (az * az));
  const C = (o.x * o.x) / (ax * ax) + (o.y * o.y) / (ay * ay) + (o.z * o.z) / (az * az) - 1;
  const disc = B * B - 4 * A * C;
  return (-B + Math.sqrt(Math.max(0, disc))) / (2 * A);
}

// Pháp tuyến ellipsoid tại điểm p trên mặt
export function ellipsoidNormal(p, out = new THREE.Vector3()) {
  return out.set(p.x / (CELL.a * CELL.a), p.y / (CELL.b * CELL.b), p.z / (CELL.c * CELL.c)).normalize();
}

// Các hình cầu "đã chiếm chỗ": dùng để đặt bào quan không chồng nhau.
export class Occupancy {
  constructor() {
    this.items = []; // {c: Vector3, r}
  }
  add(c, r) {
    this.items.push({ c: c.clone(), r });
  }
  isFree(p, r, margin = 0.1) {
    for (const it of this.items) {
      const rr = it.r + r + margin;
      if (it.c.distanceToSquared(p) < rr * rr) return false;
    }
    return true;
  }
}
