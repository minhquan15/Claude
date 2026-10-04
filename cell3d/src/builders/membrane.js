import * as THREE from 'three';
import { CELL } from '../layout.js';
import { ORG } from '../data/organelles.js';
import { clipPlanes, shared, registerMaterial } from './materials.js';

// Hướng "cửa sổ" cắt mặc định trên màng (nhìn vào bên trong từ phía camera mặc định)
export const WINDOW_DIR = new THREE.Vector3(0.12, 0.1, 1).normalize();
export const WINDOW_COS = Math.cos(THREE.MathUtils.degToRad(40));

export function buildMembrane(rng, ctx) {
  const { noise } = ctx;
  const geo = new THREE.SphereGeometry(1, 96, 60);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n = noise.fbm(v.x * 1.5 + 3, v.y * 1.5, v.z * 1.5, 3);
    const r = 1 + 0.045 * n;
    pos.setXYZ(i, v.x * r * CELL.a, v.y * r * CELL.b, v.z * r * CELL.c);
  }
  geo.computeVertexNormals();
  // lưu hướng gốc (đơn vị) để cắt cửa sổ ổn định
  const dirAttr = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.set(v.x / CELL.a, v.y / CELL.b, v.z / CELL.c).normalize();
    dirAttr.set([v.x, v.y, v.z], i * 3);
  }
  geo.setAttribute('aDir', new THREE.BufferAttribute(dirAttr, 3));

  const color = new THREE.Color(ORG.membrane.color);
  const inner = new THREE.Color(ORG.cytoplasm.color);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes: clipPlanes,
    envMapIntensity: 0.9,
  });
  const u = {
    uWin: { value: WINDOW_DIR },
    uWinCos: { value: WINDOW_COS },
    uInner: { value: inner },
    uRim: { value: new THREE.Color('#ffd6e6') },
    uAlpha: { value: 1 },
    uGlow: { value: 0 },
    uCytoGlow: { value: 0 },
    uTime: shared.uTime,
    uMotion: shared.uMotion,
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        'void main() {',
        `attribute vec3 aDir; varying vec3 vDir; uniform float uTime; uniform float uMotion;
         void main() {`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vDir = aDir;
         float wob = sin(aDir.x * 5.0 + uTime * 0.9) * sin(aDir.y * 4.0 - uTime * 0.7) + sin(aDir.z * 6.0 + uTime * 0.6) * 0.6;
         transformed += normal * wob * 0.06 * uMotion;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `varying vec3 vDir; uniform vec3 uWin; uniform float uWinCos; uniform vec3 uInner; uniform vec3 uRim;
         uniform float uAlpha; uniform float uGlow; uniform float uCytoGlow;
         void main() {`
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
         float dWin = dot(normalize(vDir), uWin);
         if (gl_FrontFacing && dWin > uWinCos) discard;`
      )
      .replace(
        '#include <opaque_fragment>',
        `vec3 vd = normalize(vViewPosition);
         float fres = pow(1.0 - abs(dot(normalize(normal), vd)), 2.4);
         vec3 col;
         float a;
         if (gl_FrontFacing) {
           col = outgoingLight + uRim * fres * 0.55;
           a = 0.14 + fres * 0.62;
           float lip = smoothstep(uWinCos - 0.035, uWinCos, dWin);
           a += lip * 0.55;
           col += uRim * lip * 0.4;
           col += uRim * uGlow * (0.35 + fres);
           a = clamp(a + uGlow * 0.3, 0.0, 1.0);
         } else {
           float l = dot(outgoingLight, vec3(0.333));
           col = uInner * (0.5 + 0.8 * l) + uInner * uCytoGlow * 0.5;
           a = 0.34 + fres * 0.3 + uCytoGlow * 0.25;
         }
         gl_FragColor = vec4(col, a * uAlpha);`
      );
  };
  mat.customProgramCacheKey = () => 'membrane-v1';
  mat.userData.baseOpacity = 1;
  mat.userData.baseDepthWrite = false;
  mat.userData.visualHook = (op, glow) => {
    u.uAlpha.value = op;
    u.uGlow.value = glow;
  };
  mat.userData.cytoHook = (g) => (u.uCytoGlow.value = g);
  registerMaterial('membrane', mat);

  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 10; // vẽ sau các bào quan đặc để trong suốt đúng
  mesh.userData.org = 'membrane';
  mesh.userData.isMembrane = true;
  mesh.name = 'membrane';
  mesh.frustumCulled = false;
  ctx.membraneMaterial = mat;
  return mesh;
}
