'use strict';
// All art is generated in code at startup. To use your own PNGs later, replace
// entries in SPR / SEAS / ICONS / CHAR with loaded images of the same size.
const SPR = {}, ICONS = {}, ICON_URL = {}, CHAR = {}, PORTRAIT_URL = {};
let SEAS = null;
const seasonCache = {};

const SEASON_PAL = [
  { grass: '#68b84a', forest: '#3f8a45', leaf: '#3c9a46', leaf2: '#62c05a', pine: '#2f6e45', weed: '#4f9a3a', bush: '#3f8f45', blossom: '#ffb8d8', flowers: ['#ffd85a', '#ff8fb8', '#ffffff'] },
  { grass: '#58a83c', forest: '#357a3a', leaf: '#2f8a3c', leaf2: '#4eae46', pine: '#2a6440', weed: '#468f34', bush: '#357f3d', berries: '#e0405a', flowers: ['#ff6a5a', '#ffd85a', '#7ab8ff'] },
  { grass: '#a9a04a', forest: '#7a7a3a', leaf: '#d0762c', leaf2: '#eaa83c', pine: '#3a6440', weed: '#9a8a3a', bush: '#b8702c', flowers: ['#e8a23c', '#c8503a', '#f0d27a'] },
  { grass: '#e6eef5', forest: '#d2dde8', leaf: null, leaf2: null, pine: '#3a5a50', weed: '#a8b0b8', bush: '#8aa0a0', snow: true, flowers: [] },
];

function speckle(g, base, seed, dkAmt, ltAmt, pd, pl) {
  const dk = shade(base, -dkAmt), lt = shade(base, ltAmt);
  R(g, base, 0, 0, 16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = hash2(x, y, seed);
    if (h < pd) R(g, dk, x, y); else if (h > 1 - pl) R(g, lt, x, y);
  }
  return [dk, lt];
}

// ---------- Seasonal sprites ----------
function buildSeason(si) {
  if (seasonCache[si]) return seasonCache[si];
  const p = SEASON_PAL[si], out = {};
  out.grass = [0, 1, 2, 3].map(v => mk(16, 16, g => {
    const [dk, lt] = speckle(g, p.grass, 11 + v * 7, 0.12, 0.12, 0.06, 0.04);
    if (!p.snow) {
      for (let i = 0; i < 5; i++) {
        const x = 1 + Math.floor(hash2(i, v, 3) * 14), y = 2 + Math.floor(hash2(v, i, 4) * 12);
        R(g, dk, x, y, 1, 2); R(g, lt, x + 1, y - 1, 1, 1);
      }
    } else {
      for (let i = 0; i < 4; i++) R(g, '#ffffff', Math.floor(hash2(i, v, 5) * 16), Math.floor(hash2(v, i, 6) * 16));
      R(g, '#c8d6e4', Math.floor(hash2(9, v, 5) * 14), Math.floor(hash2(v, 9, 6) * 14), 2, 1);
    }
    if (v === 3 && p.flowers.length) {
      for (let i = 0; i < 3; i++) {
        const x = 2 + Math.floor(hash2(i, 7, 8) * 11), y = 2 + Math.floor(hash2(7, i, 8) * 11), c = p.flowers[i % p.flowers.length];
        R(g, c, x - 1, y); R(g, c, x + 1, y); R(g, c, x, y - 1); R(g, c, x, y + 1); R(g, '#fff2a0', x, y);
      }
    }
  }));
  out.forest = [0, 1, 2].map(v => mk(16, 16, g => {
    speckle(g, p.forest, 21 + v, 0.15, 0.1, 0.08, 0.04);
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(hash2(i, v, 22) * 14), y = Math.floor(hash2(v, i, 23) * 15);
      R(g, p.snow ? '#ffffff' : shade(p.forest, -0.3), x, y, 2, 1);
    }
  }));
  // Highland plateau above the cliffs, and the cliff face itself (0 = top lip, 1 = bottom)
  const hi = p.snow ? '#e4ecf3' : '#8a7f72', lip = p.snow ? '#ffffff' : p.grass;
  out.plateau = [0, 1].map(v => mk(16, 16, g => {
    speckle(g, hi, 80 + v, 0.14, 0.1, 0.1, 0.05);
    R(g, shade(hi, -0.2), Math.floor(hash2(v, 1, 84) * 10), 3 + v * 6, 5, 1);
    for (let k = 0; k < 3; k++) { const x = Math.floor(hash2(k, v, 81) * 14), y = Math.floor(hash2(v, k, 82) * 14); R(g, p.snow ? '#ffffff' : p.weed, x, y, 2, 1); R(g, p.snow ? '#ffffff' : p.weed, x, y - 1); }
  }));
  const face = (g, top) => {
    R(g, '#7d7064', 0, 0, 16, 16);
    for (const y of [4, 9, 14]) { R(g, '#655a50', 0, y, 16, 1); R(g, '#968878', 0, y - 1, 16, 1); }
    for (let k = 0; k < 4; k++) { const x = Math.floor(hash2(k, top ? 1 : 2, 83) * 15); R(g, '#5a5048', x, 1 + k * 4, 1, 3); }
    if (top) { R(g, lip, 0, 0, 16, 3); R(g, shade(lip, -0.3), 0, 3, 16, 1); for (let x = 1; x < 16; x += 4) R(g, lip, x, 3, 2, 1); }
    else R(g, 'rgba(30,20,30,.35)', 0, 13, 16, 3);
  };
  out.cliff = [mk(16, 16, g => face(g, true)), mk(16, 16, g => face(g, false))];
  // East-facing wall for the western cliff
  out.cliffSide = mk(16, 16, g => {
    R(g, '#7d7064', 0, 0, 16, 16);
    for (const x of [4, 9, 13]) { R(g, '#655a50', x, 0, 1, 16); R(g, '#968878', x - 1, 0, 1, 16); }
    for (let k = 0; k < 4; k++) R(g, '#5a5048', 1 + k * 4, Math.floor(hash2(k, 3, 83) * 13), 3, 1);
    R(g, lip, 0, 0, 3, 16); R(g, shade(lip, -0.3), 3, 0, 1, 16);
    R(g, 'rgba(30,20,30,.3)', 14, 0, 2, 16);
  });
  out.oak = oakSprite(p, si);
  out.pine = pineSprite(p);
  out.bush = outlined(mk(16, 16, g => {
    const B = p.bush;
    disc(g, 8, 10, 6, shade(B, -0.25)); disc(g, 8, 9, 5, B); disc(g, 6, 7, 2, shade(B, 0.2));
    if (p.berries) { R(g, p.berries, 4, 10, 2, 2); R(g, p.berries, 10, 8, 2, 2); R(g, p.berries, 8, 12, 2, 2); R(g, '#ffd0d8', 4, 10); R(g, '#ffd0d8', 10, 8); }
    if (p.snow) { R(g, '#ffffff', 4, 4, 8, 2); R(g, '#ffffff', 3, 6, 2, 1); R(g, '#ffffff', 11, 6, 2, 1); }
  }));
  out.weed = outlined(mk(16, 16, g => {
    const c = p.weed, d = shade(c, -0.25);
    line(g, c, 4, 14, 3, 8); line(g, c, 6, 14, 7, 6); line(g, d, 8, 14, 10, 8); line(g, c, 10, 14, 12, 9); line(g, d, 6, 14, 5, 10);
    R(g, shade(c, 0.25), 7, 6); R(g, shade(c, 0.25), 3, 8);
  }));
  seasonCache[si] = out;
  return out;
}

