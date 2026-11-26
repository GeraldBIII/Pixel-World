'use strict';
// ---------- Moonfall Depths ----------
// A tiered dungeon under the waterfall. Each visit generates fresh floors. Every 5th floor
// has Grimble's shop and an escape ladder (and becomes a starting point for later visits).
// Monsters change look every 5 floors (a "tier") and scale with the floor's hidden power level.
const DUN = { floor: 0, tier: 0, map: null };
const DW = 60, DH = 46;
let shots = []; // projectiles (thrown bones)

const DMOBS = {
  dslime: { name: 'Slime', hp: 14, dmg: 6, xp: XP.dslime, drops: [['gel', 0.7]] },
  bat: { name: 'Bat', hp: 10, dmg: 5, xp: XP.bat, drops: [['batwing', 0.6]] },
  skeleton: { name: 'Skeleton', hp: 22, dmg: 8, xp: XP.skeleton, drops: [['bone', 0.75]] },
  goblin: { name: 'Goblin', hp: 20, dmg: 9, xp: XP.goblin, drops: [['gobtooth', 0.6]], gold: [3, 9] },
};
for (const [k, m] of Object.entries(DMOBS)) ENEMY[k] = { hp: m.hp, dmg: m.dmg, drops: m.drops, dungeon: true };

// ---------- Hidden power level (1-100) ----------
// Rates the hero's overall strength from damage output and toughness. It isn't shown in normal
// play; floors use the same scale for their monsters, so floor N "expects" a hero of that power.
function powerLevel() {
  if (!S) return 1;
  const dps = ST.atk * (1 + ST.crit * 0.75) / Math.max(0.12, ST.swing);
  const ehp = S.maxHp / (1 - ST.def / (ST.def + 20)) * (1 + ST.block * 0.5);
  const raw = Math.sqrt(dps * ehp);
  return clamp(Math.round((raw - 80) / 5.2) + 1, 1, 100);
}
const floorPower = n => clamp(Math.round(n * 2.2), 1, 100);

function makeMap(w, h) {
  const n = w * h;
  return {
    W: w, H: h, dungeon: true, ground: new Uint8Array(n), obj: new Uint8Array(n), wet: new Uint8Array(n),
    bmap: new Int16Array(n).fill(-1), farm: new Uint8Array(n), cliffD: new Uint8Array(n),
    crops: new Map(), hp: new Map(), buildings: [], signs: new Map(),
  };
}

