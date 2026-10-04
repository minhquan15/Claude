import { UI, ORG, PATHWAY_STEPS, TOUR_ORDER } from '../data/organelles.js';
import { h } from './dom.js';
import { ICON } from './icons.js';

const iconBtn = (icon, label, onclick, extra = {}) =>
  h('button', { class: 'icon-btn', type: 'button', 'aria-label': label, title: label, html: icon, onclick, ...extra });

/** Thanh công cụ nổi góc trên-phải của khung 3D. */
export function createToolbar({ container, actions }) {
  const labelsBtn = iconBtn(ICON.labels, UI.toolbar.labelsOn, () => actions.toggleLabels(), { 'aria-pressed': 'false' });
  const fsBtn = iconBtn(ICON.fullscreen, UI.toolbar.fullscreen, () => actions.toggleFullscreen());
  const panelBtn = iconBtn(ICON.panel, UI.toolbar.togglePanel, () => actions.togglePanel(), { class: 'icon-btn only-sidebar-narrow' });
  const bar = h('div', { class: 'toolbar', role: 'toolbar', 'aria-label': UI.appTitle },
    labelsBtn,
    iconBtn(ICON.reset, UI.toolbar.reset, () => actions.resetCamera()),
    fsBtn,
    iconBtn(ICON.credits, UI.toolbar.credits, () => actions.showCredits())
  );
  container.append(bar);
  return {
    setLabels(on) {
      labelsBtn.setAttribute('aria-pressed', String(on));
      labelsBtn.setAttribute('aria-label', on ? UI.toolbar.labelsOff : UI.toolbar.labelsOn);
      labelsBtn.title = on ? UI.toolbar.labelsOff : UI.toolbar.labelsOn;
    },
    setFullscreen(on) {
      fsBtn.innerHTML = on ? ICON.exitFullscreen : ICON.fullscreen;
      const t = on ? UI.toolbar.exitFullscreen : UI.toolbar.fullscreen;
      fsBtn.setAttribute('aria-label', t);
      fsBtn.title = t;
    },
  };
}

