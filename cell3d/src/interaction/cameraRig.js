import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { easeInOut } from '../util.js';

/**
 * Camera + OrbitControls (damping). Tự viết tween chuyển cảnh để không phụ thuộc thư viện ngoài
 * (không cần GSAP). Khi `reduced` (prefers-reduced-motion) thì chuyển cảnh tức thì.
 */
export function createCameraRig(canvas, { reduced }) {
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.2;
  controls.screenSpacePanning = true;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.7;
  controls.maxPolarAngle = Math.PI;

  const listeners = { interact: [] };
  const tw = { on: false, t: 0, dur: 1, p0: new THREE.Vector3(), p1: new THREE.Vector3(), t0: new THREE.Vector3(), t1: new THREE.Vector3(), done: null };
  const defaultDir = new THREE.Vector3(0.16, 0.2, 1).normalize();
  const state = { fitDist: 40, userMoved: false, atDefault: true };

  controls.addEventListener('start', () => {
    tw.on = false;
    state.userMoved = true;
    state.atDefault = false;
    listeners.interact.forEach((f) => f());
  });

  function fitDistance() {
    const v = THREE.MathUtils.degToRad(camera.fov);
    const h = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
    const R = 10.6;
    return (R / Math.sin(Math.min(v, h) / 2)) * 1.0;
  }

  function setDefault() {
    state.fitDist = fitDistance();
    camera.position.copy(defaultDir).multiplyScalar(state.fitDist);
    controls.target.set(0, 0, 0);
    controls.maxDistance = state.fitDist * 1.5;
    state.atDefault = true;
    controls.update();
  }

  function resize(w, h) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const d = fitDistance();
    controls.maxDistance = d * 1.5;
    if (state.atDefault && !tw.on) setDefault();
    else state.fitDist = d;
  }

  function flyTo(target, position, dur = 1.15, done) {
    state.atDefault = false;
    if (reduced.value || dur <= 0) {
      controls.target.copy(target);
      camera.position.copy(position);
      controls.update();
      tw.on = false;
      done && done();
      return;
    }
    tw.p0.copy(camera.position);
    tw.t0.copy(controls.target);
    tw.p1.copy(position);
    tw.t1.copy(target);
    tw.t = 0;
    tw.dur = dur;
    tw.on = true;
    tw.done = done || null;
  }

  // bay tới điểm `target`, nhìn từ hướng dir ở khoảng cách dist
  function flyToView(target, dir, dist, dur) {
    const pos = new THREE.Vector3().copy(dir).normalize().multiplyScalar(dist).add(target);
    flyTo(target, pos, dur);
  }

  function reset(dur = 1.0) {
    const dist = fitDistance();
    const target = new THREE.Vector3(0, 0, 0);
    flyTo(target, defaultDir.clone().multiplyScalar(dist), dur);
    state.userMoved = false;
    state.atDefault = true;
  }

  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  function update(dt) {
    if (tw.on) {
      tw.t += dt;
      const k = easeInOut(Math.min(1, tw.t / tw.dur));
      camera.position.lerpVectors(tw.p0, tw.p1, k);
      // đi vòng nhẹ để không xuyên qua tâm: nội suy theo hướng + khoảng cách
      controls.target.lerpVectors(tw.t0, tw.t1, k);
      if (tw.t >= tw.dur) {
        tw.on = false;
        if (tw.done) tw.done();
      }
    }
    // giữ điểm nhìn trong tế bào (tránh pan đi mất)
    const t = controls.target;
    const lim = 11;
    if (t.length() > lim) t.setLength(lim);
    controls.update();
  }

  return {
    camera, controls, update, resize, flyTo, flyToView, reset, setDefault,
    isFlying: () => tw.on,
    onInteract: (f) => listeners.interact.push(f),
    state,
  };
}