function genDungeon(n) {
  const M = makeMap(DW, DH), G = M.ground, O = M.obj, I = (x, y) => y * DW + x;
  const R = Math.random;
  G.fill(GND.DWALL);
  const special = n === 1 || n % 5 === 0;
  const rooms = [];
  if (special) rooms.push({ x: 4 + Math.floor(R() * (DW - 20)), y: 4 + Math.floor(R() * (DH - 18)), w: 11, h: 8 });
  for (let k = 0; k < 200 && rooms.length < 11; k++) {
    const w = 6 + Math.floor(R() * 7), h = 5 + Math.floor(R() * 5), x = 2 + Math.floor(R() * (DW - w - 4)), y = 3 + Math.floor(R() * (DH - h - 5));
    if (rooms.some(o => x < o.x + o.w + 3 && x + w + 3 > o.x && y < o.y + o.h + 3 && y + h + 3 > o.y)) continue;
    rooms.push({ x, y, w, h });
  }
  for (const r of rooms) { r.cx = r.x + (r.w >> 1); r.cy = r.y + (r.h >> 1); for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) G[I(x, y)] = GND.DFLOOR; }
  // Connect rooms in a chain (nearest unvisited next), plus a couple of loops
  const order = [rooms[0]], left = rooms.slice(1);
  while (left.length) {
    const last = order[order.length - 1];
    left.sort((a, b) => dist(a.cx, a.cy, last.cx, last.cy) - dist(b.cx, b.cy, last.cx, last.cy));
    order.push(left.shift());
  }
  const dig = (x, y) => { for (let oy = 0; oy < 2; oy++) for (let ox = 0; ox < 2; ox++) if (x + ox > 0 && y + oy > 1 && x + ox < DW - 1 && y + oy < DH - 1) G[I(x + ox, y + oy)] = GND.DFLOOR; };
  const corridor = (a, b) => {
    const hFirst = R() < 0.5;
    let x = a.cx, y = a.cy;
    const stepX = () => { while (x !== b.cx) { dig(x, y); x += Math.sign(b.cx - x); } };
    const stepY = () => { while (y !== b.cy) { dig(x, y); y += Math.sign(b.cy - y); } };
    if (hFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
    dig(x, y);
  };
  for (let k = 0; k < order.length - 1; k++) corridor(order[k], order[k + 1]);
  for (let k = 0; k < 2 && order.length > 4; k++) corridor(order[Math.floor(R() * order.length)], order[Math.floor(R() * order.length)]);

  const start = rooms[0], end = order.reduce((a, b) => (dist(b.cx, b.cy, start.cx, start.cy) > dist(a.cx, a.cy, start.cx, start.cy) ? b : a));
  const spawn = { x: start.cx, y: start.cy + 1 };
  const inRoom = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  const freeTile = (r, pad = 1) => {
    for (let k = 0; k < 40; k++) {
      const x = r.x + pad + Math.floor(R() * (r.w - pad * 2)), y = r.y + pad + Math.floor(R() * (r.h - pad * 2));
      if (G[I(x, y)] === GND.DFLOOR && !O[I(x, y)] && !(Math.abs(x - spawn.x) < 2 && Math.abs(y - spawn.y) < 2)) return [x, y];
    }
    return null;
  };
  O[I(end.cx, end.cy)] = OB.STAIRS;
  if (special) {
    O[I(start.x + 1, start.y)] = OB.LADDER; G[I(start.x + 1, start.y)] = GND.DFLOOR;
    if (n % 5 === 0) {
      const b = { id: 'dstall', kind: 'dstall', x: start.x + start.w - 4, y: start.y, w: 3, h: 2, label: 'Shop', action: 'shop', shop: 'delve', any: true };
      M.buildings.push(b);
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { O[I(x, y)] = OB.BLOCK; M.bmap[I(x, y)] = 0; }
    }
  }
  // Torches, rocks, treasure
  for (const r of rooms) {
    for (let k = 0; k < 2; k++) { const t = freeTile(r, 0); if (t && (t[0] === r.x || t[0] === r.x + r.w - 1 || t[1] === r.y)) O[I(...t)] = OB.TORCH; }
    if (r === start) continue;
    const rockCount = Math.floor(r.w * r.h * 0.07);
    for (let k = 0; k < rockCount; k++) {
      const t = freeTile(r, 1); if (!t) continue;
      const h = R();
      O[I(...t)] = h < 0.55 ? OB.ROCK : h < 0.78 ? (n >= 10 && R() < 0.6 ? OB.DARKORE : OB.ORE) : h < 0.88 ? OB.CRYSTAL : n >= 5 && h < 0.94 ? OB.GEMROCK : OB.BOULDER;
    }
  }
  const chestRooms = rooms.filter(r => r !== start && r !== end);
  for (let k = 0; k < 1 + (R() < 0.5 ? 1 : 0) + (n % 5 === 0 ? 1 : 0) && chestRooms.length; k++) {
    const t = freeTile(chestRooms[Math.floor(R() * chestRooms.length)], 1); if (t) O[I(...t)] = OB.LOOT;
  }
  // Monsters: which kinds depend on depth
  const kinds = n <= 2 ? ['dslime', 'dslime', 'bat'] : n <= 5 ? ['dslime', 'bat', 'skeleton'] : n <= 10 ? ['dslime', 'bat', 'skeleton', 'goblin'] : ['bat', 'skeleton', 'goblin', 'goblin', 'dslime'];
  const mobs = [], count = Math.min(20, 5 + Math.floor(n * 0.6));
  for (let k = 0; k < count * 3 && mobs.length < count; k++) {
    const r = rooms[1 + Math.floor(R() * (rooms.length - 1))];
    if (!r) break;
    const t = freeTile(r, 1);
    if (t && dist(t[0], t[1], spawn.x, spawn.y) > 8) mobs.push({ kind: kinds[Math.floor(R() * kinds.length)], x: t[0], y: t[1] });
  }
  return { M, spawn, mobs };
}

