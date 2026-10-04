/**
 * Chế độ "Đường đi của protein": chạy vòng lặp pose() của builders/pathway.js,
 * làm mờ các bào quan không liên quan, báo bước hiện tại cho giao diện.
 */
export function createPathwayMode({ world, highlight, cameraRig, reduced }) {
  const pw = world.pathway;
  const st = { active: false, paused: false, t: 0, step: 0 };
  const listeners = [];
  const emit = () => listeners.forEach((f) => f(st));
  const FOCUS = ['rer', 'golgi', 'vesicle', 'membrane'];

  function render() {
    st.step = pw.pose(st.t);
  }
  return {
    state: st,
    steps: pw.steps,
    onChange: (f) => listeners.push(f),
    start() {
      st.active = true;
      st.paused = false;
      st.t = 0;
      pw.group.visible = true;
      highlight.setFocusSet(FOCUS);
      cameraRig.flyToView(pw.frame.target, pw.frame.dir, pw.frame.dist, 1.3);
      render();
      emit();
    },
    stop() {
      st.active = false;
      pw.group.visible = false;
      highlight.setFocusSet(null);
      emit();
    },
    jump(i) {
      st.t = pw.starts[(i + pw.steps.length) % pw.steps.length] + 0.01;
      render();
      emit();
    },
    next() { this.jump(st.step + 1); },
    prev() { this.jump(st.step - 1); },
    toggle() { st.paused = !st.paused; emit(); },
    setTime(t) { st.t = t; render(); emit(); },
    update(dt) {
      if (!st.active) return;
      if (!st.paused) {
        st.t += dt;
        if (st.t >= pw.total) st.t -= pw.total;
      }
      const prev = st.step;
      render();
      if (prev !== st.step) emit();
    },
  };
}
