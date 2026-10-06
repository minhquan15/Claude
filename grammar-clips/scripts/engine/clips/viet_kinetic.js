// Clip · Kinetic type Anh–Việt (dựa trên y5_kinetic_type): một cue = một trang. Từ chính "đập" vào màn hình (lò xo),
// đuôi -s/-es đập thêm một nhịp sau 0.2s, phóng to 1.2x, đổi màu nhấn + gạch chân. Dòng giải thích tiếng Việt trồi lên bên dưới.
// cues: page — text: phần thân ("He play"), data.end: đuôi ("s"), data.key: cụm tô màu nhấn trong sub, data.label: nhãn góc trái,
//       data.pal: [nền, chữ, nhấn], sub: dòng tiếng Việt. Chuyển trang = hai dải màu quét ngang (bắt đầu 0.3s trước at).
CLIPS.viet_kinetic = (() => {
const { clamp, lerp } = U, nfc = s => String(s || '').normalize('NFC');
const MAIN = 'BeVietnamPro-900', SUBF = 'BeVietnamPro-700';
let pages;
return {
  fonts: [MAIN, SUBF],
  init(ctx) {
    const { W, u } = ctx, g = document.createElement('canvas').getContext('2d');
    U.assertGlyphs(MAIN, ctx.cues.map(q => nfc(q.text) + nfc(q.data && q.data.end) + nfc(q.data && q.data.label)).join(''), 'viet_kinetic main');
    U.assertGlyphs(SUBF, ctx.cues.map(q => nfc(q.sub) + nfc(q.data && q.data.label)).join(''), 'viet_kinetic sub');
    pages = ctx.of('page').map(q => {
      const d = q.data || {}, stem = nfc(q.text), end = nfc(d.end), full = stem + end;
      const f = TY.fit(g, full, W * 0.84, 330 * u, MAIN, { maxLines: 1, min: 0.45 });
      const sf = q.sub ? TY.fit(g, nfc(q.sub), W * 0.84, 78 * u, SUBF, { maxLines: 2, min: 0.6, balance: true }) : null;
      return { q, d, stem, end, size: f.size, lines: sf ? sf.lines : [], subSz: sf ? sf.size : 0, pal: d.pal, show: q.at };
    });
  },
  draw(c, t, ctx) {
    const { W, H, u } = ctx;
    let k = 0; pages.forEach((p, i) => { if (t >= p.show - 1e-6) k = i; });
    const P = pages[k], N = pages[k + 1];
    c.fillStyle = P.pal[0]; c.fillRect(0, 0, W, H); dots(c, t, P.pal[1], u, W, H);
    let bump = 1; const l0 = t - P.show; if (l0 >= 0 && l0 < 0.4) bump += 0.015 * Math.exp(-l0 * 22);
    CAM.with(c, { x: W / 2, y: H / 2, z: bump, r: 0 }, cc => page(cc, P, t, ctx));
    if (N) {                                                           // quét màu: 2 dải, dải cuối mang màu nền trang mới
      const p = (t - (N.show - 0.3)) / 0.36;
      if (p > 0 && p < 1) { const mid = P.pal[2], sk = H * 0.35, edge = q => lerp(-sk - 40, W + sk + 40, MO.expoInOut(clamp(q)));
        [mid, N.pal[0]].forEach((col, i) => { const x = edge((p - i * 0.12) / 0.76); c.save(); c.beginPath(); c.moveTo(-sk - 60, 0); c.lineTo(x + sk, 0); c.lineTo(x, H); c.lineTo(-sk - 60, H); c.closePath(); c.clip(); c.fillStyle = col; c.fillRect(0, 0, W, H); c.restore(); }); }
    }
  },
};
function dots(c, t, col, u, W, H) { const g = 64 * u, ox = (t * 36 * u) % g, oy = (t * 18 * u) % g; c.save(); c.globalAlpha = 0.07; c.fillStyle = col; for (let y = -g; y < H + g; y += g) for (let x = -g; x < W + g; x += g) { c.beginPath(); c.arc(x + ox, y + oy, 4 * u, 0, Math.PI * 2); c.fill(); } c.restore(); }
function page(c, P, t, ctx) {
  const { W, H, u } = ctx, [bg, fg, acc] = P.pal, lt = ctx.lt(t, P.show), size = P.size, hasEnd = !!P.end;
  const wStem = TY.width(c, P.stem, size, MAIN), wEnd = hasEnd ? TY.width(c, P.end, size, MAIN) : 0, x0 = W / 2 - (wStem + wEnd) / 2;
  const nL = P.lines.length, gap = size * 0.3, subBlock = nL ? gap + P.subSz * (1.0 + (nL - 1) * 1.15) + P.subSz * 0.3 : 0;   // chừa chỗ cho phần thò xuống (p, y, /) rồi mới tới dòng Việt
  const y = (H - (size * 0.78 + subBlock)) / 2 + size * 0.78;                                                            // căn giữa cả khối (chữ chính + dòng Việt)
  if (P.d.label) TY.rise(c, nfc(P.d.label), 140 * u, 150 * u, MO.at(lt, 0, 0.3), { size: 50 * u, fam: SUBF, color: fg, track: 3 * u, align: 'left' });
  TY.slam(c, P.stem, x0, y, lt, { size, fam: MAIN, color: fg });
  if (hasEnd) {                                                         // đuôi: đập trễ 0.2s, to hơn 1.2x, màu nhấn, gạch chân
    const le = lt - 0.2, ex = x0 + wStem;
    TY.slam(c, P.end, ex, y, le, { size, fam: MAIN, color: acc, from: 2.6, scale: 1 + 0.2 * MO.springHz(Math.max(0, le), 2, 7), ox: ex + wEnd / 2, oy: y - size * 0.36 });
    TY.underline(c, ex, y + size * 0.14, wEnd, le / 0.35, acc, 16 * u);
  }
  P.lines.forEach((ln, i) => {
    const sw = TY.width(c, ln, P.subSz, SUBF), sy = y + gap + P.subSz * (1.0 + i * 1.15), sp = MO.at(lt, 0.4 + i * 0.08, 0.35), so = { size: P.subSz, fam: SUBF, color: fg };
    const key = nfc(P.d.key), ki = key ? ln.indexOf(key) : -1, xs = W / 2 - sw / 2;
    if (ki < 0) return TY.rise(c, ln, xs, sy, sp, so);
    const pre = ln.slice(0, ki), post = ln.slice(ki + key.length), wp = TY.width(c, pre, P.subSz, SUBF), wk = TY.width(c, key, P.subSz, SUBF);
    if (pre) TY.rise(c, pre, xs, sy, sp, so); TY.rise(c, key, xs + wp, sy, sp, { ...so, color: acc }); if (post) TY.rise(c, post, xs + wp + wk, sy, sp, so);
  });
}
})();