function spawnDungeonMob(kind, tx, ty, n) {
  const m = DMOBS[kind], pw = floorPower(n), tier = Math.min(4, Math.floor((n - 1) / 5));
  const hp = Math.round(m.hp * (1 + pw * 0.06)), dmg = Math.round(m.dmg * (1 + pw * 0.03));
  return {
    kind, x: tx * TS + 8, y: ty * TS + 12, hp, max: hp, dmg, pow: pw, tier, set: enemySet(kind, tier), name: TIER_NAMES[tier] + m.name,
    fly: false, t: Math.random() * 2, vx: 0, vy: 0, kx: 0, ky: 0, flash: 0, hop: 0, fade: 1, face: -1,
    spd: kind === 'goblin' ? 70 + tier * 6 : 0, lspd: 150 + tier * 10, shootT: 1 + Math.random(),
  };
}

const inDungeon = () => DUN.floor > 0;
function collectDrops() {
  for (const d of drops) { const left = addItem(d.id, d.n); if (d.id === 'wood') S.stats.wood += d.n - left; if (d.id === 'shard') S.stats.shards += d.n - left; }
  drops = [];
}
function enterDungeon(n) {
  collectDrops();
  const { M, spawn, mobs } = genDungeon(n);
  DUN.floor = n; DUN.tier = Math.min(4, Math.floor((n - 1) / 5)); DUN.map = M;
  World = M; W = M.W; H = M.H;
  P.x = spawn.x * TS + 8; P.y = spawn.y * TS + 12; P.dir = 0; P.kx = P.ky = 0; P.rollT = 0;
  enemies = mobs.map(m => spawnDungeonMob(m.kind, m.x, m.y, n));
  shots = []; parts = []; floats = [];
  S.dungeonMax = Math.max(S.dungeonMax || 0, n);
  snapCamera();
  Sound.play('descend');
  const fade = document.getElementById('fade');
  fade.classList.add('on'); setTimeout(() => fade.classList.remove('on'), 250);
  UI.toast(`Moonfall Depths · Floor ${n}${n % 5 === 0 ? ' · Grimble\'s stall' : ''}`);
  if (floorPower(n) > powerLevel() + 15) setTimeout(() => UI.toast('A chill runs down your spine. The monsters here are far stronger than you.'), 900);
}
function exitDungeon(quiet) {
  if (!inDungeon()) return;
  collectDrops();
  DUN.floor = 0; DUN.map = null;
  World = OVERWORLD; W = OW; H = OH;
  P.x = (CAVE.x + 1) * TS + 8; P.y = (CAVE.y + 2) * TS + 12; P.dir = 0; P.kx = P.ky = 0;
  enemies = []; shots = []; parts = [];
  snapCamera();
  if (!quiet) { Sound.play('descend'); UI.toast('You climb back out into the fresh air.'); }
}
function dungeonPrompt() {
  const deepest = S.dungeonMax || 0, opts = [{ label: 'Floor 1', run: () => enterDungeon(1) }];
  for (let f = 5; f <= deepest; f += 5) opts.push({ label: `Floor ${f}`, run: () => enterDungeon(f) });
  if (opts.length === 1) { enterDungeon(1); return; }
  opts.push({ label: 'Not now', cancel: true });
  UI.confirm('Moonfall Depths. Which floor do you want to start on?', opts);
}