// Trees are drawn big: a 48x56 oak and a 40x60 pine, rooted in a single tile.
function oakSprite(p, si) {
  return outlined(mk(48, 56, g => {
    const T = '#6b4429', T2 = '#8c5a35', T3 = '#4b2e1c';
    R(g, T, 20, 34, 8, 19); R(g, T2, 21, 34, 3, 19); R(g, T3, 27, 34, 1, 19);
    R(g, T, 16, 51, 5, 3); R(g, T, 27, 51, 5, 3); R(g, T2, 17, 51, 2, 1);
    if (!p.leaf) {
      for (const [a, b, c, d] of [[22, 36, 10, 14], [23, 36, 11, 14], [25, 36, 37, 12], [26, 36, 38, 12], [23, 30, 23, 6], [24, 30, 24, 6], [17, 22, 7, 17], [31, 21, 42, 17], [12, 17, 9, 9], [35, 15, 39, 8]]) line(g, T, a, b, c, d);
      for (const [x, y, w] of [[9, 13, 4], [35, 11, 4], [22, 5, 3], [5, 16, 3], [40, 16, 3], [14, 8, 3]]) R(g, '#ffffff', x, y, w, 1);
      return;
    }
    const L = p.leaf, L2 = p.leaf2, LD = shade(L, -0.3);
    disc(g, 24, 24, 18, LD); disc(g, 12, 28, 11, LD); disc(g, 36, 28, 11, LD);
    disc(g, 24, 21, 17, L); disc(g, 13, 25, 10, L); disc(g, 35, 25, 10, L);
    disc(g, 19, 14, 8, L2); disc(g, 31, 12, 5, L2); disc(g, 11, 21, 4, L2);
    for (let i = 0; i < 110; i++) {
      const x = 6 + Math.floor(hash2(i, 1, si) * 36), y = 4 + Math.floor(hash2(i, 2, si) * 34);
      if ((x - 24) ** 2 + (y - 22) ** 2 < 250) R(g, hash2(i, 3, si) < 0.5 ? LD : L2, x, y, hash2(i, 4, si) < 0.3 ? 2 : 1, 1);
    }
    if (p.blossom) for (let i = 0; i < 16; i++) R(g, p.blossom, 9 + Math.floor(hash2(i, 4, 1) * 30), 7 + Math.floor(hash2(i, 5, 1) * 26));
    if (p.berries) for (let i = 0; i < 8; i++) R(g, p.berries, 10 + Math.floor(hash2(i, 6, 1) * 28), 12 + Math.floor(hash2(i, 7, 1) * 22), 2, 2);
  }));
}

function pineSprite(p) {
  return outlined(mk(40, 60, g => {
    R(g, '#5a3a24', 18, 49, 5, 10); R(g, '#734a2c', 19, 49, 1, 10);
    const C = p.pine, CL = shade(C, 0.18), CD = shade(C, -0.28);
    for (const [t, b, mw] of [[2, 21, 9], [13, 36, 14], [25, 50, 19]]) {
      for (let y = t; y <= b; y++) {
        const hw = Math.max(1, Math.round(mw * (y - t + 1) / (b - t + 1)));
        R(g, C, 20 - hw, y, hw * 2, 1);
        R(g, CL, 20 - hw, y, Math.max(1, Math.floor(hw * 0.6)), 1);
        R(g, CD, 20 + Math.floor(hw * 0.4), y, hw - Math.floor(hw * 0.4), 1);
        if (y === b || y === b - 1) R(g, CD, 20 - hw, y, hw * 2, 1);
        if (p.snow && y - t < 3) R(g, '#ffffff', 20 - hw, y, hw * 2, 1);
      }
    }
  }));
}

