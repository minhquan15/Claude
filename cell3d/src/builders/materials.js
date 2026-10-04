import * as THREE from 'three';

// Mặt phẳng cắt dùng chung cho mọi vật liệu (clippingPlanes tham chiếu cùng một mảng).
export const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e4);
export const clipPlanes = [clipPlane];

// Uniform dùng chung (thời gian, bật/tắt chuyển động)
export const shared = {
  uTime: { value: 0 },
  uMotion: { value: 1 },
};

// Sổ đăng ký: id bào quan -> các vật liệu (để làm mờ / phát sáng khi chọn)
export const registry = new Map();
export function registerMaterial(orgId, mat) {
  mat.userData.org = orgId;
  if (!registry.has(orgId)) registry.set(orgId, new Set());
  registry.get(orgId).add(mat);
}

const BACK_TINT_KEY = 'backtint-v1';

/**
 * Tạo vật liệu chuẩn. Mọi vật liệu: transparent=true (bật sẵn để làm mờ không phải biên dịch lại),
 * dùng chung mặt phẳng cắt. `inner` => mặt trong (back face) được tô màu đặc, nên khi cắt ngang
 * không thấy chỗ rỗng.
 */
export function createMaterial(orgId, o = {}) {
  const color = new THREE.Color(o.color ?? '#ffffff');
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: o.roughness ?? 0.55,
    metalness: o.metalness ?? 0.0,
    transparent: true,
    opacity: o.opacity ?? 1,
    side: o.double || o.inner ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: o.depthWrite ?? true,
    clippingPlanes: clipPlanes,
    vertexColors: !!o.vertexColors,
    envMapIntensity: o.envMapIntensity ?? 0.9,
    emissive: new THREE.Color(0x000000),
    flatShading: !!o.flat,
  });
  if ((o.double || o.inner) && (o.opacity ?? 1) >= 0.9) mat.forceSinglePass = true; // không cần vẽ hai lượt
  mat.userData.baseOpacity = mat.opacity;
  mat.userData.baseDepthWrite = mat.depthWrite;
  mat.userData.baseColor = color.clone();
  mat.userData.glowColor = new THREE.Color(o.glow ?? color).multiplyScalar(0.9);
  if (o.inner) {
    const inner = new THREE.Color(o.inner === true ? color.clone().lerp(new THREE.Color('#ffffff'), 0.35) : o.inner);
    mat.userData.innerColor = inner;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uInner = { value: inner };
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', 'uniform vec3 uInner;\nvoid main() {')
        .replace(
          '#include <opaque_fragment>',
          `#include <opaque_fragment>
          if (!gl_FrontFacing) {
            float l = dot(gl_FragColor.rgb, vec3(0.333));
            gl_FragColor.rgb = uInner * (0.5 + 0.7 * l);
          }`
        );
    };
    mat.customProgramCacheKey = () => BACK_TINT_KEY;
  }
  if (o.register !== false) registerMaterial(orgId, mat);
  return mat;
}

// Áp dụng trạng thái hiển thị: dim (0..1 độ rõ) và glow (0..1 độ phát sáng)
export function applyVisual(mat, opacityScale, glow) {
  const u = mat.userData;
  if (u.visualHook) {
    u.visualHook(opacityScale, glow);
    return;
  }
  mat.opacity = u.baseOpacity * opacityScale;
  mat.depthWrite = opacityScale < 0.999 ? false : u.baseDepthWrite;
  if (glow > 0) {
    mat.emissive.copy(u.glowColor);
    mat.emissiveIntensity = glow;
  } else {
    mat.emissive.setRGB(0, 0, 0);
    mat.emissiveIntensity = 1;
  }
}
