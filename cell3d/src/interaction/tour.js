import { TOUR_ORDER, TOUR_DWELL_SECONDS } from '../data/organelles.js';

/**
 * Chế độ tham quan: đi lần lượt qua từng bào quan, mỗi điểm dừng ~6 giây.
 * Người dùng chạm/kéo vào cảnh => tạm dừng (không thoát), nút Tiếp tục để đi tiếp.
 */
export function createTour({ goto }) {
  const st = { active: false, paused: false, index: 0, t: 0 };
  const listeners = [];
  const emit = () => listeners.forEach((f) => f(st));

  function go(i) {
    st.index = (i + TOUR_ORDER.length) % TOUR_ORDER.length;
    st.t = 0;
    goto(TOUR_ORDER[st.index]);
    emit();
  }
  return {
    state: st,
    order: TOUR_ORDER,
    onChange: (f) => listeners.push(f),
    start() { st.active = true; st.paused = false; go(0); },
    stop() { st.active = false; st.paused = false; emit(); },
    next() { if (st.active) go(st.index + 1); },
    prev() { if (st.active) go(st.index - 1); },
    pause() { if (st.active && !st.paused) { st.paused = true; emit(); } },
    resume() { if (st.active && st.paused) { st.paused = false; st.t = 0; emit(); } },
    toggle() { st.paused ? this.resume() : this.pause(); },
    update(dt) {
      if (!st.active || st.paused) return;
      st.t += dt;
      if (st.t >= TOUR_DWELL_SECONDS) go(st.index + 1);
    },
    progress: () => Math.min(1, st.t / TOUR_DWELL_SECONDS),
  };
}