// ---------- Static sprites ----------
function buildStatic() {
  // Ground
  SPR.path = [0, 1, 2].map(v => mk(16, 16, g => {
    speckle(g, '#b38e5c', 40 + v, 0.14, 0.1, 0.08, 0.05);
    for (let k = 0; k < 3; k++) {
      const x = 1 + Math.floor(hash2(k, v, 41) * 13), y = 1 + Math.floor(hash2(v, k, 42) * 13);
      R(g, '#8f6d45', x, y + 1, 2, 1); R(g, '#d2b07c', x, y, 2, 1);
    }
  }));
  SPR.sand = [0, 1].map(v => mk(16, 16, g => { speckle(g, '#e2cb90', 50 + v, 0.08, 0.08, 0.08, 0.06); }));
  SPR.rocky = [0, 1, 2].map(v => mk(16, 16, g => {
    speckle(g, '#8c8579', 60 + v, 0.12, 0.1, 0.08, 0.05);
    if (v === 1) { line(g, '#6e685e', 3, 4, 7, 8); line(g, '#6e685e', 7, 8, 6, 12); }
    if (v === 2) { R(g, '#a59e92', 9, 5, 3, 2); R(g, '#6e685e', 9, 7, 3, 1); }
  }));
  SPR.plaza = mk(16, 16, g => {
    R(g, '#aba3b6', 0, 0, 16, 16);
    for (let row = 0; row < 4; row++) {
      const y = row * 4, off = row % 2 ? 4 : 0;
      R(g, '#8b8398', 0, y + 3, 16, 1);
      for (let x = off; x < 16; x += 8) R(g, '#8b8398', x, y, 1, 3);
      R(g, '#c3bccd', off + 1, y, 3, 1);
    }
  });
  const tilled = (b, d, l) => mk(16, 16, g => {
    R(g, b, 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) { if (y % 4 === 3) R(g, d, 0, y, 16, 1); else if (y % 4 === 0) R(g, l, 0, y, 16, 1); }
    for (let i = 0; i < 10; i++) R(g, d, Math.floor(hash2(i, 1, 70) * 16), Math.floor(hash2(i, 2, 70) * 16));
  });
  SPR.tilled = tilled('#76502f', '#5a3b22', '#8a6240');
  SPR.tilledWet = tilled('#4f3624', '#3b2819', '#5f4330');
  SPR.water = [0, 1, 2].map(f => mk(16, 16, g => {
    R(g, '#3a78c8', 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash2(x, y, 77) < 0.06) R(g, '#336cb8', x, y);
    for (let i = 0; i < 3; i++) {
      const y = (i * 5 + f * 2) % 15 + 1, x = Math.floor(hash2(i, f, 5) * 10);
      R(g, '#79b4ee', x, y, 4, 1); R(g, '#5a98dc', x + 4, y, 2, 1);
    }
  }));
  SPR.waterDeep = [0, 1, 2].map(f => mk(16, 16, g => {
    R(g, '#2c62b0', 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash2(x, y, 78) < 0.05) R(g, '#27579e', x, y);
    for (let i = 0; i < 2; i++) { const y = (i * 7 + f * 2) % 15 + 1, x = Math.floor(hash2(i, f, 6) * 10); R(g, '#4f8ad4', x, y, 5, 1); }
  }));
  SPR.falls = [0, 1, 2].map(f => mk(16, 16, g => {
    R(g, '#8cc4f4', 0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      const off = Math.floor(hash2(x, 0, 90) * 16);
      for (let y = 0; y < 16; y++) {
        const v = (y + off - f * 5 + 48) % 16;
        if (v < 5) R(g, '#ffffff', x, y); else if (v < 8) R(g, '#c8e6ff', x, y); else if (v > 13) R(g, '#5fa0e0', x, y);
      }
    }
  }));
  SPR.bridge = mk(16, 16, g => {
    R(g, '#a36f3c', 0, 0, 16, 16);
    for (let x = 0; x < 16; x += 4) { R(g, '#7a4f2a', x, 0, 1, 16); R(g, '#bd8650', x + 1, 0, 1, 16); }
    R(g, '#5e3a20', 0, 0, 16, 2); R(g, '#5e3a20', 0, 14, 16, 2);
    R(g, '#3e2614', 3, 6); R(g, '#3e2614', 11, 9);
  });

  // World objects
  const rockBase = (g, c) => { disc(g, 8, 10, 5, shade(c, -0.25)); disc(g, 7, 9, 5, c); disc(g, 6, 8, 2, shade(c, 0.2)); R(g, shade(c, -0.35), 3, 14, 10, 1); };
  SPR.rock = outlined(mk(16, 16, g => rockBase(g, '#8e8a99')));
  SPR.boulder = outlined(mk(16, 16, g => {
    disc(g, 8, 9, 7, '#6c6658'); disc(g, 7, 8, 6, '#8a8272'); disc(g, 5, 6, 2, '#a8a090');
    R(g, '#5a5448', 9, 9, 3, 1); R(g, '#5a5448', 10, 10, 1, 2);
  }));
  SPR.crystal = outlined(mk(16, 16, g => {
    rockBase(g, '#6f6a80');
    R(g, '#9a6aff', 6, 2, 3, 9); R(g, '#c8a8ff', 6, 2, 1, 8); R(g, '#9a6aff', 7, 1);
    R(g, '#62d8ff', 9, 5, 3, 6); R(g, '#b8f2ff', 9, 5, 1, 5); R(g, '#62d8ff', 10, 4);
    R(g, '#b48cff', 3, 6, 2, 5); R(g, '#ffffff', 7, 3, 1, 2);
  }));
  SPR.ore = outlined(mk(16, 16, g => {
    rockBase(g, '#7a7068');
    R(g, '#f0b84a', 5, 7, 2, 2); R(g, '#ffe08a', 5, 7); R(g, '#f0b84a', 9, 10, 2, 1); R(g, '#f0b84a', 8, 6); R(g, '#ffe08a', 10, 8);
  }));
  SPR.stump = outlined(mk(16, 16, g => {
    R(g, '#6b4429', 3, 7, 10, 7); R(g, '#8c5a35', 4, 7, 2, 7); R(g, '#c49a62', 3, 5, 10, 3); R(g, '#a87c48', 5, 6, 6, 1);
    R(g, '#4b2e1c', 3, 13, 10, 1); R(g, '#6b4429', 2, 12, 2, 2); R(g, '#6b4429', 12, 12, 2, 2);
  }));
  SPR.twig = outlined(mk(16, 16, g => {
    line(g, '#7a5030', 3, 12, 12, 8); line(g, '#9a6a40', 3, 11, 12, 7); line(g, '#7a5030', 7, 10, 9, 13); R(g, '#5a9a3a', 12, 6, 2, 1);
  }));
  SPR.cap = outlined(mk(16, 16, g => {
    R(g, '#efe2c8', 7, 9, 3, 5); R(g, '#cfc0a0', 9, 9, 1, 5);
    const c = '#c0405a';
    R(g, c, 4, 6, 9, 3); R(g, c, 5, 5, 7, 1); R(g, c, 6, 4, 5, 1); R(g, shade(c, -0.3), 4, 9, 9, 1);
    R(g, '#ffffff', 6, 5); R(g, '#ffffff', 9, 6, 2, 1); R(g, '#ffffff', 5, 7);
  }));
  SPR.dew = outlined(mk(16, 16, g => {
    R(g, '#4a8a3a', 7, 8, 1, 6); R(g, '#5aa04a', 5, 11, 2, 1); R(g, '#5aa04a', 8, 10, 2, 1);
    R(g, '#7ab8ff', 6, 3, 3, 5); R(g, '#7ab8ff', 5, 4, 5, 3); R(g, '#a8d4ff', 6, 4, 1, 1); R(g, '#fff2a0', 7, 5); R(g, '#e8f6ff', 10, 3);
  }));
  SPR.glow = outlined(mk(16, 16, g => {
    R(g, '#d8f0e8', 4, 10, 1, 4); R(g, '#d8f0e8', 10, 9, 1, 5); R(g, '#d8f0e8', 7, 11, 1, 3);
    R(g, '#5ff0d8', 3, 8, 3, 2); R(g, '#5ff0d8', 9, 7, 3, 2); R(g, '#5ff0d8', 6, 9, 3, 2);
    R(g, '#c8fff4', 3, 8); R(g, '#c8fff4', 9, 7); R(g, '#c8fff4', 6, 9);
  }), '#16303a');
  SPR.fence = [];
  for (let m = 0; m < 16; m++) {
    SPR.fence[m] = outlined(mk(16, 20, g => {
      const W1 = '#9a6a3a', W2 = '#c08a50', W3 = '#6a4424';
      if (m & 1) { R(g, W1, 0, 7, 7, 2); R(g, W2, 0, 7, 7, 1); R(g, W1, 0, 12, 7, 2); }
      if (m & 2) { R(g, W1, 9, 7, 7, 2); R(g, W2, 9, 7, 7, 1); R(g, W1, 9, 12, 7, 2); }
      if (m & 4) R(g, W1, 7, 0, 2, 5);
      if (m & 8) R(g, W1, 7, 17, 2, 3);
      R(g, W1, 6, 3, 4, 15); R(g, W2, 6, 3, 1, 15); R(g, W3, 9, 3, 1, 15); R(g, W2, 6, 3, 4, 1);
    }));
  }
  SPR.sprinkler = outlined(mk(16, 16, g => {
    disc(g, 8, 10, 5, '#6a6478'); disc(g, 8, 9, 4, '#9a94a8');
    R(g, '#6fe3c8', 7, 6, 2, 6); R(g, '#6fe3c8', 5, 8, 6, 2); R(g, '#d8fff6', 7, 8, 2, 2);
  }));
  SPR.lantern = outlined(mk(16, 24, g => {
    R(g, '#3a2a2a', 7, 10, 2, 13); R(g, '#3a2a2a', 5, 22, 6, 2);
    R(g, '#2a1f2f', 4, 3, 8, 8); R(g, '#ffd86a', 5, 4, 6, 6); R(g, '#fff2c0', 6, 5, 2, 3);
    R(g, '#2a1f2f', 3, 2, 10, 1); R(g, '#2a1f2f', 5, 1, 6, 1);
  }));
  SPR.lamp = outlined(mk(16, 32, g => {
    R(g, '#2f2a3a', 7, 9, 2, 21); R(g, '#2f2a3a', 5, 29, 6, 3); R(g, '#4a4258', 7, 9, 1, 21);
    R(g, '#2f2a3a', 4, 1, 8, 9); R(g, '#ffe9a0', 5, 2, 6, 7); R(g, '#fffbe0', 6, 3, 2, 3);
    R(g, '#2f2a3a', 3, 0, 10, 1); R(g, '#2f2a3a', 7, 5, 2, 1);
  }));
  SPR.crate = outlined(mk(16, 16, g => {
    R(g, '#8a5a30', 1, 5, 14, 10); R(g, '#a8743e', 1, 6, 14, 1); R(g, '#6a4222', 1, 10, 14, 1);
    R(g, '#c08a50', 0, 2, 16, 4); R(g, '#e0a860', 0, 2, 16, 1); R(g, '#5a3a22', 7, 4, 2, 4); R(g, '#f0c050', 7, 6, 2, 2);
    R(g, '#6fe3c8', 3, 12, 2, 2); R(g, '#6fe3c8', 11, 12, 2, 2);
  }));
  SPR.sign = outlined(mk(16, 16, g => {
    R(g, '#6b4429', 7, 9, 2, 6); R(g, '#8c5a35', 2, 3, 12, 7); R(g, '#b07a45', 2, 3, 12, 1);
    R(g, '#5a3a22', 4, 5, 8, 1); R(g, '#5a3a22', 4, 7, 6, 1);
  }));
  SPR.shadow = mk(12, 4, g => { g.fillStyle = 'rgba(20,10,30,.32)'; g.fillRect(2, 0, 8, 4); g.fillRect(0, 1, 12, 2); });

  // Buildings
  SPR.bld = {
    farmhouse: buildingSprite({ w: 6, h: 4, roof: '#b8483a', wall: '#e8d2a8', trim: '#7a4a2a', door: 3, windows: [1, 4], chimney: 4 }),
    seedshop: buildingSprite({ w: 5, h: 4, roof: '#4f9a5a', wall: '#f0dcb0', trim: '#7a5030', door: 2, windows: [0.9, 3.1], awning: '#5fbf4a', sign: 'seed' }),
    apothecary: buildingSprite({ w: 5, h: 4, roof: '#6a4aa8', wall: '#cfc4dc', trim: '#4a3060', door: 2, windows: [0.9, 3.1], glass: '#9ff0c0', stone: true, sign: 'potion' }),
    forge: buildingSprite({ w: 5, h: 4, roof: '#5a5a6a', wall: '#b8a088', trim: '#5a4030', door: 1, windows: [3], chimney: 3, stone: true, sign: 'anvil', glass: '#ffb070' }),
    elderhouse: buildingSprite({ w: 5, h: 4, roof: '#3f6aa8', wall: '#e8dcc0', trim: '#5a4030', door: 2, windows: [0.9, 3.1] }),
    cottage: buildingSprite({ w: 4, h: 3, roof: '#c8783a', wall: '#e8d8b8', trim: '#6a4428', door: 1, windows: [2.3] }),
    mushhouse: mushHouseSprite(),
    moonwell: moonwellSprite(),
    fountain: fountainSprite(),
  };

  // Characters
  for (const [k, L] of Object.entries(LOOKS)) {
    const left = [0, 1, 2, 3].map(f => humanFrame(L, 2, f));
    CHAR[k] = [[0, 1, 2, 3].map(f => humanFrame(L, 0, f)), [0, 1, 2, 3].map(f => humanFrame(L, 1, f)), left, left.map(mirrorC)];
    PORTRAIT_URL[k] = mk(16, 19, g => g.drawImage(CHAR[k][0][0], 0, 0)).toDataURL();
  }

  // Enemies
  SPR.slime = slimeFrames('#6ac24a');
  SPR.rockslime = slimeFrames('#7aa0d8');
  SPR.wisp = [0, 1].map(f => outlined(mk(16, 16, g => {
    disc(g, 8, 7, 4, '#8a6aff'); disc(g, 8, 7, 3, '#b8a4ff'); disc(g, 7, 6, 1, '#f0ecff');
    R(g, '#8a6aff', f ? 6 : 8, 11, 2, 2); R(g, '#8a6aff', f ? 8 : 6, 13, 1, 2);
    R(g, '#2a1050', 6, 7, 1, 2); R(g, '#2a1050', 9, 7, 1, 2);
  }), '#2a1050'));
  // Wolf: side view, facing left (mirrored for right), two running frames
  const wolf = f => outlined(mk(24, 16, g => {
    const c = '#8a8f9e', d = '#5c6070', l = '#c8ccd6';
    R(g, c, 6, 6, 13, 6); R(g, d, 7, 6, 11, 1); R(g, l, 8, 10, 9, 2);
    R(g, c, 2, 4, 6, 5); R(g, c, 0, 6, 3, 2); R(g, '#1a1020', 0, 6); R(g, l, 1, 7, 3, 1);
    R(g, c, 4, 2, 2, 2); R(g, d, 5, 2); R(g, '#ffcc40', 3, 5);
    R(g, c, 19, 5, 3, 2); R(g, c, 21, 3, 2, 2); R(g, l, 22, 3);
    const legs = f ? [6, 10, 14, 18] : [7, 9, 15, 17];
    for (const x of legs) { R(g, d, x, 12, 1, 3); R(g, '#3a3a48', x, 14); }
  }));
  SPR.wolf = [wolf(0), wolf(1)];
  SPR.wolfR = SPR.wolf.map(mirrorC);
  for (const k of ['slime', 'rockslime', 'wisp', 'wolf', 'wolfR']) SPR[k + 'W'] = SPR[k].map(whiteC);

  // Crops in the field
  SPR.crop = {};
  for (const [k, c] of Object.entries(CROPS)) SPR.crop[k] = cropFrames(c);

  // Item icons
  buildIcons();
}