// Treasure chests: gold, materials, gems, sometimes gear. Better the deeper you go.
function openLootChest(tx, ty) {
  const n = DUN.floor, x = tx * TS + 8, y = ty * TS + 8;
  World.obj[idx(tx, ty)] = OB.LOOTOPEN;
  const gold = ri(15, 30) + n * 8;
  S.gold += gold;
  floatText(x, y - 14, `+${gold}g`, '#ffe58a');
  const common = ['gel', 'bone', 'batwing', 'gobtooth', 'ore', 'stone'];
  for (let k = 0; k < 2; k++) dropItem(common[Math.floor(Math.random() * common.length)], ri(1, 3), x, y);
  if (Math.random() < 0.5) dropItem('shard', 1, x, y);
  if (n >= 5 && Math.random() < 0.25) dropItem('ruby', 1, x, y);
  if (n >= 10 && Math.random() < 0.2) dropItem('sapphire', 1, x, y);
  if (n >= 10 && Math.random() < 0.5) dropItem('darkiron', ri(1, 3), x, y);
  if (n >= 15 && Math.random() < 0.06) dropItem('relic', 1, x, y);
  if (Math.random() < 0.15 + n * 0.005) {
    const pool = n < 10 ? ['dagger', 'leathercap', 'tunic', 'boots', 'buckler', 'charm']
      : n < 20 ? ['ironsword', 'kite', 'ironhelm', 'mail', 'greaves', 'amulet', 'bonehelm', 'gobshiv']
        : ['hammer', 'moonblade', 'aegis', 'dplate', 'sward', 'rubyring', 'dgreatsword', 'pendant', 'swiftboots'];
    dropItem(pool[Math.floor(Math.random() * pool.length)], 1, x, y);
  }
  gainXP(XP.chest, x, y - 24);
  Sound.play('chest');
  burst(x, y - 4, '#ffe58a', 16);
}

// ---------- Dungeon monster behaviour ----------
function updateBat(e, d, dt) {
  e.t += dt;
  if (d < 9 * TS) {
    const a = Math.atan2(P.y - 8 - e.y, P.x - e.x) + Math.sin(e.t * 5) * 0.9;
    const nx = e.x + Math.cos(a) * 58 * dt, ny = e.y + Math.sin(a) * 58 * dt;
    if (enemyFree(e, nx, e.y)) e.x = nx; if (enemyFree(e, e.x, ny)) e.y = ny;
    e.face = Math.cos(a) > 0 ? 1 : -1;
  }
}
function updateSkeleton(e, d, dt) {
  if (d > 10 * TS) return;
  const a = Math.atan2(P.y - e.y, P.x - e.x);
  let sp = 0;
  if (d < 3.5 * TS) sp = -32; else if (d > 6 * TS) sp = 34;
  const nx = e.x + Math.cos(a) * sp * dt, ny = e.y + Math.sin(a) * sp * dt;
  if (enemyFree(e, nx, e.y)) e.x = nx; if (enemyFree(e, e.x, ny)) e.y = ny;
  e.face = Math.cos(a) > 0 ? 1 : -1; e.run = sp !== 0;
  e.shootT -= dt;
  if (e.shootT <= 0) {
    e.shootT = Math.max(1, 2.2 - e.tier * 0.25) + Math.random() * 0.6;
    const sp2 = 110 + e.tier * 12;
    shots.push({ x: e.x, y: e.y - 10, vx: Math.cos(a) * sp2, vy: Math.sin(a) * sp2, dmg: e.dmg, life: 3, rot: 0, c: DPAL[e.tier].bone });
    Sound.play('bone');
  }
}
function updateShots(dt) {
  for (const s of shots) {
    s.life -= dt; s.rot += dt * 14;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (solidTile(Math.floor(s.x / TS), Math.floor((s.y + 6) / TS))) { s.life = 0; burst(s.x, s.y, s.c, 3); continue; }
    if (dist(s.x, s.y, P.x, P.y - 8) < 9 && P.rollT <= 0 && P.hurtT <= 0) { hurtPlayer(s.dmg, s); s.life = 0; }
  }
  shots = shots.filter(s => s.life > 0);
}
function drawShot(g, s) {
  g.save(); g.translate(Math.round(s.x), Math.round(s.y)); g.rotate(s.rot);
  g.fillStyle = s.c; g.fillRect(-4, -1, 8, 2); g.fillRect(-5, -2, 2, 4); g.fillRect(3, -2, 2, 4);
  g.restore();
}
