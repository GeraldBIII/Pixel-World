'use strict';
// ---------- Small shared helpers ----------
const TS = 16; // tile size in pixels

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 1, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
const fbm = (x, y, s) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.1;

// ---------- Canvas / pixel-art helpers ----------
function mk(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  if (fn) fn(g, c);
  return c;
}
function R(g, c, x, y, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function line(g, c, x0, y0, x1, y1) {
  g.fillStyle = c;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function disc(g, cx, cy, r, c) {
  g.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    const v = r * r + r * 0.6 - y * y;
    if (v < 0) continue;
    const w = Math.floor(Math.sqrt(v));
    g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}
function hexRgb(h) { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
// Lighten (amt > 0) or darken (amt < 0). Shadows drift toward blue, highlights toward warm.
function shade(hex, amt) {
  let [r, g, b] = hexRgb(hex);
  if (amt < 0) { const k = 1 + amt; r *= k; g *= k; b = b * k + -amt * 28; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt * 0.7; }
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
// Adds a 1px dark outline around every opaque pixel.
function outlined(src, col = '#26182b') {
  const w = src.width, h = src.height;
  const d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const [r, gg, b] = hexRgb(col);
  return mk(w, h, g => {
    const id = g.createImageData(w, h), o = id.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3]) continue;
      if ((x > 0 && d[i - 1]) || (x < w - 1 && d[i + 7]) || (y > 0 && d[i - w * 4 + 3]) || (y < h - 1 && d[i + w * 4 + 3])) {
        o[i] = r; o[i + 1] = gg; o[i + 2] = b; o[i + 3] = 255;
      }
    }
    g.putImageData(id, 0, 0);
    g.drawImage(src, 0, 0);
  });
}
function mirrorC(c) { return mk(c.width, c.height, g => { g.scale(-1, 1); g.drawImage(c, -c.width, 0); }); }
function whiteC(c) { return mk(c.width, c.height, g => { g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; R(g, '#fff', 0, 0, c.width, c.height); }); }

// ---------- Safe storage ----------
const Store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