function buildingSprite(sp) {
  const w = sp.w * 16, h = sp.h * 16 + 20;
  return outlined(mk(w, h, g => {
    const wallH = Math.min(36, sp.h * 16 - 10), wt = h - wallH;
    if (sp.chimney != null) { const cx = sp.chimney * 16 + 4; R(g, '#7a6a6a', cx, 4, 8, 24); R(g, '#5a4a4a', cx + 6, 4, 2, 24); R(g, '#4a3a3a', cx - 1, 3, 10, 3); }
    R(g, sp.wall, 1, wt, w - 2, wallH);
    const wd = shade(sp.wall, -0.12);
    if (sp.stone) {
      for (let y = wt + 4, row = 0; y < h; y += 5, row++) {
        R(g, wd, 1, y, w - 2, 1);
        for (let x = 1 + (row % 2) * 4; x < w - 1; x += 8) R(g, wd, x, y - 4, 1, 4);
      }
    } else for (let y = wt + 4; y < h; y += 4) R(g, wd, 1, y, w - 2, 1);
    R(g, sp.trim, 1, wt, 3, wallH); R(g, sp.trim, w - 4, wt, 3, wallH); R(g, sp.trim, 1, h - 2, w - 2, 2);
    // roof
    const rt = 4, rb = wt + 4, r1 = sp.roof, r2 = shade(sp.roof, -0.12), rs = shade(sp.roof, -0.3);
    for (let y = rt; y < rb; y++) {
      const t = (y - rt) / (rb - rt), inset = Math.round((1 - t) * w * 0.2);
      R(g, ((y - rt) >> 2) % 2 ? r2 : r1, inset, y, w - inset * 2, 1);
      if (((y - rt) & 3) === 3) for (let x = inset + (((y - rt) >> 2) % 2) * 3; x < w - inset; x += 6) R(g, rs, x, y);
    }
    R(g, shade(sp.roof, 0.22), Math.round(w * 0.2), rt, w - Math.round(w * 0.4), 2);
    R(g, shade(sp.roof, -0.4), 0, rb - 1, w, 2);
    // door
    const dx = sp.door * 16 + 3, dc = sp.doorc || '#8a5530';
    R(g, '#3e2418', dx, h - 21, 10, 19); R(g, dc, dx + 1, h - 20, 8, 18); R(g, shade(dc, -0.2), dx + 4, h - 20, 1, 18); R(g, '#f0c860', dx + 7, h - 11, 1, 2);
    // windows
    for (const c of sp.windows || []) {
      const wx = Math.round(c * 16) + 2;
      R(g, sp.trim, wx, h - 27, 12, 12); R(g, sp.glass || '#9fd4ff', wx + 1, h - 26, 10, 10); R(g, '#e8f6ff', wx + 2, h - 25, 3, 3);
      R(g, sp.trim, wx + 5, h - 26, 2, 10); R(g, sp.trim, wx + 1, h - 22, 10, 1); R(g, '#5a3a22', wx - 1, h - 15, 14, 2);
      R(g, '#e05a6a', wx, h - 16, 2, 1); R(g, '#ffd85a', wx + 5, h - 16, 2, 1); R(g, '#e05a6a', wx + 10, h - 16, 2, 1);
    }
    if (sp.awning) {
      const ay = wt + 1;
      for (let x = 2; x < w - 2; x++) R(g, ((x >> 2) % 2) ? sp.awning : '#f4ead8', x, ay, 1, 6);
      for (let x = 2; x < w - 2; x += 4) R(g, sp.awning, x, ay + 6, 2, 1);
    }
    if (sp.sign) {
      const sx = sp.door * 16 + 1, sy = wt - 1;
      R(g, '#5a3a22', sx, sy, 14, 9); R(g, '#e8d2a8', sx + 1, sy + 1, 12, 7);
      if (sp.sign === 'seed') { R(g, '#5fbf4a', sx + 6, sy + 2, 2, 5); R(g, '#5fbf4a', sx + 4, sy + 3, 2, 1); R(g, '#5fbf4a', sx + 8, sy + 2, 2, 1); }
      if (sp.sign === 'potion') { R(g, '#9a6aff', sx + 5, sy + 4, 4, 3); R(g, '#c8c8d8', sx + 6, sy + 2, 2, 2); }
      if (sp.sign === 'anvil') { R(g, '#4a4a5a', sx + 3, sy + 3, 8, 2); R(g, '#4a4a5a', sx + 6, sy + 5, 2, 2); R(g, '#4a4a5a', sx + 4, sy + 7, 6, 1); }
    }
  }));
}