/** Thanh điều khiển tham quan và đường đi protein (đáy khung 3D). */
export function createBars({ container, tour, pathway }) {
  const tourName = h('strong', { class: 'bar-name' });
  const tourCount = h('span', { class: 'bar-count' });
  const prog = h('i', { class: 'bar-prog' });
  const pauseBtn = h('button', { class: 'icon-btn', type: 'button', html: ICON.pause, onclick: () => tour.toggle() });
  const tourBar = h('div', { class: 'bar', hidden: true, role: 'group', 'aria-label': UI.tools.tour },
    h('div', { class: 'bar-top' }, tourName, tourCount),
    h('div', { class: 'bar-row' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': UI.tour.prev, title: UI.tour.prev, html: ICON.prev, onclick: () => tour.prev() }),
      pauseBtn,
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': UI.tour.next, title: UI.tour.next, html: ICON.next, onclick: () => tour.next() }),
      h('button', { class: 'btn small', type: 'button', onclick: () => tour.stop() }, UI.tour.stop)),
    h('div', { class: 'bar-track', 'aria-hidden': 'true' }, prog)
  );

  const pwTitle = h('strong', { class: 'bar-name' });
  const pwCount = h('span', { class: 'bar-count' });
  const pwText = h('p', { class: 'bar-text' });
  const pwPause = h('button', { class: 'icon-btn', type: 'button', html: ICON.pause, onclick: () => pathway.toggle() });
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, PATHWAY_STEPS.map((s, i) => h('i', { class: 'sdot', 'data-i': i })));
  const pwBar = h('div', { class: 'bar pw', hidden: true, role: 'group', 'aria-label': UI.pathway.heading },
    h('div', { class: 'bar-top' }, pwTitle, pwCount),
    pwText,
    dots,
    h('div', { class: 'bar-row' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': UI.pathway.prev, title: UI.pathway.prev, html: ICON.prev, onclick: () => pathway.prev() }),
      pwPause,
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': UI.pathway.next, title: UI.pathway.next, html: ICON.next, onclick: () => pathway.next() }),
      h('button', { class: 'btn small', type: 'button', onclick: () => pathway.stop() }, UI.pathway.stop))
  );
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite' });
  container.append(tourBar, pwBar, live);

  const setPause = (btn, paused, tl) => {
    btn.innerHTML = paused ? ICON.play : ICON.pause;
    const t = paused ? UI.tour.resume : UI.tour.pause;
    btn.setAttribute('aria-label', t);
    btn.title = t;
  };

  tour.onChange((s) => {
    tourBar.hidden = !s.active;
    if (!s.active) return;
    const id = tour.order[s.index];
    tourName.textContent = ORG[id].name;
    tourCount.textContent = UI.tour.stopOf(s.index + 1, TOUR_ORDER.length);
    setPause(pauseBtn, s.paused);
    live.textContent = `${ORG[id].name}. ${UI.tour.stopOf(s.index + 1, TOUR_ORDER.length)}`;
  });
  pathway.onChange((s) => {
    pwBar.hidden = !s.active;
    if (!s.active) return;
    const st = PATHWAY_STEPS[s.step];
    pwTitle.textContent = st.title;
    pwText.textContent = st.text;
    pwCount.textContent = UI.pathway.stepOf(s.step + 1, PATHWAY_STEPS.length);
    setPause(pwPause, s.paused);
    dots.querySelectorAll('.sdot').forEach((d, i) => d.classList.toggle('on', i === s.step));
    live.textContent = `${UI.pathway.stepOf(s.step + 1, PATHWAY_STEPS.length)}: ${st.title}`;
  });

  return {
    tickTour() { if (!tourBar.hidden) prog.style.transform = `scaleX(${tour.progress().toFixed(3)})`; },
    isTourBarVisible: () => !tourBar.hidden,
  };
}

/** Hộp thoại nguồn tham khảo: nạp CREDITS.md và hiển thị. */
export function createCredits({ root }) {
  const content = h('div', { class: 'credits-body' });
  const closeBtn = h('button', { class: 'btn', type: 'button', onclick: () => close() }, UI.close);
  const dlg = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'credits-title', hidden: true },
    h('div', { class: 'modal-card' },
      h('h2', { id: 'credits-title' }, UI.creditsTitle),
      content,
      closeBtn));
  root.append(dlg);
  let lastFocus = null;
  let loaded = false;

  // chuyển Markdown đơn giản (tiêu đề, danh sách, đậm, liên kết) sang DOM an toàn
  function md(text) {
    const frag = document.createDocumentFragment();
    let ul = null;
    const inline = (s, parent) => {
      const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
      let last = 0, m;
      while ((m = re.exec(s))) {
        if (m.index > last) parent.append(s.slice(last, m.index));
        const tok = m[0];
        if (tok.startsWith('**')) parent.append(h('strong', {}, tok.slice(2, -2)));
        else if (tok.startsWith('`')) parent.append(h('code', {}, tok.slice(1, -1)));
        else {
          const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
          if (/^https?:\/\//.test(mm[2])) parent.append(h('a', { href: mm[2], target: '_blank', rel: 'noopener noreferrer' }, mm[1]));
          else parent.append(mm[1]);
        }
        last = m.index + tok.length;
      }
      if (last < s.length) parent.append(s.slice(last));
      return parent;
    };
    for (const raw of text.split('\n')) {
      const line = raw.trimEnd();
      if (!line.trim()) { ul = null; continue; }
      let m;
      if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) {
        ul = null;
        frag.append(inline(m[2], h('h' + Math.min(6, m[1].length + 1))));
      } else if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) {
        if (!ul) { ul = h('ul'); frag.append(ul); }
        ul.append(inline(m[1], h('li')));
      } else if (/^\s*\|/.test(line)) {
        // bảng markdown: hiện từng dòng gọn
        if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue;
        ul = null;
        const cells = line.split('|').slice(1, -1).map((c) => c.trim());
        frag.append(inline(cells.join(' · '), h('p', { class: 'row' })));
      } else {
        ul = null;
        frag.append(inline(line, h('p')));
      }
    }
    return frag;
  }

  async function open() {
    lastFocus = document.activeElement;
    dlg.hidden = false;
    if (!loaded) {
      try {
        const res = await fetch('CREDITS.md', { cache: 'no-cache' });
        if (!res.ok) throw new Error(res.status);
        content.replaceChildren(md(await res.text()));
        loaded = true;
      } catch (e) {
        content.replaceChildren(h('p', {}, UI.creditsLoadError));
      }
    }
    closeBtn.focus();
  }
  function close() {
    dlg.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      // giữ tiêu điểm trong hộp thoại
      const f = dlg.querySelectorAll('a[href], button');
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  dlg.addEventListener('pointerdown', (e) => { if (e.target === dlg) close(); });
  return { open, close, isOpen: () => !dlg.hidden };
}

/** Màn hình tải có thanh tiến độ. */
export function createLoader(el) {
  const bar = el.querySelector('.loader-bar i');
  const txt = el.querySelector('.loader-text');
  const track = el.querySelector('.loader-bar');
  return {
    set(frac, text) {
      bar.style.transform = `scaleX(${Math.max(0.02, Math.min(1, frac))})`;
      track.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
      if (text) txt.textContent = text;
    },
    hide() {
      el.classList.add('done');
      setTimeout(() => el.remove(), 500);
    },
    fail(title, body) {
      el.classList.add('error');
      el.querySelector('.loader-inner').replaceChildren(h('h2', {}, title), h('p', {}, body));
    },
  };
}

/** Bảng debug (?debug): FPS, tam giác, draw call. */
export function createDebug(container, renderer) {
  const el = h('div', { class: 'debug', 'aria-hidden': 'true' });
  container.append(el);
  let frames = 0, last = performance.now(), fps = 0;
  return {
    el,
    tick() {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        fps = (frames * 1000) / (now - last);
        frames = 0; last = now;
        const i = renderer.info;
        el.textContent = `${fps.toFixed(0)} fps · ${(i.render.triangles / 1000).toFixed(1)}k tri · ${i.render.calls} draw · ${i.memory.geometries} geo · ${i.memory.textures} tex · DPR ${renderer.getPixelRatio().toFixed(2)}`;
      }
    },
    get fps() { return fps; },
  };
}
