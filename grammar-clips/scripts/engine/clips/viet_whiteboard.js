// Clip · Whiteboard Anh–Việt (dựa trên y3_whiteboard): viết từng dòng bằng bút lông, vẽ mũi tên cam nối chủ ngữ với đuôi động từ.
// cues:
//   title  — text: tiêu đề (mực đen); sub: dòng cam bên dưới
//   row    — data: { base, baseVi, subj, stem, end, vi }
//            base "I play" | baseVi "Tôi chơi" | subj "He" | stem "play" | end "s" | vi "Anh ấy chơi"
//            Vẽ: base → gloss Việt → mũi tên mực → "He play" → đuôi "s" bật cam → mũi tên cong cam (chủ ngữ → đuôi) → gloss Việt
//   note   — text: dòng giải thích tiếng Việt cuối clip
// Mỗi nét bắt đầu ở frame at (hoặc ngay sau nét trước nếu cue đến sớm — nét không bao giờ chồng nhau).
CLIPS.viet_whiteboard = (() => {
const { clamp, lerp } = U;
const INK = '#0A0503', GREY = '#5b5650', ORANGE = '#EF7226', BOARD = '#FBFBFB';
const FONT = 'PatrickHand-400';
let B, OFF, G;
const nfc = s => String(s || '').normalize('NFC');
const quad = (a, c, b, n = 26) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1]]; });
return {
  fonts: [FONT],
  init(ctx) {
    const { W, H, u, FPS } = ctx, g = document.createElement('canvas').getContext('2d');
    const all = ctx.cues.flatMap(q => [q.text, q.sub, ...Object.values(q.data || {})]).filter(v => typeof v === 'string').map(nfc).join('');
    U.assertGlyphs(FONT, all, 'viet_whiteboard');
    const mw = (s, size) => { g.font = `${size}px "${FONT}"`; return [...s].reduce((a, ch) => a + g.measureText(ch).width, 0); };   // cộng từng ký tự: B.text vẽ từng ký tự một nên tổng này khớp với nét viết (measureText cả chuỗi có kerning, sẽ lệch)
    B = DG.board({ ink: INK, lw: 6.5 * u, speed: 2600 * u, font: `"${FONT}"` });
    const lw = 6.5 * u, start = q => B.at(Math.max(B.cur, q.at - 1 / FPS));
    const rows = ctx.cues.filter(q => q.kind === 'row'); let ri = 0;
    for (const q of ctx.cues) {
      const d = q.data || {};
      if (q.kind === 'title') {
        start(q); B.text(nfc(q.text), W / 2, 150 * u, 118 * u, { col: INK, align: 'center', rate: 9 });
        if (q.sub) B.text(nfc(q.sub), W / 2, 262 * u, 76 * u, { col: ORANGE, align: 'center', rate: 14 });
      } else if (q.kind === 'row') {
        const S = 120 * u, GS = 50 * u, y = (ri === 0 ? 480 : 740) * u, xL = 260 * u, xR = 1060 * u; ri++;
        start(q);
        B.text(nfc(d.base), xL, y, S, { col: INK, rate: 12 });
        if (d.baseVi) B.text(nfc(d.baseVi), xL, y + 70 * u, GS, { col: GREY, rate: 16 });
        const ay = y - 42 * u, ax0 = xL + Math.max(mw(d.base, S), 380 * u) + 60 * u, ax1 = xR - 70 * u;   // mũi tên mực (chuyển ngôi), không phải mũi tên cam
        B.line([[ax0, ay], [(ax0 + ax1) / 2, ay + 5 * u], [ax1, ay]], { col: INK, w: lw, speed: 3200 * u });
        B.line([[ax1 - 24 * u, ay - 22 * u], [ax1, ay], [ax1 - 24 * u, ay + 22 * u]], { col: INK, w: lw, speed: 3200 * u, smooth: false });
        const lead = nfc(d.subj) + ' ' + nfc(d.stem), wLead = mw(lead, S), wEnd = mw(nfc(d.end), S), wSubj = mw(nfc(d.subj), S);
        B.text(lead, xR, y, S, { col: INK, rate: 12 });
        B.pop(nfc(d.end), xR + wLead + S * 0.05, y, S, { col: ORANGE, align: 'left', dur: 0.35 });
        // mũi tên cong: từ chủ ngữ lên cao rồi hạ xuống đuôi -s/-es
        const top = y - S * 0.78, from = [xR + wSubj / 2, top], to = [xR + wLead + S * 0.05 + wEnd / 2, top - 4 * u], ctrl = [(from[0] + to[0]) / 2, top - 120 * u];
        B.line(quad(from, ctrl, to), { col: ORANGE, w: lw * 1.1, speed: 2400 * u, amp: 1.0 * u });
        const tg = [to[0] - ctrl[0], to[1] - ctrl[1]], tl = Math.hypot(...tg), ux = tg[0] / tl, uy = tg[1] / tl, hl = 34 * u, rot = (a) => [ux * Math.cos(a) - uy * Math.sin(a), ux * Math.sin(a) + uy * Math.cos(a)];
        const h1 = rot(0.5), h2 = rot(-0.5);
        B.line([[to[0] - h1[0] * hl, to[1] - h1[1] * hl], to, [to[0] - h2[0] * hl, to[1] - h2[1] * hl]], { col: ORANGE, w: lw * 1.1, speed: 3200 * u, smooth: false });
        if (d.vi) B.text(nfc(d.vi), xR, y + 70 * u, GS, { col: GREY, rate: 16 });
      } else if (q.kind === 'note') {
        start(q); B.text(nfc(q.text), W / 2, 960 * u, 54 * u, { col: INK, align: 'center', rate: 19 });
      }
    }
    OFF = [W + 140 * u, H + 280 * u];
  },
  draw(c, t, ctx) {
    const { W, H } = ctx, cam = { x: W / 2, y: H / 2, z: 1 };
    c.fillStyle = BOARD; c.fillRect(0, 0, W, H);
    c.save(); CAM.apply(c, cam); const { tip, col } = B.draw(c, t); c.restore();
    const pen = penAt(t, cam, tip, ctx);
    if (pen) DG.pen(c, pen[0], pen[1], col || B.penColor(t), Math.sin(t * 7) * 0.03);
  },
};
// Vị trí bút (giống y3): đang vẽ → đầu bút; nghỉ ngắn → trượt cung; nghỉ dài → rút ra góc phải dưới rồi vào lại; nét cuối xong → rút ra.
function penAt(t, cam, tip, ctx) {
  if (tip) return CAM.toScreen(cam, tip[0], tip[1]);
  const hs = B.S.filter(s => s.kind !== 'pop' && s.kind !== 'fill' && (s.kind !== 'custom' || s.handed !== false));
  let prev = null, next = null; for (const s of hs) { if (s.t1 <= t) prev = s; else if (s.t0 > t && !next) next = s; }
  if (prev && next && next.t0 - prev.t1 <= 0.6) return B.penAt(t, cam, null);
  const end = s => B.penAt(s.t1, cam, null);
  if (next && next.t0 - t <= 0.3) { const b = CAM.toScreen(cam, ...(next.kind === 'line' ? next.pts[0] : [next.x, next.y - next.size * 0.3])), q = MO.cubicOut(1 - (next.t0 - t) / 0.3); return [lerp(OFF[0], b[0], q), lerp(OFF[1], b[1], q)]; }
  if (prev && t - prev.t1 < 0.35) { const a = end(prev), q = MO.cubicIn((t - prev.t1) / 0.35); return [lerp(a[0], OFF[0], q), lerp(a[1], OFF[1], q)]; }
  return null;
}
})();