function mushHouseSprite() {
  return outlined(mk(64, 84, g => {
    R(g, '#efe2c8', 12, 44, 40, 40); R(g, '#d8c8a8', 44, 44, 8, 40); R(g, '#cbb894', 12, 82, 40, 2);
    const C = '#d0504a';
    for (let y = 8; y < 50; y++) { const t = (y - 8) / 42, hw = Math.round(Math.sqrt(Math.max(0, t * (2 - t))) * 32); R(g, C, 32 - hw, y, hw * 2, 1); }
    R(g, shade(C, -0.3), 2, 48, 60, 2); R(g, shade(C, 0.2), 20, 12, 12, 3);
    for (const [x, y, r] of [[18, 22, 4], [36, 16, 3], [46, 32, 4], [26, 38, 3], [10, 38, 2], [52, 42, 2]]) disc(g, x, y, r, '#fff4e8');
    R(g, '#5a3a22', 26, 64, 12, 20); R(g, '#8a5530', 27, 65, 10, 19); R(g, '#3e2418', 26, 63, 12, 2); R(g, '#f0c860', 34, 74, 1, 2);
    disc(g, 19, 60, 4, '#5a3a22'); disc(g, 19, 60, 3, '#ffe9a0');
    disc(g, 45, 60, 4, '#5a3a22'); disc(g, 45, 60, 3, '#ffe9a0');
    R(g, '#6fe3c8', 14, 80, 4, 2); R(g, '#6fe3c8', 48, 79, 3, 3);
  }));
}
function moonwellSprite() {
  return outlined(mk(48, 48, g => {
    disc(g, 24, 26, 20, '#6a6478'); disc(g, 24, 25, 19, '#8e889c');
    for (let a = 0; a < 16; a++) { const x = 24 + Math.round(Math.cos(a / 16 * Math.PI * 2) * 17), y = 25 + Math.round(Math.sin(a / 16 * Math.PI * 2) * 17); R(g, '#6a6478', x, y, 2, 2); }
    disc(g, 24, 25, 14, '#2f5fa8'); disc(g, 24, 25, 11, '#5fb8ff'); disc(g, 22, 23, 6, '#a8e0ff'); disc(g, 21, 22, 2, '#ffffff');
    R(g, '#6fe3c8', 6, 24, 2, 2); R(g, '#6fe3c8', 40, 24, 2, 2); R(g, '#6fe3c8', 23, 6, 2, 2); R(g, '#6fe3c8', 23, 43, 2, 2);
  }));
}
function fountainSprite() {
  return outlined(mk(48, 48, g => {
    disc(g, 24, 28, 20, '#7a748a'); disc(g, 24, 27, 19, '#a9a1b8'); disc(g, 24, 27, 15, '#3f7fd0'); disc(g, 22, 25, 8, '#6aaaf0');
    R(g, '#8e889c', 20, 10, 8, 18); R(g, '#a9a1b8', 21, 10, 3, 18);
    R(g, '#9a6aff', 21, 2, 6, 9); R(g, '#c8a8ff', 21, 2, 2, 8); R(g, '#62d8ff', 25, 4, 2, 6); R(g, '#ffffff', 22, 3, 1, 2);
    R(g, '#a8e0ff', 18, 28, 1, 3); R(g, '#a8e0ff', 29, 27, 1, 3);
  }));
}

