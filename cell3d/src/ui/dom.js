// tiện ích tạo DOM nhỏ gọn
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(c));
  }
  return el;
}

// ---- màu chữ đảm bảo tương phản WCAG AA ----
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
function parse(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function luminance(hex) {
  const [r, g, b] = parse(hex).map((v) => lin(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
/** Làm sáng màu `hex` dần về trắng cho tới khi đạt tương phản >= min với nền `bg`. */
export function textSafe(hex, bg = '#101b33', min = 4.5) {
  let c = parse(hex);
  for (let t = 0; t <= 1.001; t += 0.05) {
    const m = c.map((v) => v + (255 - v) * t);
    if (contrast(toHex(m), bg) >= min) return toHex(m);
  }
  return '#ffffff';
}
/** Chữ đen hay trắng đọc rõ hơn trên nền `hex`. */
export function onColor(hex) {
  return contrast('#0b1426', hex) >= contrast('#ffffff', hex) ? '#0b1426' : '#ffffff';
}
