import { ORGANELLES, ORG, UI } from '../data/organelles.js';
import { h } from './dom.js';
import { ICON } from './icons.js';

/**
 * Bảng điều khiển: bottom sheet trên điện thoại dọc, sidebar trên màn hình rộng.
 * Ba tab: Bào quan (danh sách nút bấm), Thông tin (thẻ), Công cụ (cắt lớp, nhãn, tham quan...).
 */
export function createPanel({ root, selection, clipping, labels, tour, pathway, actions }) {
  const tabsDef = [
    ['list', UI.tabs.list],
    ['info', UI.tabs.info],
    ['tools', UI.tabs.tools],
  ];
  const state = { tab: 'list', open: false };

  // ---------- Danh sách ----------
  const listBtns = new Map();
  const list = h('ul', { class: 'org-list', role: 'list' });
  for (const o of ORGANELLES) {
    const btn = h(
      'button',
      {
        class: 'org-btn', type: 'button', 'data-id': o.id, 'aria-pressed': 'false',
        'aria-label': `${o.name} (${o.en})`,
        style: `--c:${o.color}`,
        onclick: () => actions.selectFromUI(o.id),
      },
      h('span', { class: 'dot', 'aria-hidden': 'true' }),
      h('span', { class: 'org-txt' }, h('span', { class: 'org-name' }, o.name), h('span', { class: 'org-en' }, o.en))
    );
    listBtns.set(o.id, btn);
    list.append(h('li', {}, btn));
  }
  const listView = h('section', { class: 'view', id: 'view-list', role: 'tabpanel', 'aria-labelledby': 'tab-list' }, h('p', { class: 'hint' }, UI.listHeading), list);

  // ---------- Thông tin ----------
  const infoBody = h('div', { class: 'info-body' });
  const infoView = h('section', { class: 'view', id: 'view-info', role: 'tabpanel', 'aria-labelledby': 'tab-info' }, infoBody);
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });

  function renderInfo(id) {
    infoBody.innerHTML = '';
    if (!id) {
      infoBody.append(h('p', { class: 'hint' }, UI.infoEmpty));
      return;
    }
    const o = ORG[id];
    infoBody.append(
      h('article', { class: 'card', style: `--c:${o.color}` },
        h('header', {},
          h('h2', {}, o.name),
          h('p', { class: 'en' }, o.en)),
        h('h3', {}, UI.functionLabel),
        h('p', {}, o.function),
        h('h3', {}, UI.funFactLabel),
        h('p', { class: 'fact' }, o.fact),
        h('h3', {}, UI.sizeLabel),
        h('p', { class: 'size' }, o.size),
        h('p', { class: 'scale-note' }, UI.scaleNote),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => actions.clearFromUI() }, UI.clearSelection)
      )
    );
  }

  // ---------- Công cụ ----------
  const slider = h('input', {
    type: 'range', id: 'slice', min: '0', max: '100', step: '1', value: '0',
    'aria-label': UI.tools.slice,
    oninput: (e) => {
      clipping.setPercent(+e.target.value);
      sliceOut.textContent = `${e.target.value}%`;
    },
  });
  const sliceOut = h('output', { for: 'slice', class: 'out' }, '0%');
  const axisBtns = {};
  const axisRow = h('div', { class: 'seg', role: 'group', 'aria-label': UI.tools.sliceAxis });
  for (const [a, label] of [['x', UI.tools.axisX], ['y', UI.tools.axisY], ['z', UI.tools.axisZ]]) {
    const b = h('button', {
      class: 'seg-btn', type: 'button', 'aria-pressed': a === 'z' ? 'true' : 'false', 'data-axis': a,
      onclick: () => {
        clipping.setAxis(a);
        Object.entries(axisBtns).forEach(([k, el]) => el.setAttribute('aria-pressed', String(k === a)));
      },
    }, label);
    axisBtns[a] = b;
    axisRow.append(b);
  }
  const flipBtn = h('button', {
    class: 'btn', type: 'button', 'aria-pressed': 'false',
    onclick: (e) => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', String(on));
      clipping.setFlip(on);
    },
  }, UI.tools.flip);

  const toggleBtn = (text, onclick, key) => h('button', { class: 'btn wide', type: 'button', 'aria-pressed': 'false', 'data-tool': key, onclick }, text);
  const labelsBtn = toggleBtn(UI.tools.labels, () => actions.toggleLabels(), 'labels');
  const tourBtn = toggleBtn(UI.tools.tour, () => actions.toggleTour(), 'tour');
  const pathBtn = toggleBtn(UI.tools.pathway, () => actions.togglePathway(), 'pathway');
  const resetBtn = h('button', { class: 'btn wide', type: 'button', onclick: () => actions.resetCamera() }, UI.tools.reset);
  const fsBtn = h('button', { class: 'btn wide', type: 'button', onclick: () => actions.toggleFullscreen() }, UI.tools.fullscreen);
  const credBtn = h('button', { class: 'btn wide', type: 'button', onclick: () => actions.showCredits() }, UI.tools.credits);

  const toolsView = h('section', { class: 'view', id: 'view-tools', role: 'tabpanel', 'aria-labelledby': 'tab-tools' },
    h('div', { class: 'group' },
      h('label', { for: 'slice', class: 'lbl' }, UI.tools.slice, ' ', sliceOut),
      slider,
      axisRow,
      flipBtn),
    h('div', { class: 'group col' }, labelsBtn, tourBtn, pathBtn),
    h('div', { class: 'group col' }, resetBtn, fsBtn, credBtn)
  );

  // ---------- Khung ----------
  const tabEls = {};
  const tablist = h('div', { class: 'tabs', role: 'tablist', 'aria-label': UI.appTitle });
  for (const [id, label] of tabsDef) {
    const b = h('button', {
      class: 'tab', role: 'tab', id: `tab-${id}`, type: 'button', 'aria-selected': 'false', 'aria-controls': `view-${id}`,
      onclick: () => { setTab(id); setOpen(true); },
      onkeydown: (e) => {
        const i = tabsDef.findIndex((t) => t[0] === id);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabsDef.length) % tabsDef.length;
          setTab(tabsDef[n][0]);
          tabEls[tabsDef[n][0]].focus();
        }
      },
    }, label);
    tabEls[id] = b;
    tablist.append(b);
  }
  const handle = h('button', {
    class: 'sheet-handle', type: 'button', 'aria-label': UI.sheetHandle, 'aria-expanded': 'false', 'aria-controls': 'panel-body',
    onclick: () => setOpen(!state.open),
  }, h('span', { class: 'grip', 'aria-hidden': 'true' }), h('span', { class: 'sheet-title' }, UI.appTitle), h('span', { class: 'chev', html: ICON.chevron }));
  const body = h('div', { class: 'panel-body', id: 'panel-body' }, listView, infoView, toolsView);
  const head = h('header', { class: 'panel-head' }, h('h1', {}, UI.appTitle), h('p', {}, UI.appSubtitle));
  root.append(handle, head, tablist, body, live);

  function setTab(t) {
    state.tab = t;
    for (const [id] of tabsDef) {
      const on = id === t;
      tabEls[id].setAttribute('aria-selected', String(on));
      tabEls[id].tabIndex = on ? 0 : -1;
      document.getElementById(`view-${id}`).hidden = !on;
    }
  }
  function setOpen(v) {
    state.open = v;
    root.dataset.open = v ? 'true' : 'false';
    handle.setAttribute('aria-expanded', String(v));
  }

  selection.onChange((id) => {
    listBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === id)));
    renderInfo(id);
    if (id) {
      live.textContent = UI.selected(ORG[id].name);
      setTab('info');
      setOpen(true);
    } else {
      live.textContent = '';
    }
  });
  tour.onChange((s) => {
    tourBtn.setAttribute('aria-pressed', String(s.active));
    tourBtn.textContent = s.active ? UI.tour.stop : UI.tools.tour;
  });
  pathway.onChange((s) => {
    pathBtn.setAttribute('aria-pressed', String(s.active));
    pathBtn.textContent = s.active ? UI.pathway.stop : UI.tools.pathway;
    if (s.active) setOpen(false); // nhường chỗ cho khung 3D trên điện thoại
  });

  renderInfo(null);
  setTab('list');
  setOpen(false);

  return {
    setTab, setOpen,
    get open() { return state.open; },
    setLabelsPressed(on) {
      labelsBtn.setAttribute('aria-pressed', String(on));
    },
    setFullscreenText(on) { fsBtn.textContent = on ? UI.toolbar.exitFullscreen : UI.tools.fullscreen; },
  };
}