// ---------- Characters ----------
function humanFrame(L, dir, f) {
  return outlined(mk(16, 28, g => {
    const A = L.acc || [], has = a => A.includes(a);
    const sk = L.skin, skD = shade(sk, -0.15), hr = L.hair, hrD = shade(hr, -0.22);
    const sh = L.shirt, shD = shade(sh, -0.22), shL = shade(sh, 0.15), pt = L.pants, ptD = shade(pt, -0.22), bt = L.boots || '#3e2a1c';
    const side = dir >= 2, sA = f === 1, sB = f === 3, robe = has('robe');
    if (has('wings')) {
      const wc = '#bff4ff';
      if (!side) { R(g, wc, 0, 13, 3, 7); R(g, wc, 13, 13, 3, 7); R(g, '#e8fcff', 0, 13, 1, 4); R(g, '#e8fcff', 15, 13, 1, 4); }
      else { R(g, wc, 10, 12, 5, 8); R(g, '#e8fcff', 14, 12, 1, 5); }
    }
    // legs
    if (!side) {
      if (robe) { R(g, sh, 4, 21, 8, 5); R(g, shD, 10, 21, 2, 5); R(g, bt, 5, sA ? 25 : 26, 2, 2); R(g, bt, 9, sB ? 25 : 26, 2, 2); }
      else {
        const la = sA ? 1 : 0, lb = sB ? 1 : 0;
        R(g, pt, 5, 21, 2, 5 - la); R(g, ptD, 6, 21, 1, 5 - la); R(g, bt, 5, 26 - la, 2, 2);
        R(g, pt, 9, 21, 2, 5 - lb); R(g, ptD, 10, 21, 1, 5 - lb); R(g, bt, 9, 26 - lb, 2, 2);
      }
    } else {
      const stride = sA || sB;
      if (robe) { R(g, sh, 5, 21, 6, 5); R(g, shD, 9, 21, 2, 5); R(g, bt, stride ? 4 : 6, 26, 3, 2); R(g, bt, stride ? 9 : 8, 26, 2, 2); }
      else if (stride) { R(g, ptD, 9, 21, 2, 5); R(g, bt, 9, 26, 3, 2); R(g, pt, 5, 21, 2, 5); R(g, bt, 4, 26, 3, 2); }
      else { R(g, ptD, 8, 21, 2, 5); R(g, bt, 8, 26, 2, 2); R(g, pt, 6, 21, 2, 5); R(g, bt, 5, 26, 3, 2); }
    }
    // torso + arms
    if (!side) {
      R(g, sh, 4, 15, 8, 7); R(g, shD, 11, 15, 1, 7); R(g, shL, 4, 15, 1, 7);
      if (has('apron')) R(g, '#efe2c8', 5, 17, 6, 6);
      if (!robe) { R(g, '#4a3020', 4, 20, 8, 1); R(g, '#e7b85a', 7, 20, 2, 1); }
      const aa = sA ? 1 : sB ? -1 : 0;
      R(g, sh, 3, 15 + aa, 1, 5); R(g, sk, 3, 20 + aa, 1, 1);
      R(g, shD, 12, 15 - aa, 1, 5); R(g, sk, 12, 20 - aa, 1, 1);
    } else {
      R(g, sh, 5, 15, 6, 7); R(g, shD, 10, 15, 1, 7);
      if (has('apron')) R(g, '#efe2c8', 5, 17, 2, 6);
      if (!robe) R(g, '#4a3020', 5, 20, 6, 1);
      const ax = sA ? 6 : sB ? 9 : 7;
      R(g, shD, ax, 15, 2, 5); R(g, sk, ax, 20, 2, 1);
    }
    // head
    if (dir === 0) {
      R(g, sk, 4, 8, 8, 7); R(g, skD, 11, 8, 1, 7); R(g, skD, 4, 14, 8, 1);
      R(g, hr, 4, 6, 8, 3); R(g, hr, 5, 5, 6, 1); R(g, hr, 3, 7, 1, 5); R(g, hr, 12, 7, 1, 5); R(g, hrD, 11, 7, 1, 2); R(g, hr, 4, 9, 1, 1); R(g, hr, 11, 9, 1, 1);
      R(g, '#2a1a2a', 6, 11, 1, 2); R(g, '#2a1a2a', 9, 11, 1, 2); R(g, '#f3a0a0', 5, 13); R(g, '#f3a0a0', 10, 13);
    } else if (dir === 1) {
      R(g, sk, 4, 8, 8, 7); R(g, hr, 4, 6, 8, 8); R(g, hr, 5, 5, 6, 1); R(g, hr, 3, 7, 1, 6); R(g, hr, 12, 7, 1, 6); R(g, hrD, 4, 13, 8, 1); R(g, skD, 6, 14, 4, 1);
    } else {
      R(g, sk, 4, 8, 7, 7); R(g, skD, 4, 14, 7, 1);
      R(g, hr, 5, 6, 7, 3); R(g, hr, 6, 5, 5, 1); R(g, hr, 9, 8, 3, 5); R(g, hrD, 11, 8, 1, 5); R(g, hr, 4, 7, 2, 1);
      R(g, '#2a1a2a', 5, 11, 1, 2); R(g, sk, 3, 11); R(g, '#f3a0a0', 6, 13);
    }
    if (has('beard')) {
      const bd = L.beard || hr;
      if (dir === 0) { R(g, bd, 4, 12, 8, 3); R(g, bd, 5, 15, 6, 2); R(g, bd, 6, 17, 4, 1); R(g, '#2a1a2a', 7, 13, 2, 1); }
      else if (side) { R(g, bd, 3, 12, 5, 3); R(g, bd, 4, 15, 3, 2); }
    }
    if (has('ears')) {
      if (!side) { R(g, sk, 2, 10, 1, 2); R(g, sk, 1, 9); R(g, sk, 13, 10, 1, 2); R(g, sk, 14, 9); }
      else { R(g, sk, 10, 10, 2, 1); R(g, sk, 12, 9); }
    }
    if (has('strawhat')) {
      const bw = side ? 11 : 12;
      R(g, '#e2bd62', 2, 6, bw, 2); R(g, '#c9a24a', 2, 7, bw, 1); R(g, '#e8c870', 5, 3, 6, 3); R(g, '#c0503a', 5, 5, 6, 1);
    }
    if (has('witch')) {
      const hc = '#3a2458';
      R(g, hc, 1, 6, 14, 2); R(g, hc, 4, 4, 8, 2); R(g, hc, 5, 3, 6, 1); R(g, hc, 6, 2, 4, 1); R(g, hc, 7, 1, 3, 1); R(g, hc, 9, 0, 3, 1);
      R(g, '#e7b85a', 4, 5, 8, 1); R(g, '#5a3a88', 5, 3, 2, 1);
    }
    if (has('bandana')) {
      R(g, '#c04848', 4, 6, 8, 2); R(g, '#e06060', 4, 6, 8, 1);
      if (dir === 0) R(g, '#c04848', 12, 8, 2, 2); else if (side) R(g, '#c04848', 12, 7, 2, 3);
    }
  }));
}

