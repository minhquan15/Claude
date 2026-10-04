import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { UI, ORG } from './data/organelles.js';
import { buildWorld } from './builders/world.js';
import { createCameraRig } from './interaction/cameraRig.js';
import { createHighlight } from './interaction/highlight.js';
import { createPicking } from './interaction/picking.js';
import { createClipping } from './interaction/clipping.js';
import { createLabels } from './interaction/labels.js';
import { createTour } from './interaction/tour.js';
import { createPathwayMode } from './interaction/pathwayMode.js';
import { createSelection } from './interaction/selection.js';
import { createPanel } from './ui/panel.js';
import { createToolbar, createBars, createCredits, createLoader, createDebug } from './ui/overlays.js';

const $ = (s) => document.querySelector(s);
const loader = createLoader($('#loader'));
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

document.title = UI.appTitle;
$('#gl').setAttribute('aria-label', UI.canvasLabel);

// --- WebGL có chạy được không? ---
function makeRenderer(canvas) {
  try {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!r.getContext()) throw new Error('no context');
    return r;
  } catch (e) {
    console.info('WebGL không khả dụng:', e && e.message);
    return null;
  }
}

async function start() {
  const canvas = $('#gl');
  const stage = $('#stage');
  const renderer = makeRenderer(canvas);
  if (!renderer) {
    loader.fail(UI.noWebgl.title, UI.noWebgl.body);
    return;
  }
  loader.set(0.05, UI.loadingStages[0]);

  const reduced = { value: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => (reduced.value = e.matches));

  // --- renderer, môi trường, ánh sáng (không dùng bóng đổ) ---
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = false;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xdcecff, 0x4a3a78, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(6, 10, 12);
  scene.add(sun);

  // --- dựng tế bào ---
  const total = UI.loadingStages.length - 1;
  const world = await buildWorld((i) => loader.set(0.1 + (0.8 * i) / 5, UI.loadingStages[Math.min(i, total)]));
  scene.add(world.root);

  // --- tương tác ---
  const rig = createCameraRig(canvas, { reduced });
  rig.camera.userData.target = rig.controls.target;
  const clipping = createClipping(renderer);
  const highlight = createHighlight(world);
  const labels = createLabels({ container: stage, scene, camera: rig.camera, world });
  const selection = createSelection({ world, highlight, cameraRig: rig, labels });
  const tour = createTour({ goto: (id) => selection.select(id) });
  const pathway = createPathwayMode({ world, highlight, cameraRig: rig, reduced });
  const picking = createPicking({
    canvas, camera: rig.camera, world,
    onPick: (id) => {
      if (tour.state.active) tour.pause();
      if (id) selection.select(id);
      else if (selection.current) selection.clear();
    },
  });
  rig.onInteract(() => tour.pause());

  const credits = createCredits({ root: document.body });
  const bars = createBars({ container: stage, tour, pathway });

  const actions = {
    selectFromUI(id) {
      if (pathway.state.active) pathway.stop();
      if (tour.state.active) tour.pause();
      selection.select(id);
      panel.setOpen(true);
    },
    clearFromUI() { selection.clear(); },
    toggleLabels() { setLabels(!labels.enabled); },
    toggleTour() {
      if (tour.state.active) { tour.stop(); return; }
      if (pathway.state.active) pathway.stop();
      tour.start();
      panel.setOpen(true);
    },
    togglePathway() {
      if (pathway.state.active) { pathway.stop(); return; }
      if (tour.state.active) tour.stop();
      selection.clear();
      pathway.start();
      if (reduced.value) { pathway.state.paused = true; pathway.setTime(pathway.state.t); }
    },
    resetCamera() { rig.reset(); },
    toggleFullscreen() {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    },
    showCredits() { credits.open(); },
  };
  const tb = createToolbar({ container: stage, actions });
  const panel = createPanel({ root: $('#panel'), selection, clipping, labels, tour, pathway, actions });

  function setLabels(on) {
    labels.setEnabled(on);
    tb.setLabels(on);
    panel.setLabelsPressed(on);
  }
  setLabels(false);
  document.addEventListener('fullscreenchange', () => {
    const on = !!document.fullscreenElement;
    tb.setFullscreen(on);
    panel.setFullscreenText(on);
  });
  if (!document.fullscreenEnabled) {
    stage.querySelector('[aria-label="' + UI.toolbar.fullscreen + '"]')?.setAttribute('hidden', '');
  }

  // tour: phím mũi tên / Escape
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' && e.target.type !== 'range') return;
    if (tour.state.active) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); tour.next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); tour.prev(); }
      else if (e.key === 'Escape' && !credits.isOpen()) tour.stop();
    } else if (pathway.state.active) {
      if (e.key === 'ArrowRight') { e.preventDefault(); pathway.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); pathway.prev(); }
      else if (e.key === 'Escape' && !credits.isOpen()) pathway.stop();
    } else if (e.key === 'Escape' && selection.current && !credits.isOpen()) selection.clear();
  });

  // --- kích thước ---
  const ro = new ResizeObserver(() => {
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false);
    rig.resize(w, h);
    labels.resize(w, h);
  });
  ro.observe(stage);

  // --- debug ---
  const dbg = DEBUG ? createDebug(stage, renderer) : null;

  // --- vòng lặp ---
  let lastT = performance.now();
  let time = 0, running = true;
  let slowSince = 0, dprStage = 0, fpsEma = 60;
  function frame() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    time += dt;
    const motion = reduced.value ? 0 : 1;
    world.update(time, motion);
    rig.update(dt);
    tour.update(dt);
    pathway.update(dt);
    highlight.update(dt, time, motion);
    labels.update();
    renderer.render(scene, rig.camera);
    labels.render();
    bars.tickTour();
    if (dbg) dbg.tick();
    // tự hạ độ phân giải nếu FPS thấp kéo dài
    fpsEma += (1 / Math.max(dt, 1e-3) - fpsEma) * 0.05;
    if (fpsEma < 40 && dpr > 1.5 && dprStage === 0) {
      slowSince += dt;
      if (slowSince > 2.5) { dpr = 1.5; renderer.setPixelRatio(dpr); dprStage = 1; slowSince = 0; }
    } else if (fpsEma >= 40) slowSince = 0;
  }
  function loop() { frame(); }
  renderer.setAnimationLoop(loop);
  // tạm dừng render khi tab bị ẩn
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { renderer.setAnimationLoop(null); running = false; }
    else { lastT = performance.now(); renderer.setAnimationLoop(loop); running = true; }
  });

  // --- API cho kiểm thử / gỡ lỗi ---
  window.cell3d = {
    THREE, world, renderer, scene, rig, selection, tour, pathway, labels, clipping, picking, panel, highlight, actions,
    info: () => ({ ...renderer.info.render, geometries: renderer.info.memory.geometries, fps: fpsEma, dpr }),
    setTime: (t) => { time = t; },
    get running() { return running; },
  };

  loader.set(1, UI.loadingStages[total]);
  // bắt đầu ở góc nhìn mặc định
  rig.setDefault();
  document.documentElement.dataset.ready = 'true';
  loader.hide();
}

start().catch((e) => {
  console.error(e);
  loader.fail(UI.noWebgl.title, UI.noWebgl.body);
});