function slimeFrames(c) {
  const cd = shade(c, -0.3), cl = shade(c, 0.3), e = '#1a1020';
  return [0, 1].map(f => outlined(mk(16, 16, g => {
    if (f === 0) { R(g, c, 3, 8, 10, 7); R(g, c, 4, 6, 8, 2); R(g, c, 6, 5, 4, 1); R(g, cd, 3, 13, 10, 2); R(g, cl, 5, 7, 2, 2); R(g, '#ffffff', 5, 7); R(g, e, 6, 10, 1, 2); R(g, e, 9, 10, 1, 2); }
    else { R(g, c, 2, 10, 12, 5); R(g, c, 3, 8, 10, 2); R(g, c, 5, 7, 6, 1); R(g, cd, 2, 13, 12, 2); R(g, cl, 4, 8, 2, 2); R(g, e, 6, 11, 1, 2); R(g, e, 9, 11, 1, 2); }
  })));
}

// ---------- Crops ----------
function cropFrames(c) {
  const L = c.leaf, LD = shade(L, -0.28), LL = shade(L, 0.2), F = c.fruit, FD = shade(F, -0.25), FL = shade(F, 0.35);
  const st = [];
  st[0] = mk(16, 20, g => { R(g, '#3e2a1a', 5, 15, 2, 1); R(g, '#3e2a1a', 9, 16, 2, 1); R(g, '#3e2a1a', 7, 13); R(g, '#c8b080', 5, 14); });
  st[1] = outlined(mk(16, 20, g => { R(g, L, 7, 13, 2, 4); R(g, L, 5, 12, 2, 2); R(g, LL, 9, 11, 2, 2); }));
  st[2] = outlined(mk(16, 20, g => { R(g, LD, 7, 9, 2, 8); R(g, L, 4, 11, 3, 2); R(g, L, 9, 9, 3, 2); R(g, LL, 5, 8, 2, 2); R(g, L, 10, 12, 2, 2); }));
  const mature = (g, ready) => {
    if (c.shape === 'root') {
      R(g, L, 5, 7, 2, 8); R(g, L, 8, 5, 2, 10); R(g, L, 11, 8, 2, 7); R(g, LL, 8, 5, 1, 4); R(g, LD, 6, 10, 1, 5); R(g, LD, 10, 9, 1, 6);
      if (ready) { R(g, F, 6, 15, 5, 3); R(g, FL, 6, 15, 2, 1); R(g, FD, 10, 16, 1, 2); }
    } else if (c.shape === 'flower') {
      R(g, LD, 7, 6, 2, 11); R(g, L, 4, 11, 3, 2); R(g, L, 9, 9, 3, 2); R(g, LL, 4, 11, 1, 1);
      if (ready) { disc(g, 8, 5, 4, F); disc(g, 8, 5, 2, FD); R(g, '#ffe58a', 7, 4, 2, 2); R(g, FL, 6, 2, 2, 1); }
      else { R(g, LL, 7, 2, 2, 4); R(g, shade(F, -0.1), 7, 2, 2, 1); }
    } else if (c.shape === 'bush') {
      disc(g, 8, 11, 6, L); disc(g, 6, 9, 3, LL); R(g, LD, 3, 15, 10, 2);
      if (ready) for (const [x, y] of [[5, 9], [10, 8], [8, 13], [11, 12], [4, 13], [7, 6]]) { R(g, F, x, y, 2, 2); R(g, FL, x, y); }
    } else {
      R(g, L, 2, 13, 12, 3); disc(g, 5, 12, 3, L); disc(g, 11, 11, 3, LL); R(g, LD, 2, 16, 12, 1);
      if (ready) {
        disc(g, 8, 12, 6, F); R(g, FD, 8, 7, 1, 11); R(g, FD, 5, 8, 1, 9); R(g, FD, 11, 8, 1, 9);
        R(g, FL, 4, 9, 2, 3); R(g, '#6a4a2a', 7, 4, 2, 3); R(g, L, 9, 4, 3, 1);
      } else { R(g, F, 7, 13, 3, 3); R(g, FL, 7, 13); }
    }
  };
  st[3] = outlined(mk(16, 20, g => mature(g, false)));
  st[4] = outlined(mk(16, 20, g => mature(g, true)));
  return st;
}

// ---------- Item icons ----------
function buildIcons() {
  const fn = {
    hoe: g => { line(g, '#8a5a34', 2, 14, 10, 6); line(g, '#a8743e', 3, 14, 11, 6); R(g, '#a0a8b8', 9, 2, 4, 3); R(g, '#a0a8b8', 12, 2, 2, 6); R(g, '#e0e4f0', 9, 2, 4, 1); R(g, '#6a7284', 12, 7, 2, 1); },
    can: g => {
      R(g, '#4a86cc', 2, 7, 9, 7); R(g, '#6aa6ec', 2, 7, 9, 2); R(g, '#33669e', 2, 13, 9, 1); line(g, '#4a86cc', 11, 10, 14, 6); line(g, '#4a86cc', 11, 11, 14, 7);
      R(g, '#6aa6ec', 13, 4, 2, 2); R(g, '#33669e', 4, 4, 5, 1); R(g, '#33669e', 3, 5, 1, 2); R(g, '#33669e', 9, 5, 1, 2);
    },
    axe: g => { line(g, '#8a5a34', 4, 14, 11, 4); line(g, '#a8743e', 5, 14, 12, 4); R(g, '#9aa2b4', 9, 2, 5, 6); R(g, '#e0e4f0', 13, 2, 1, 6); R(g, '#6a7284', 9, 7, 5, 1); },
    pick: g => { R(g, '#8a5a34', 7, 4, 2, 11); R(g, '#a8743e', 7, 4, 1, 11); R(g, '#9aa2b4', 2, 3, 12, 2); R(g, '#9aa2b4', 1, 5, 2, 2); R(g, '#9aa2b4', 13, 5, 2, 2); R(g, '#e0e4f0', 3, 3, 10, 1); },
    sword: g => {
      line(g, '#e0e8f4', 4, 11, 13, 2); line(g, '#9aa6b8', 5, 11, 14, 2); line(g, '#9aa6b8', 5, 12, 13, 4);
      line(g, '#e7b85a', 2, 9, 6, 13); line(g, '#6a3a8a', 2, 13, 3, 14); R(g, '#e7b85a', 1, 14, 2, 2); R(g, '#6fe3c8', 4, 11);
    },
    wood: g => { R(g, '#8c5a35', 2, 6, 11, 7); R(g, '#a8743e', 2, 6, 11, 2); R(g, '#6b4429', 2, 12, 11, 1); disc(g, 13, 9, 3, '#d8b07a'); R(g, '#a87c48', 13, 9); R(g, '#a87c48', 12, 8, 3, 1); },
    stone: g => { disc(g, 8, 9, 5, '#7e7a88'); disc(g, 7, 8, 4, '#9a96a6'); R(g, '#c0bccb', 5, 6, 2, 1); },
    fiber: g => { for (let i = 0; i < 4; i++) line(g, i % 2 ? '#5a9a3a' : '#7ab85a', 4 + i * 2, 14, 6 + i, 2); R(g, '#c8a060', 4, 9, 9, 2); },
    shard: g => {
      for (let y = 2; y <= 14; y++) { const w = y <= 7 ? y - 1 : 15 - y, hw = Math.max(1, Math.floor(w / 2) + 1); R(g, '#9a6aff', 8 - hw, y, hw * 2, 1); R(g, '#c8a8ff', 8 - hw, y); R(g, '#62d8ff', 8 + hw - 2, y, 1, 1); }
      R(g, '#ffffff', 6, 5, 1, 2);
    },
    ore: g => { disc(g, 8, 9, 5, '#5f5650'); disc(g, 7, 8, 4, '#7a7068'); R(g, '#f0b84a', 5, 7, 2, 2); R(g, '#ffe08a', 5, 7); R(g, '#f0b84a', 9, 10, 2, 1); R(g, '#ffe08a', 10, 6); },
    gloom: g => { disc(g, 8, 8, 5, '#3a2458'); disc(g, 7, 7, 3, '#6a4aa8'); R(g, '#c8b8ff', 6, 6); R(g, '#6a4aa8', 13, 3); R(g, '#6a4aa8', 2, 12); },
    gel: g => { R(g, '#6ac24a', 3, 8, 10, 6); R(g, '#6ac24a', 4, 7, 8, 1); R(g, '#6ac24a', 6, 6, 4, 1); R(g, '#9ae87a', 4, 8, 3, 2); R(g, '#4a9a3a', 3, 13, 10, 1); },
    fence: g => { R(g, '#9a6a3a', 3, 3, 3, 11); R(g, '#9a6a3a', 10, 3, 3, 11); R(g, '#c08a50', 1, 6, 14, 2); R(g, '#c08a50', 1, 10, 14, 2); R(g, '#c08a50', 3, 3, 1, 11); R(g, '#c08a50', 10, 3, 1, 11); },
    lantern: g => { R(g, '#2a1f2f', 4, 4, 8, 10); R(g, '#ffd86a', 5, 5, 6, 8); R(g, '#fff2c0', 6, 6, 2, 4); R(g, '#2a1f2f', 3, 3, 10, 1); R(g, '#2a1f2f', 7, 1, 2, 2); },
    stew: g => {
      R(g, '#8c5a35', 2, 8, 12, 5); R(g, '#6b4429', 3, 13, 10, 1); R(g, '#a8743e', 2, 8, 12, 1); R(g, '#d8742a', 3, 7, 10, 2);
      R(g, '#f0c050', 5, 7); R(g, '#6ac24a', 9, 7); R(g, '#c0405a', 11, 7); R(g, '#e8e8f0', 5, 2, 1, 3); R(g, '#e8e8f0', 9, 1, 1, 3);
    },
    tonic: g => { R(g, '#d6e8f0', 6, 3, 4, 2); R(g, '#d6e8f0', 4, 5, 8, 9); R(g, '#e0406a', 5, 8, 6, 5); R(g, '#ff8aa8', 5, 8, 6, 1); R(g, '#ffffff', 5, 6, 1, 2); R(g, '#8c5a35', 6, 1, 4, 2); },
    dust: g => { R(g, '#a8743e', 4, 6, 8, 8); R(g, '#8c5a35', 4, 13, 8, 1); R(g, '#6b4429', 5, 5, 6, 1); R(g, '#a8743e', 6, 3, 4, 2); R(g, '#ffe58a', 2, 3); R(g, '#ffe58a', 13, 4); R(g, '#ffe58a', 12, 1); R(g, '#6fe3c8', 8, 9, 2, 2); },
    pelt: g => { R(g, '#8a8f9e', 3, 4, 10, 9); R(g, '#8a8f9e', 1, 6, 14, 5); R(g, '#c8ccd6', 4, 6, 8, 4); R(g, '#5c6070', 3, 4, 10, 1); R(g, '#8a8f9e', 2, 12, 2, 2); R(g, '#8a8f9e', 12, 12, 2, 2); R(g, '#8a8f9e', 6, 2, 4, 2); },
    bag: g => { R(g, '#8a5a30', 3, 5, 10, 9); R(g, '#a8743e', 3, 5, 10, 2); R(g, '#6a4222', 3, 13, 10, 1); R(g, '#5a3a22', 6, 2, 4, 1); R(g, '#5a3a22', 5, 3, 1, 2); R(g, '#5a3a22', 10, 3, 1, 2); R(g, '#f0c050', 7, 8, 2, 2); },
  };
  for (const [id, f] of Object.entries(fn)) ICONS[id] = outlined(mk(16, 16, f));
  ICONS.cap = SPR.cap; ICONS.dew = SPR.dew; ICONS.glowcap = SPR.glow; ICONS.sprinkler = SPR.sprinkler;
  for (const [k, c] of Object.entries(CROPS)) {
    const L = c.leaf, F = c.fruit, FD = shade(F, -0.25), FL = shade(F, 0.35);
    ICONS['seed_' + k] = outlined(mk(16, 16, g => {
      R(g, '#e9dcc0', 3, 2, 10, 12); R(g, '#cdbd9c', 3, 2, 10, 2); R(g, '#cdbd9c', 12, 2, 1, 12);
      disc(g, 8, 9, 3, F); R(g, FL, 7, 8); R(g, L, 8, 5, 2, 1); R(g, L, 7, 4, 1, 2);
    }));
    ICONS[k] = outlined(mk(16, 16, g => {
      if (c.shape === 'root') {
        R(g, F, 5, 5, 6, 2); R(g, F, 6, 7, 5, 2); R(g, F, 7, 9, 3, 2); R(g, F, 7, 11, 2, 2); R(g, F, 8, 13);
        R(g, FL, 6, 5, 1, 4); R(g, FD, 8, 8, 2, 1); R(g, FD, 7, 11, 1, 1);
        R(g, L, 6, 1, 1, 4); R(g, L, 8, 1, 1, 4); R(g, L, 10, 2, 1, 3);
      } else if (c.shape === 'flower') {
        R(g, L, 7, 9, 2, 6); R(g, L, 4, 11, 3, 2); disc(g, 8, 6, 4, F); disc(g, 8, 6, 2, FD); R(g, '#ffe58a', 7, 5, 2, 2);
      } else if (c.shape === 'bush') {
        disc(g, 6, 9, 3, F); disc(g, 10, 9, 3, F); disc(g, 8, 12, 3, FD); R(g, FL, 5, 8); R(g, FL, 9, 8); R(g, L, 6, 3, 5, 2); R(g, L, 8, 5, 1, 2);
      } else {
        disc(g, 8, 10, 6, F); R(g, FD, 8, 5, 1, 11); R(g, FD, 5, 6, 1, 9); R(g, FD, 11, 6, 1, 9); R(g, FL, 4, 7, 2, 3);
        R(g, '#6a4a2a', 7, 2, 2, 3); R(g, L, 9, 3, 3, 1);
      }
    }));
  }
  for (const [id, c] of Object.entries(ICONS)) ICON_URL[id] = c.toDataURL();
}
