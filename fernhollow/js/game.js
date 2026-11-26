'use strict';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const lightC = document.createElement('canvas'), lctx = lightC.getContext('2d');

let S = null, playing = false, clock = 0, hint = null;
let VW = 320, VH = 180, SCALE = 3;
const cam = { x: 0, y: 0 };
const P = {
  x: 0, y: 0, dir: 0, frame: 0, animT: 0, moving: false, toolT: 0, toolDur: 0.3, toolId: null, toolDone: true, hurtT: 0, kx: 0, ky: 0, target: [0, 0], holdT: 0, useCD: 0,
  swingT: 0, swingDur: 0.24, swingDone: true, atkHold: 0, rollT: 0, rollDur: 0.34, rollCD: 0, rollVx: 0, rollVy: 0, blocking: false, sprinting: false, staDelay: 0, dustT: 0,
};
const ST = { atk: 10, def: 0, crit: 0.05, speed: 1, block: 0, swing: 0.24, reach: 17, knock: 1, toolPow: 1 }; // derived stats
let npcs = [], enemies = [], parts = [], floats = [], drops = [];
const shakes = new Map();
let spawnT = 0, questT = 0, smokeT = 0, ambT = 0;
const DIRV = [[0, 1], [0, -1], [-1, 0], [1, 0]];

// ---------- Time helpers ----------
function fmtTime(m) {
  m = Math.floor(m / 10) * 10;
  let h = Math.floor(m / 60) % 24;
  const mm = String(m % 60).padStart(2, '0');
  if (Settings.clock24) return `${String(h).padStart(2, '0')}:${mm}`;
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${mm}${ap}`;
}
const dayKey = () => (S.year - 1) * DAYS_PER_SEASON * 4 + S.season * DAYS_PER_SEASON + S.day;
const isNight = () => S && S.time >= 20 * 60;

// ---------- Inventory ----------
function canAdd(id, n = 1) {
  const max = maxStack(id);
  for (let i = 0; i < S.invSize && n > 0; i++) { const s = S.inv[i]; if (!s) n -= max; else if (s.id === id) n -= max - s.n; }
  return n <= 0;
}
function addItem(id, n) {
  const max = maxStack(id);
  for (let i = 0; i < S.invSize && n > 0; i++) { const s = S.inv[i]; if (s && s.id === id && s.n < max) { const k = Math.min(n, max - s.n); s.n += k; n -= k; } }
  for (let i = 0; i < S.invSize && n > 0; i++) { if (!S.inv[i]) { const k = Math.min(n, max); S.inv[i] = { id, n: k }; n -= k; } }
  invChanged();
  return n;
}
function countItem(id) { let c = 0; for (let i = 0; i < S.invSize; i++) if (S.inv[i] && S.inv[i].id === id) c += S.inv[i].n; return c; }
function removeItem(id, n) {
  for (let i = S.invSize - 1; i >= 0 && n > 0; i--) { const s = S.inv[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) S.inv[i] = null; } }
  invChanged();
}
function removeAt(i, n) { const s = S.inv[i]; if (!s) return; s.n -= n; if (s.n <= 0) S.inv[i] = null; invChanged(); }
function invChanged() { UI.refreshHotbar(); }
function selectSlot(i) { if (S.sel === i) return; S.sel = i; P.holdT = 0; Sound.play('move'); UI.refreshHotbar(); UI.showItemName(); }
function giveItem(id, n) {
  const left = addItem(id, n);
  if (left > 0) dropItem(id, left, P.x, P.y - 4);
}
function craft(r) {
  for (const [id, n] of Object.entries(r.need)) if (countItem(id) < n) { Sound.play('error'); UI.toastOnce("You don't have enough materials."); return; }
  if (!canAdd(r.id, r.qty)) { Sound.play('error'); UI.toastOnce('Your bag is full.'); return; }
  for (const [id, n] of Object.entries(r.need)) removeItem(id, n);
  addItem(r.id, r.qty);
  gainXP(XP.craft);
  Sound.play('harvest');
  UI.toast(`Crafted ${ITEMS[r.id].name}${r.qty > 1 ? ` ×${r.qty}` : ''}!`, r.id);
}

// ---------- Hero: stats, levels and equipment ----------
function recalcStats() {
  const a = S.attrs, g = { atk: 0, def: 0, hp: 0, sta: 0, speed: 0, crit: 0, block: 0 };
  for (const slot of EQUIP_SLOTS) { const id = S.equip[slot]; if (id && GEAR[id]) for (const [k, v] of Object.entries(GEAR[id].stats)) g[k] += v; }
  const w = S.equip.weapon && GEAR[S.equip.weapon];
  ST.atk = g.atk + a.str * 2 + (w ? 0 : 2);
  ST.def = g.def + Math.floor(a.vit / 2);
  ST.crit = 0.04 + a.agi * 0.01 + g.crit;
  ST.speed = 1 + a.agi * 0.015 + g.speed;
  ST.block = g.block;
  ST.swing = w ? w.swing : 0.26; ST.reach = w ? w.reach : 13; ST.knock = (w && w.knock) || 1;
  ST.toolPow = 1 + Math.floor(a.str / 5);
  S.maxHp = 90 + a.vit * 10 + g.hp + (S.level - 1) * 3;
  S.maxSta = 90 + a.end * 10 + g.sta;
  S.maxEnergy = 110 + a.end * 10;
  S.hp = Math.min(S.hp, S.maxHp); S.sta = Math.min(S.sta, S.maxSta); S.energy = Math.min(S.energy, S.maxEnergy);
}
// The hero's sprite is rebuilt from the equipped gear, and cached per outfit.
const heroCache = new Map();
function heroLook() {
  const L = Object.assign({}, LOOKS.player, { acc: [...LOOKS.player.acc] });
  const e = S ? S.equip : {}, v = id => id && GEAR[id] && GEAR[id].vis;
  if (v(e.head)) { L.helm = v(e.head); L.acc = L.acc.filter(a => a !== 'strawhat'); }
  if (v(e.body)) { L.shirt = v(e.body).c; L.armor = v(e.body).kind; }
  if (v(e.feet)) { L.boots = v(e.feet).c; L.tallBoots = true; }
  if (v(e.shield)) L.shield = v(e.shield);
  if (v(e.trinket)) L.amulet = v(e.trinket).c;
  return L;
}
function heroFrames() {
  const key = S ? EQUIP_SLOTS.map(k => S.equip[k] || '').join('|') : '';
  if (!heroCache.has(key)) heroCache.set(key, makeCharFrames(heroLook()));
  return heroCache.get(key);
}
function equipFrom(i) {
  const it = S.inv[i];
  if (!it || !isGear(it.id)) return;
  const slot = GEAR[it.id].slot, old = S.equip[slot];
  S.equip[slot] = it.id;
  S.inv[i] = old ? { id: old, n: 1 } : null;
  recalcStats(); invChanged();
  Sound.play('equip');
  UI.toast(`Equipped ${ITEMS[it.id].name}.`, it.id);
}
function unequip(slot) {
  const id = S.equip[slot];
  if (!id) return;
  if (!canAdd(id)) { Sound.play('error'); UI.toastOnce('Your bag is full.'); return; }
  S.equip[slot] = null; addItem(id, 1);
  recalcStats();
  Sound.play('equip');
}
function gainXP(n, x, y) {
  if (!n) return;
  S.xp += n;
  if (x != null) floatText(x, y, `+${n} XP`, '#d8b8ff');
  while (S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level); S.level++; S.points += 3;
    recalcStats(); S.hp = S.maxHp; S.sta = S.maxSta;
    Sound.play('levelup'); burst(P.x, P.y - 14, '#ffe58a', 24); burst(P.x, P.y - 14, '#d8b8ff', 16);
    floatText(P.x, P.y - 40, 'LEVEL UP!', '#ffe58a');
    UI.toast(`Level ${S.level}! You have ${S.points} attribute point${S.points > 1 ? 's' : ''} to spend in Bag → Hero.`);
  }
}
function spendPoint(attr) {
  if (S.points <= 0) return;
  S.points--; S.attrs[attr]++;
  const before = S.maxHp, sb = S.maxSta;
  recalcStats();
  S.hp += S.maxHp - before; S.sta += S.maxSta - sb;
}
// Older saves predate levels and gear.
function migrateSave() {
  if (!S.attrs) S.attrs = { str: 1, vit: 1, agi: 1, end: 1 };
  if (S.level == null) { S.level = 1; S.xp = 0; S.points = 0; }
  if (!S.equip) {
    S.equip = { weapon: null, shield: null, head: null, body: null, feet: null, trinket: null };
    const si = S.inv.findIndex(x => x && x.id === 'sword');
    if (si >= 0) S.inv[si] = null;
    S.equip.weapon = 'sword'; S.equip.shield = 'buckler';
  }
  if (S.sta == null) S.sta = 100;
  if (S.dungeonMax == null) S.dungeonMax = 0;
}

// ---------- Game start / save / load ----------
function freshFriends() { const f = {}; for (const id of Object.keys(NPCS)) f[id] = { pts: 0, talked: false, gifted: false, met: false, count: 0 }; return f; }
function newGame() {
  DUN.floor = 0;
  genWorld();
  S = {
    v: 1, day: 1, season: 0, year: 1, time: DAY_START, gold: 500, energy: 120, maxEnergy: 120, hp: 100, maxHp: 100,
    inv: new Array(36).fill(null), invSize: 24, sel: 0, water: 40, canMax: 40, weather: 'sun', tomorrow: 'sun',
    crate: [], friends: freshFriends(), stats: { wood: 0, harvest: 0, shards: 0, shipped: 0, talked: [], pumpkin: 0 }, quest: 0, wellDay: 0,
  };
  [['hoe', 1], ['can', 1], ['axe', 1], ['pick', 1], ['seed_carrot', 15], ['seed_bloom', 4]].forEach(([id, n], i) => { S.inv[i] = { id, n }; });
  S.level = 1; S.xp = 0; S.points = 0; S.attrs = { str: 1, vit: 1, agi: 1, end: 1 }; S.sta = 100;
  S.equip = { weapon: 'sword', shield: 'buckler', head: null, body: null, feet: null, trinket: null };
  placePlayerHome();
  startPlaying();
  saveGame();
  UI.say({ name: 'A letter from Elder Oswin', portrait: PORTRAIT_URL.oswin }, [
    "Dear child, welcome to Fernhollow. Your grandmother's farm is yours now. Weeds, stones, and all.",
    'Clear a patch of land, till it with your hoe, plant your seeds, and water them every morning.',
    'Ship your harvest in the Market Crate beside the house. It sells overnight. Your bed is through the front door.',
    "When you're settled, come find me by the fountain in town. Take the path west, over the bridge. — Oswin",
  ]);
}
function serialize() {
  const enc = a => { let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(48 + a[i]); return s; };
  const wet = []; for (let i = 0; i < OVERWORLD.wet.length; i++) if (OVERWORLD.wet[i]) wet.push(i);
  // Always save the overworld; saving underground puts you back at the cave mouth
  const Wd = OVERWORLD, p = inDungeon() ? { x: (CAVE.x + 1) * TS + 8, y: (CAVE.y + 2) * TS + 12, dir: 0 } : { x: P.x, y: P.y, dir: P.dir };
  return { s: S, p, w: { g: enc(Wd.ground), o: enc(Wd.obj), wet, c: [...Wd.crops].map(([i, c]) => [i, c.id, c.age, c.ready ? 1 : 0]) }, savedAt: Date.now() };
}
function saveGame() { if (!S) return false; return Store.set(SAVE_KEY, serialize()); }
function continueGame() {
  const d = Store.get(SAVE_KEY, null);
  if (!d || !d.s) { UI.toast('No save found.'); return; }
  DUN.floor = 0;
  genWorld();
  const dec = (str, a) => { for (let i = 0; i < a.length && i < str.length; i++) a[i] = str.charCodeAt(i) - 48; };
  dec(d.w.g, World.ground); dec(d.w.o, World.obj);
  for (const i of d.w.wet) World.wet[i] = 1;
  for (const [i, id, age, ready] of d.w.c) if (CROPS[id]) World.crops.set(i, { id, age, ready: !!ready });
  restampStatic();
  S = d.s;
  S.friends = Object.assign(freshFriends(), S.friends || {});
  S.stats = Object.assign({ wood: 0, harvest: 0, shards: 0, shipped: 0, talked: [], pumpkin: 0 }, S.stats || {});
  migrateSave();
  P.x = d.p.x; P.y = d.p.y; P.dir = d.p.dir || 0;
  if (!boxFree(P.x, P.y)) placePlayerHome();
  startPlaying();
  UI.toast(`Welcome back! ${SEASONS[S.season]} ${S.day}, Year ${S.year}.`);
}
function startPlaying() {
  playing = true;
  UI.closeAll();
  SEAS = buildSeason(S.season);
  enemies = []; drops = []; parts = []; floats = [];
  P.toolT = 0; P.hurtT = 0; P.kx = P.ky = 0; P.swingT = 0; P.rollT = 0; P.blocking = false;
  recalcStats();
  spawnNPCs();
  document.getElementById('hud').classList.remove('hidden');
  updateTouchVisibility();
  UI.refreshHotbar();
  snapCamera();
}
function quitToTitle() { saveGame(); playing = false; UI.closeAll(); document.getElementById('hud').classList.add('hidden'); updateTouchVisibility(); UI.openTitle(); }
function exitGame() {
  if (playing) saveGame();
  playing = false;
  UI.closeAll();
  document.getElementById('hud').classList.add('hidden');
  updateTouchVisibility();
  try { window.close(); } catch (e) { /* browsers only allow closing windows opened by script */ }
  setTimeout(() => UI.openFarewell(), 250);
}
function openPause() { if (playing && !UI.stack.length) { Sound.play('ok'); UI.openPause(); } }
function placePlayerHome() { P.x = SPAWN.x * TS + 8; P.y = SPAWN.y * TS + 12; P.dir = 0; }

// ---------- Collision ----------
function boxFree(x, y) {
  const l = x - 5, r = x + 4, t = y - 5, b = y - 1;
  return !(solidTile(Math.floor(l / TS), Math.floor(t / TS)) || solidTile(Math.floor(r / TS), Math.floor(t / TS)) ||
    solidTile(Math.floor(l / TS), Math.floor(b / TS)) || solidTile(Math.floor(r / TS), Math.floor(b / TS)));
}
function tryMove(dx, dy) {
  if (dx) {
    const nx = P.x + dx;
    if (boxFree(nx, P.y)) P.x = nx;
    else if (!dy) { if (boxFree(nx, P.y - 5)) P.y -= 0.8; else if (boxFree(nx, P.y + 5)) P.y += 0.8; }
  }
  if (dy) {
    const ny = P.y + dy;
    if (boxFree(P.x, ny)) P.y = ny;
    else if (!dx) { if (boxFree(P.x - 5, ny)) P.x -= 0.8; else if (boxFree(P.x + 5, ny)) P.x += 0.8; }
  }
}

// ---------- Unstuck ----------
function regionSize(sx, sy, cap) {
  const seen = new Set([idx(sx, sy)]), q = [[sx, sy]];
  for (let qi = 0; qi < q.length && seen.size < cap; qi++) {
    const [x, y] = q[qi];
    for (const [dx, dy] of DIRV) {
      const nx = x + dx, ny = y + dy;
      if (!inb(nx, ny) || seen.has(idx(nx, ny)) || solidTile(nx, ny)) continue;
      seen.add(idx(nx, ny)); q.push([nx, ny]);
    }
  }
  return seen.size;
}
function unstuck(home) {
  if (home) exitDungeon(true);
  P.kx = P.ky = 0; P.toolT = 0;
  if (!home) {
    const cx = Math.floor(P.x / TS), cy = Math.floor((P.y - 3) / TS);
    let best = null, bd = 1e9;
    for (let r = 0; r <= 12 && !best; r++) {
      for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== r || !inb(x, y) || solidTile(x, y)) continue;
        const d = (x - cx) ** 2 + (y - cy) ** 2;
        if (d < bd && regionSize(x, y, 80) >= 80) { bd = d; best = [x, y]; }
      }
    }
    if (best) { P.x = best[0] * TS + 8; P.y = best[1] * TS + 12; snapCamera(); UI.toast('You wriggle free!'); return; }
  }
  placePlayerHome(); snapCamera();
  UI.toast('You found your way back to the farmhouse.');
}

// ---------- Per-frame update ----------
function update(dt) {
  S.time += dt * MIN_PER_SEC;
  if (S.time >= DAY_END) { endDay(true); return; }
  updatePlayer(dt);
  if (!inDungeon()) updateNPCs(dt);
  updateEnemies(dt);
  updateShots(dt);
  updateDrops(dt);
  updateFx(dt);
  for (const [k, v] of shakes) { if (v - dt <= 0) shakes.delete(k); else shakes.set(k, v - dt); }
  questT -= dt;
  if (questT <= 0) { questT = 0.5; checkQuests(); }
  hint = getInteract();
  followCamera(dt);
}

const ROAD = new Set([GND.PATH, GND.PLAZA, GND.BRIDGE]);
function spendSta(n) { S.sta = Math.max(0, S.sta - n); P.staDelay = 0.8; }
function updatePlayer(dt) {
  if (P.hurtT > 0) P.hurtT -= dt;
  if (P.useCD > 0) P.useCD -= dt;
  if (P.rollCD > 0) P.rollCD -= dt;
  if (P.staDelay > 0) P.staDelay -= dt;
  if (Math.abs(P.kx) + Math.abs(P.ky) > 4) {
    tryMove(P.kx * dt, P.ky * dt);
    const f = Math.pow(0.002, dt); P.kx *= f; P.ky *= f;
  } else P.kx = P.ky = 0;

  // Dive roll: a quick dash you can't be hurt during
  if (P.rollT > 0) {
    P.rollT -= dt;
    tryMove(P.rollVx * dt, P.rollVy * dt);
    P.blocking = P.sprinting = false;
    P.target = computeTarget();
    return;
  }
  let mx = Input.moveX, my = Input.moveY;
  if (P.toolT > 0) {
    P.toolT -= dt;
    if (!P.toolDone && P.toolT <= P.toolDur * 0.5) { P.toolDone = true; applyTool(P.toolId); }
    mx = my = 0;
  }
  let slow = 1;
  if (P.swingT > 0) {
    P.swingT -= dt; slow = 0.35;
    if (!P.swingDone && P.swingT <= P.swingDur * 0.5) { P.swingDone = true; weaponHit(); }
  }
  // Block: hold to raise your shield
  const wantBlock = Input.blockHeld() && P.toolT <= 0 && P.swingT <= 0;
  if (wantBlock && !S.equip.shield) UI.toastOnce('Equip a shield to block (Bag → Hero).');
  P.blocking = wantBlock && !!S.equip.shield && S.sta > 0;
  if (P.blocking) slow = 0.45;

  const m = Math.hypot(mx, my);
  P.sprinting = Input.sprintHeld() && m > 0.3 && !P.blocking && P.swingT <= 0 && S.sta > 0;
  if (m > 0.12) {
    if (!P.blocking || P.swingT > 0) P.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 2 : 3) : (my < 0 ? 1 : 0);
    const onRoad = ROAD.has(gAt(Math.floor(P.x / TS), Math.floor((P.y - 3) / TS)));
    const sp = 82 * ST.speed * Math.min(1, m) * slow * (onRoad ? 1.25 : 1) * (P.sprinting ? 1.6 : 1);
    tryMove(mx / Math.max(m, 1) * sp * dt, my / Math.max(m, 1) * sp * dt);
    P.moving = true; P.animT += dt * 8 * Math.max(0.6, Math.min(1, m)) * (P.sprinting ? 1.5 : 1); P.frame = Math.floor(P.animT) % 4;
    if (P.sprinting) {
      spendSta(20 * dt); P.staDelay = 0.6;
      P.dustT -= dt;
      if (P.dustT <= 0) { P.dustT = 0.09; parts.push({ x: P.x + (Math.random() - 0.5) * 6, y: P.y - 1, vx: -mx * 20, vy: -8, g: 0, life: 0.35, t: 0, c: 'rgba(220,200,160,.8)', s: 2 }); }
    }
  } else { P.moving = false; P.frame = 0; P.animT = 0; }
  // Stamina comes back when you're not spending it
  if (P.staDelay <= 0 && !P.sprinting && !P.blocking) S.sta = Math.min(S.maxSta, S.sta + 30 * dt);

  if (Settings.god) { S.sta = S.maxSta; S.energy = S.maxEnergy; S.hp = S.maxHp; S.water = S.canMax; }
  // Hold-to-repeat for tools and attacks
  if (Input.useHeld()) {
    P.holdT += dt;
    const it = S.inv[S.sel];
    if (P.holdT > 0.28 && P.toolT <= 0 && P.useCD <= 0 && it && ['tool', 'seed', 'place'].includes(ITEMS[it.id].cat)) useItem();
  } else P.holdT = 0;
  if (Input.attackHeld()) { P.atkHold += dt; if (P.atkHold > 0.3 && P.swingT <= 0) attack(true); } else P.atkHold = 0;
  P.target = computeTarget();
}

function attack(quiet) {
  if (P.swingT > 0 || P.toolT > 0 || P.rollT > 0 || P.blocking) return;
  if (!S.equip.weapon) { if (!quiet) UI.toastOnce('Equip a weapon in Bag → Hero.'); return; }
  if (S.sta < 6) { if (!quiet) { Sound.play('error'); UI.toastOnce("You're out of stamina. Catch your breath!"); } return; }
  spendSta(6);
  P.swingT = P.swingDur = ST.swing; P.swingDone = false;
  Sound.play('swing');
}
function roll() {
  if (P.rollT > 0 || P.rollCD > 0 || P.toolT > 0) return;
  if (S.sta < 18) { Sound.play('error'); UI.toastOnce("You're out of stamina. Catch your breath!"); return; }
  spendSta(18);
  let mx = Input.moveX, my = Input.moveY;
  if (Math.hypot(mx, my) < 0.2) [mx, my] = DIRV[P.dir];
  const m = Math.hypot(mx, my) || 1;
  P.rollVx = mx / m * 210; P.rollVy = my / m * 210;
  P.rollT = P.rollDur = 0.34; P.rollCD = 0.55; P.swingT = 0; P.kx = P.ky = 0;
  P.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 2 : 3) : (my < 0 ? 1 : 0);
  Sound.play('roll');
  burst(P.x, P.y - 2, 'rgba(220,200,160,.9)', 6);
}

function computeTarget(useMouse) {
  const m = Input.mouse, ptx = Math.floor(P.x / TS), pty = Math.floor((P.y - 5) / TS);
  if (Input.mode === 'kb' && m.over && (useMouse || clock - m.t < 2.5)) {
    const rect = canvas.getBoundingClientRect();
    const wx = (m.x - rect.left) / SCALE + cam.x, wy = (m.y - rect.top) / SCALE + cam.y;
    const tx = Math.floor(wx / TS), ty = Math.floor(wy / TS);
    if (Math.max(Math.abs(tx - ptx), Math.abs(ty - pty)) <= 1) return [tx, ty];
  }
  const [dx, dy] = DIRV[P.dir];
  return [Math.floor((P.x + dx * 13) / TS), Math.floor((P.y - 5 + dy * 13) / TS)];
}
function faceTile(tx, ty) {
  const dx = tx * TS + 8 - P.x, dy = ty * TS + 8 - (P.y - 6);
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
  P.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
}

// ---------- Actions ----------
const Game = {
  handle(e) {
    if (!playing) return;
    switch (e.a) {
      case 'use': if (e.mouse) { P.target = computeTarget(true); faceTile(...P.target); } useItem(); break;
      case 'interact': if (e.mouse) { P.target = computeTarget(true); faceTile(...P.target); hint = getInteract(); } if (hint && P.toolT <= 0) hint.run(); break;
      case 'attack': attack(); break;
      case 'roll': case 'back': roll(); break;
      case 'menu': openPause(); break;
      case 'inventory': Sound.play('ok'); UI.openInventory('items'); break;
      case 'hero': Sound.play('ok'); UI.openInventory('hero'); break;
      case 'map': Sound.play('ok'); UI.openMap(); break;
      case 'hotPrev': selectSlot((S.sel + 11) % 12); break;
      case 'hotNext': selectSlot((S.sel + 1) % 12); break;
      default: if (e.a.startsWith('hot')) selectSlot(+e.a.slice(3));
    }
  },
};

function useItem() {
  if (P.toolT > 0 || P.useCD > 0 || P.rollT > 0 || P.swingT > 0) return;
  const it = S.inv[S.sel];
  if (!it) return;
  const d = ITEMS[it.id], [tx, ty] = P.target;
  if (d.cat === 'gear') { P.useCD = 0.3; equipFrom(S.sel); return; }
  if (d.cat === 'tool') {
    const cost = { hoe: 2, can: 1, axe: 2, pick: 2 }[it.id];
    if (S.energy < cost) { Sound.play('error'); UI.toastOnce("You're too tired. Eat something or get some sleep."); return; }
    S.energy -= cost;
    P.toolId = it.id; P.toolT = P.toolDur = 0.32; P.toolDone = false;
    Sound.play('swing');
    return;
  }
  P.useCD = 0.16;
  if (d.cat === 'seed') return plantSeed(tx, ty, it);
  if (d.place) return placeObj(tx, ty, it);
  if (it.id === 'dust') return useDust(tx, ty);
  if (it.id === 'rope') { if (inDungeon()) { removeAt(S.sel, 1); exitDungeon(); } else UI.toastOnce('Escape Ropes only work in Moonfall Depths.'); return; }
  if (d.food) return eat(it);
  P.useCD = 0.6;
  UI.toastOnce('Ship this in the Market Crate, sell it at a shop, or give it to a villager.');
}

function applyTool(id) {
  const [tx, ty] = P.target;
  if (!inb(tx, ty)) return;
  const i = idx(tx, ty), g = World.ground[i], o = World.obj[i];
  if (id === 'can') {
    if (g === GND.WATER) { S.water = S.canMax; Sound.play('water'); floatText(tx * TS + 8, ty * TS, 'Refilled!', '#a8e0ff'); burst(tx * TS + 8, ty * TS + 8, '#7ab8ff', 8); invChanged(); return; }
    if (S.water <= 0) { Sound.play('error'); UI.toastOnce('Your watering can is empty. Refill it at a pond or the river.'); return; }
    S.water--; Sound.play('water'); burst(tx * TS + 8, ty * TS + 10, '#7ab8ff', 6);
    if (g === GND.TILLED) World.wet[i] = 1;
    invChanged();
    return;
  }
  if (World.bmap[i] >= 0) { Sound.play('clink'); return; }
  if (o) { hitObj(tx, ty, id); return; }
  if (id === 'hoe') {
    if (g === GND.TILLED) return;
    if (!inFarm(tx, ty)) { Sound.play('clink'); UI.toastOnce('This ground is too wild to farm. Till the soil on your farm.'); return; }
    if (g === GND.GRASS || g === GND.PATH || g === GND.SAND) { World.ground[i] = GND.TILLED; Sound.play('hoe'); burst(tx * TS + 8, ty * TS + 10, '#8a6240', 6); }
    return;
  }
  if (id === 'pick' && g === GND.TILLED && !World.crops.has(i)) { World.ground[i] = GND.GRASS; World.wet[i] = 0; Sound.play('hoe'); return; }
  if (id === 'axe' || id === 'pick') Sound.play('clink');
}

function hitObj(tx, ty, tool) {
  const i = idx(tx, ty), o = World.obj[i], inf = OBJ_INFO[o];
  if (!inf || inf.forage) return;
  if (!inf.hp) { Sound.play('clink'); return; }
  if (!(inf.tool === tool || (inf.tool === 'any' && tool !== 'can'))) { Sound.play('clink'); shakes.set(i, 0.15); UI.toastOnce(`You need ${TOOL_NAMES[inf.tool]} for that.`); return; }
  const hp = Settings.onehit ? 0 : (World.hp.get(i) ?? inf.hp) - (tool === 'sword' ? 1 : ST.toolPow);
  shakes.set(i, 0.22);
  Sound.play(tool === 'axe' ? 'chop' : tool === 'pick' ? 'pick' : 'swing');
  burst(tx * TS + 8, ty * TS + 8, inf.pc, 5);
  Input.rumble(0.25, 50);
  if (hp > 0) { World.hp.set(i, hp); return; }
  World.hp.delete(i);
  gainXP({ [OB.OAK]: XP.tree, [OB.PINE]: XP.tree, [OB.STUMP]: XP.stump, [OB.ROCK]: XP.rock, [OB.ORE]: XP.ore, [OB.CRYSTAL]: XP.crystal, [OB.BOULDER]: XP.boulder, [OB.BUSH]: XP.bush, [OB.TWIG]: XP.twig, [OB.WEED]: XP.weed }[o] || 0);
  World.obj[i] = inf.becomes || 0;
  if (inf.give) dropItem(inf.give, 1, tx * TS + 8, ty * TS + 8);
  for (const [id, a, b] of inf.drops || []) { const n = ri(a, b); if (n > 0) dropItem(id, n, tx * TS + 8, ty * TS + 8); }
  if (inf.gems) { dropItem(Math.random() < (DUN.floor >= 10 ? 0.45 : 0.15) ? 'sapphire' : 'ruby', 1, tx * TS + 8, ty * TS + 8); gainXP(XP.gem); }
  if (o === OB.DARKORE) gainXP(XP.darkore);
  Sound.play('break');
  burst(tx * TS + 8, ty * TS + 6, inf.pc, 12);
}

function plantSeed(tx, ty, it) {
  const i = idx(tx, ty);
  if (!inb(tx, ty) || World.ground[i] !== GND.TILLED) { UI.toastOnce('Seeds need tilled soil. Use your hoe on your farm first.'); return; }
  if (World.crops.has(i) || World.obj[i]) return;
  const cid = ITEMS[it.id].crop, c = CROPS[cid];
  if (!c.seasons.includes(S.season)) { Sound.play('error'); UI.toastOnce(`${c.name} won't grow in ${SEASONS[S.season]}.`); return; }
  World.crops.set(i, { id: cid, age: 0, ready: false });
  removeAt(S.sel, 1);
  Sound.play('plant');
  burst(tx * TS + 8, ty * TS + 12, '#5a3b22', 4);
}
function placeObj(tx, ty, it) {
  if (inDungeon()) { Sound.play('error'); UI.toastOnce("You can't build down here."); return; }
  const i = idx(tx, ty);
  if (!inb(tx, ty) || World.obj[i] || World.bmap[i] >= 0 || World.crops.has(i)) { Sound.play('error'); UI.toastOnce("You can't place that there."); return; }
  const g = World.ground[i];
  if (blockedGround(g) || g === GND.BRIDGE) { Sound.play('error'); UI.toastOnce("You can't place that there."); return; }
  const l = P.x - 5, r = P.x + 4, t = P.y - 5, b = P.y - 1;
  if (r >= tx * TS && l < tx * TS + TS && b >= ty * TS && t < ty * TS + TS) { Sound.play('error'); UI.toastOnce("You're standing there!"); return; }
  World.obj[i] = PLACE_OBJ[ITEMS[it.id].place];
  removeAt(S.sel, 1);
  Sound.play('hoe');
}
function useDust(tx, ty) {
  const c = World.crops.get(idx(tx, ty));
  if (!c || c.ready) { UI.toastOnce('Sprinkle Growth Dust on a growing crop.'); return; }
  c.age++;
  if (c.age >= CROPS[c.id].days) c.ready = true;
  removeAt(S.sel, 1);
  Sound.play('magic');
  burst(tx * TS + 8, ty * TS + 6, '#ffe58a', 10);
}
function eat(it) {
  const d = ITEMS[it.id];
  if (S.energy >= S.maxEnergy && S.hp >= S.maxHp) { UI.toastOnce("You're not hungry right now."); return; }
  S.energy = Math.min(S.maxEnergy, S.energy + d.food);
  S.hp = Math.min(S.maxHp, S.hp + (d.heal || Math.round(d.food / 2)));
  removeAt(S.sel, 1);
  Sound.play('eat');
  floatText(P.x, P.y - 30, `+${d.food} energy`, '#9ff07a');
  P.useCD = 0.5;
}

// ---------- Interactions ----------
function getInteract() {
  if (!S) return null;
  const [tx, ty] = P.target;
  // Doors, the crate and signs win when you're facing them directly
  if (buildingAt(tx, ty) || [OB.CRATE, OB.SIGN].includes(oAt(tx, ty))) { const h = tileInteract(tx, ty); if (h) return h; }
  const [dx, dy] = DIRV[P.dir], fx = P.x + dx * 12, fy = P.y - 6 + dy * 12;
  let best = null, bd = 18;
  for (const n of npcs) { if (!n.visible) continue; const d = dist(fx, fy, n.x, n.y - 8); if (d < bd) { bd = d; best = n; } }
  if (best) {
    const it = S.inv[S.sel], f = S.friends[best.id];
    const gift = it && !isTool(it.id) && !isGear(it.id) && f.met && !f.gifted;
    const n = best;
    return { label: gift ? `Give ${ITEMS[it.id].name}` : 'Talk', x: n.x, y: n.y - 30, run: () => talkTo(n, gift) };
  }
  const h = tileInteract(tx, ty);
  if (h) return h;
  return tileInteract(Math.floor(P.x / TS), Math.floor((P.y - 3) / TS), true);
}
function tileInteract(tx, ty, underfoot) {
  if (!inb(tx, ty)) return null;
  const i = idx(tx, ty), X = tx * TS + 8, Y = ty * TS - 2;
  if (!underfoot) {
    const b = buildingAt(tx, ty);
    if (b) {
      if (!b.any && !(b.doorTile && b.doorTile[0] === tx && b.doorTile[1] === ty)) return null;
      return { label: b.label, x: X, y: b.any ? b.y * TS + 6 : Y, run: () => buildingAction(b) };
    }
    const o = World.obj[i];
    if (o === OB.CRATE) {
      const it = S.inv[S.sel], ok = it && ITEMS[it.id].sell && !isTool(it.id);
      return { label: ok ? `Ship ${ITEMS[it.id].name}` : 'Market Crate', x: X, y: Y, run: shipSelected };
    }
    if (o === OB.TESTCHEST) return { label: 'Playtest Chest', x: X, y: Y, run: () => UI.openTestChest() };
    if (o === OB.STAIRS) return { label: `Descend to floor ${DUN.floor + 1}`, x: X, y: Y, run: () => enterDungeon(DUN.floor + 1) };
    if (o === OB.LADDER) return { label: 'Climb to the surface', x: X, y: Y - 16, run: () => exitDungeon() };
    if (o === OB.LOOT) return { label: 'Open', x: X, y: Y, run: () => openLootChest(tx, ty) };
    if (o === OB.SIGN || o === OB.LOVESIGN) return { label: 'Read', x: X, y: Y, run: () => UI.say({ name: 'Signpost', portrait: o === OB.LOVESIGN ? SPR.lovesign.toDataURL() : ICON_URL.fence }, [World.signs.get(i) || '...']) };
    if (World.ground[i] === GND.WATER && S.inv[S.sel] && S.inv[S.sel].id === 'can' && S.water < S.canMax) return null;
  }
  const o = World.obj[i];
  if (OBJ_INFO[o] && OBJ_INFO[o].forage) return { label: 'Pick', x: X, y: Y, run: () => pickForage(tx, ty) };
  const c = World.crops.get(i);
  if (c && c.ready) return { label: 'Harvest', x: X, y: Y, run: () => harvest(tx, ty) };
  return null;
}
function pickForage(tx, ty) {
  const i = idx(tx, ty), id = OBJ_INFO[World.obj[i]].forage;
  if (!canAdd(id)) { Sound.play('error'); UI.toastOnce('Your bag is full.'); return; }
  World.obj[i] = 0;
  addItem(id, 1);
  gainXP(XP.forage);
  Sound.play('pickup');
  floatText(tx * TS + 8, ty * TS, `+1 ${ITEMS[id].name}`, '#fff3d0');
}
function harvest(tx, ty) {
  const i = idx(tx, ty), c = World.crops.get(i), cr = CROPS[c.id];
  const n = c.id === 'berry' ? ri(2, 3) : Math.random() < 0.15 ? 2 : 1;
  if (!canAdd(c.id, n)) { Sound.play('error'); UI.toastOnce('Your bag is full.'); return; }
  addItem(c.id, n);
  S.stats.harvest++;
  gainXP(2 + Math.round(cr.sell / 25), tx * TS + 8, ty * TS - 10);
  if (c.id === 'pumpkin') S.stats.pumpkin++;
  if (cr.regrow) { c.ready = false; c.age = cr.days - cr.regrow; } else World.crops.delete(i);
  Sound.play('harvest');
  burst(tx * TS + 8, ty * TS + 6, cr.fruit, 8);
  floatText(tx * TS + 8, ty * TS, `+${n} ${cr.name}`, '#fff3d0');
}
function shipSelected() {
  const it = S.inv[S.sel];
  if (it && ITEMS[it.id].sell && !isTool(it.id)) {
    S.crate.push({ id: it.id, n: it.n });
    S.inv[S.sel] = null; invChanged();
    Sound.play('ship');
    UI.toast(`Shipped ${ITEMS[it.id].name} ×${it.n}. It sells overnight.`, it.id);
  } else {
    const v = S.crate.reduce((a, c) => a + ITEMS[c.id].sell * c.n, 0);
    UI.toast(S.crate.length ? `The crate holds ${v.toLocaleString()}g of goods. They sell tonight.` : 'Hold an item and use the crate to ship it. Goods sell overnight.');
  }
}
function buildingAction(b) {
  switch (b.action) {
    case 'sleep':
      UI.confirm(S.time < 18 * 60 ? "It's still early. Go to bed and end the day?" : 'Go to bed and end the day?', [{ label: 'Sleep', run: () => endDay(false) }, { label: 'Not yet', cancel: true }]);
      break;
    case 'shop': {
      const sh = SHOPS[b.shop], owner = npcs.find(n => n.id === sh.owner), h = sh.always ? [0, 24] : NPCS[sh.owner].hours;
      if (sh.always || (owner && owner.visible)) { Sound.play('ok'); UI.openShop(b.shop); }
      else UI.toast(`${sh.name} is closed. Open ${fmtTime(h[0] * 60)} to ${fmtTime(h[1] * 60)}.`);
      break;
    }
    case 'msg': UI.toast(b.msg); break;
    case 'dungeon': dungeonPrompt(); break;
    case 'moonwell':
      if (S.wellDay === dayKey()) { UI.toast('The Moonwell is still. Come back tomorrow.'); return; }
      S.wellDay = dayKey(); S.energy = S.maxEnergy; S.hp = S.maxHp;
      Sound.play('magic'); burst(P.x, P.y - 10, '#a8e0ff', 20); burst(P.x, P.y - 10, '#ffffff', 10);
      UI.toast("The Moonwell's light washes over you. Energy and health restored!");
      break;
    case 'fountain':
      if (S.gold < 1) { UI.toast('You have no coins to toss.'); return; }
      S.gold -= 1; Sound.play('coin'); burst(b.x * TS + 24, b.y * TS + 26, '#ffe58a', 6);
      UI.toast(`You toss a coin. ${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}`);
      break;
  }
}
function talkTo(n, gift) {
  const f = S.friends[n.id], d = NPCS[n.id];
  const dx = P.x - n.x, dy = P.y - n.y;
  n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
  n.pause = 4;
  if (!S.stats.talked.includes(n.id)) S.stats.talked.push(n.id);
  if (gift) {
    const it = S.inv[S.sel], id = it.id;
    const tier = d.loves.includes(id) ? 'love' : d.likes.includes(id) ? 'like' : d.hates.includes(id) ? 'hate' : 'neutral';
    const before = heartsOf(f.pts);
    f.pts = clamp(f.pts + { love: 45, like: 25, neutral: 10, hate: -15 }[tier] + (f.talked ? 0 : 10), 0, 300);
    f.gifted = true; f.talked = true;
    removeAt(S.sel, 1);
    Sound.play(tier === 'hate' ? 'error' : 'harvest');
    if (tier !== 'hate') floatText(n.x, n.y - 32, '♥', '#ff6a8a');
    const lines = GIFT_LINES[tier];
    UI.say(n.id, [lines[Math.floor(Math.random() * lines.length)]], () => { if (heartsOf(f.pts) > before) UI.toast(`You and ${d.name} are now ${heartsOf(f.pts)}-heart friends!`); });
    return;
  }
  let lines;
  if (!f.met) { f.met = true; lines = [d.intro]; }
  else {
    const pool = [...d.lines, d.season[S.season]];
    if (S.weather === 'rain') pool.push(...d.rain);
    if (heartsOf(f.pts) >= 3) pool.push(...d.hearts);
    lines = [pool[(dayKey() * 7 + f.count * 3 + n.id.length) % pool.length]];
  }
  if (n.id === 'oswin') {
    const q = QUESTS[S.quest];
    lines.push(q ? `If you're looking for something to do: ${q.desc}` : 'You have done everything I could ask of you. Fernhollow is thriving.');
  }
  const before = heartsOf(f.pts);
  if (!f.talked) { f.talked = true; f.pts = Math.min(300, f.pts + 10); }
  f.count++;
  UI.say(n.id, lines, () => { if (heartsOf(f.pts) > before) UI.toast(`You and ${d.name} are now ${heartsOf(f.pts)}-heart friends!`); });
}

function checkQuests() {
  while (S.quest < QUESTS.length) {
    const q = QUESTS[S.quest];
    if (q.prog(S) < q.goal) break;
    S.quest++;
    if (q.reward.gold) S.gold += q.reward.gold;
    gainXP(30 * S.quest);
    for (const [id, n] of q.reward.items || []) giveItem(id, n);
    Sound.play('quest');
    UI.toast(`Task complete: ${q.title}! Reward: ${rewardText(q.reward)}`);
    const nq = QUESTS[S.quest];
    if (nq) setTimeout(() => UI.toast(`New task: ${nq.title}`), 1200);
  }
}

// ---------- Drops ----------
function dropItem(id, n, x, y) {
  drops.push({ id, n, x, y, z: 0, vz: -70 - Math.random() * 40, vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 30, t: 0 });
}
function updateDrops(dt) {
  for (const d of drops) {
    d.t += dt;
    if (d.t < 0.6) {
      d.vz += 260 * dt; d.z += d.vz * dt;
      if (d.z > 0) { d.z = 0; d.vz *= -0.4; }
      d.x += d.vx * dt; d.y += d.vy * dt;
      continue;
    }
    const dd = dist(d.x, d.y, P.x, P.y - 6);
    if (dd < 40 && canAdd(d.id, 1)) {
      const k = Math.min(1, dt * 9);
      d.x += (P.x - d.x) * k; d.y += (P.y - 6 - d.y) * k;
      if (dd < 8) {
        const left = addItem(d.id, d.n), got = d.n - left;
        if (got > 0) {
          if (d.id === 'wood') S.stats.wood += got;
          if (d.id === 'shard') S.stats.shards += got;
          Sound.play('pickup');
          floatText(P.x, P.y - 30, `+${got} ${ITEMS[d.id].name}`, '#fff3d0');
        }
        d.n = left;
      }
    }
  }
  drops = drops.filter(d => d.n > 0);
}

// ---------- NPCs ----------
function spawnNPCs() {
  npcs = Object.keys(NPCS).map(id => {
    const h = NPCS[id].home;
    return { id, x: h[0] * TS + 8, y: h[1] * TS + 12, dir: 0, frame: 0, animT: 0, tgt: null, wait: Math.random() * 3, pause: 0, visible: false };
  });
}
function npcBoxFree(x, y) {
  const l = x - 5, r = x + 4, t = y - 5, b = y - 1;
  for (const [px, py] of [[l, t], [r, t], [l, b], [r, b]]) {
    const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    if (solidTile(tx, ty) || gAt(tx, ty) === GND.TILLED) return false;
  }
  return true;
}
function updateNPCs(dt) {
  for (const n of npcs) {
    const d = NPCS[n.id], vis = S.time >= d.hours[0] * 60 && S.time < d.hours[1] * 60;
    if (vis && !n.visible) { n.x = d.home[0] * TS + 8; n.y = d.home[1] * TS + 12; n.tgt = null; }
    n.visible = vis;
    if (!vis) continue;
    if (n.pause > 0 || dist(n.x, n.y, P.x, P.y) < 24) { n.pause -= dt; n.frame = 0; continue; }
    if (!n.tgt) {
      n.wait -= dt; n.frame = 0;
      if (n.wait <= 0) {
        const tx = d.home[0] + ri(-3, 3), ty = d.home[1] + ri(-2, 2);
        if (!solidTile(tx, ty) && gAt(tx, ty) !== GND.TILLED) n.tgt = [tx * TS + 8, ty * TS + 12];
        n.wait = 1 + Math.random() * 4;
      }
      continue;
    }
    const dx = n.tgt[0] - n.x, dy = n.tgt[1] - n.y, m = Math.hypot(dx, dy);
    if (m < 1.5) { n.tgt = null; continue; }
    const sp = 26 * dt, mx = dx / m * Math.min(sp, m), my = dy / m * Math.min(sp, m);
    const ox = n.x, oy = n.y;
    if (npcBoxFree(n.x + mx, n.y)) n.x += mx;
    if (npcBoxFree(n.x, n.y + my)) n.y += my;
    if (n.x === ox && n.y === oy) { n.tgt = null; continue; }
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
    n.animT += dt * 6; n.frame = Math.floor(n.animT) % 4;
  }
}

// ---------- Enemies ----------
const ENEMY = {
  slime: { hp: 18, dmg: 7, spr: 'slime', drops: [['gel', 0.7], ['shard', 0.02]] },
  rockslime: { hp: 30, dmg: 10, spr: 'rockslime', drops: [['gel', 0.6], ['ore', 0.25], ['shard', 0.06]] },
  wisp: { hp: 14, dmg: 9, spr: 'wisp', fly: true, drops: [['gloom', 0.75], ['shard', 0.04]] },
  wolf: { hp: 34, dmg: 12, spr: 'wolf', drops: [['pelt', 0.6], ['shard', 0.05]] },
};
const safeZone = (x, y) => { const z = zoneAt(Math.floor(x / TS), Math.floor(y / TS)); return z === 'farm' || z === 'village'; };
function enemyFree(e, x, y) {
  if (safeZone(x, y)) return false;
  if (e.fly) return inb(Math.floor(x / TS), Math.floor(y / TS));
  const l = x - 5, r = x + 4, t = y - 5, b = y - 1;
  for (const [px, py] of [[l, t], [r, t], [l, b], [r, b]]) if (solidTile(Math.floor(px / TS), Math.floor(py / TS))) return false;
  return true;
}
function trySpawn() {
  const night = isNight();
  if (enemies.length >= (night ? 6 : 4) || Math.random() < 0.45) return;
  for (let k = 0; k < 6; k++) {
    const a = Math.random() * Math.PI * 2, r = (11 + Math.random() * 5) * TS;
    const x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r, tx = Math.floor(x / TS), ty = Math.floor(y / TS);
    if (!inb(tx, ty) || solidTile(tx, ty)) continue;
    const z = zoneAt(tx, ty);
    if (z === 'farm' || z === 'village' || z === 'lake') continue;
    let kind;
    if (z === 'wolfwood') kind = night && Math.random() < 0.3 ? 'wisp' : 'wolf';
    else if (night && Math.random() < 0.55) kind = 'wisp';
    else if (z === 'hills') kind = 'rockslime';
    else if (z === 'woods' || Math.random() < 0.3) kind = 'slime';
    else continue;
    const t = ENEMY[kind];
    enemies.push({ kind, x: tx * TS + 8, y: ty * TS + 12, hp: t.hp, max: t.hp, fly: !!t.fly, t: Math.random(), vx: 0, vy: 0, kx: 0, ky: 0, flash: 0, hop: 0, fade: 0 });
    return;
  }
}
function updateEnemies(dt) {
  spawnT -= dt;
  if (spawnT <= 0 && !inDungeon()) { spawnT = 1.6; trySpawn(); }
  for (const e of enemies) {
    const t = ENEMY[e.kind], d = dist(e.x, e.y, P.x, P.y);
    e.flash -= dt;
    if (!inDungeon() && (d > 26 * TS || (e.kind === 'wisp' && !isNight()))) { e.dead = true; continue; }
    if (e.fade < 1) e.fade = Math.min(1, e.fade + dt * 2);
    if (Math.abs(e.kx) + Math.abs(e.ky) > 4) {
      const nx = e.x + e.kx * dt, ny = e.y + e.ky * dt;
      if (enemyFree(e, nx, e.y)) e.x = nx; if (enemyFree(e, e.x, ny)) e.y = ny;
      const f = Math.pow(0.004, dt); e.kx *= f; e.ky *= f;
    } else if (e.kind === 'bat') {
      updateBat(e, d, dt);
    } else if (e.kind === 'skeleton') {
      updateSkeleton(e, d, dt);
    } else if (e.kind === 'wolf' || e.kind === 'goblin') {
      updateWolf(e, d, dt);
    } else if (e.fly) {
      if (d < 10 * TS) {
        const sp = 30 * dt, nx = e.x + (P.x - e.x) / d * sp, ny = e.y + (P.y - 6 - e.y) / d * sp + Math.sin(clock * 3 + e.t * 9) * 0.4;
        if (enemyFree(e, nx, ny)) { e.x = nx; e.y = ny; }
      }
    } else {
      e.t -= dt;
      if (e.hop > 0) {
        e.hop -= dt;
        const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
        if (enemyFree(e, nx, e.y)) e.x = nx; if (enemyFree(e, e.x, ny)) e.y = ny;
      } else if (e.t <= 0) {
        e.t = 0.7 + Math.random() * 0.7; e.hop = 0.32;
        let a;
        if (d < 7 * TS) a = Math.atan2(P.y - e.y, P.x - e.x) + (Math.random() - 0.5) * 0.5;
        else a = Math.random() * Math.PI * 2;
        e.vx = Math.cos(a) * 62; e.vy = Math.sin(a) * 62;
        if (d < 9 * TS && Math.random() < 0.3) Sound.play('slime');
      }
    }
    if (d < 11 && P.hurtT <= 0 && P.rollT <= 0 && e.fade > 0.5) hurtPlayer(e.dmg || t.dmg, e);
  }
  enemies = enemies.filter(e => !e.dead);
}
// Wolves prowl until they spot you, then chase and lunge.
function updateWolf(e, d, dt) {
  e.t -= dt; e.lunge = Math.max(0, (e.lunge || 0) - dt); e.cd = Math.max(0, (e.cd || 0) - dt);
  let vx = 0, vy = 0;
  e.detour = Math.max(0, (e.detour || 0) - dt);
  if (d < 9 * TS) {
    if (!e.alert) { e.alert = true; Sound.play(e.kind === 'wolf' ? 'howl' : 'goblin'); }
    const a = Math.atan2(P.y - e.y, P.x - e.x) + (e.detour > 0 ? e.side * 1.4 : 0);
    if (d < 2.6 * TS && e.cd <= 0) { e.lunge = 0.35; e.cd = 1.6; }
    const sp = e.lunge > 0 ? (e.lspd || 135) : d < 1.2 * TS ? 20 : (e.spd || 66);
    vx = Math.cos(a) * sp; vy = Math.sin(a) * sp;
  } else {
    e.alert = false;
    if (e.t <= 0) { e.t = 1 + Math.random() * 2; const a = Math.random() * Math.PI * 2, moving = Math.random() < 0.6; e.vx = moving ? Math.cos(a) * 26 : 0; e.vy = moving ? Math.sin(a) * 26 : 0; }
    vx = e.vx; vy = e.vy;
  }
  const nx = e.x + vx * dt, ny = e.y + vy * dt;
  let moved = false;
  if (enemyFree(e, nx, e.y)) { e.x = nx; moved = true; }
  if (enemyFree(e, e.x, ny)) { e.y = ny; moved = true; }
  if (!moved && (vx || vy)) { e.t = 0; if (e.detour <= 0) { e.detour = 0.5; e.side = Math.random() < 0.5 ? -1 : 1; } }
  if (Math.abs(vx) > 1) e.face = vx > 0 ? 1 : -1;
  e.run = Math.abs(vx) + Math.abs(vy) > 1;
}

function weaponHit() {
  const [dx, dy] = DIRV[P.dir], r = ST.reach, hx = P.x + dx * (r - 4), hy = P.y - 7 + dy * (r - 4);
  // Weapons also cut grass tufts in front of you
  const [tx, ty] = P.target;
  if (oAt(tx, ty) === OB.WEED) hitObj(tx, ty, 'sword');
  for (const e of enemies) {
    if (e.dead || dist(hx, hy, e.x, e.y - 6) > r) continue;
    const crit = Math.random() < ST.crit;
    const dmg = Settings.onehit ? 9999 : Math.max(1, Math.round(ST.atk * (0.9 + Math.random() * 0.2) * (crit ? 1.75 : 1)));
    e.hp -= dmg; e.flash = 0.15;
    const k = dist(e.x, e.y, P.x, P.y) || 1;
    e.kx = (e.x - P.x) / k * 170 * ST.knock; e.ky = (e.y - P.y) / k * 170 * ST.knock;
    e.hop = 0; e.lunge = 0; e.cd = 0.8;
    Sound.play(crit ? 'crit' : 'hit'); Input.rumble(crit ? 0.6 : 0.4, 70);
    floatText(e.x, e.y - 22, crit ? `${dmg}!` : `${dmg}`, crit ? '#ffe58a' : '#ffffff');
    burst(e.x, e.y - 6, { wisp: '#b8a4ff', rockslime: '#7aa0d8', wolf: '#c8ccd6' }[e.kind] || '#6ac24a', crit ? 12 : 6);
    if (e.hp <= 0) {
      e.dead = true; Sound.play('kill');
      burst(e.x, e.y - 6, '#ffffff', 10);
      for (const [id, p] of ENEMY[e.kind].drops) if (Math.random() < p) dropItem(id, 1, e.x, e.y - 4);
      if (e.set) { // dungeon monsters: extra loot that improves with depth
        const gd = DMOBS[e.kind].gold; if (gd) { const gold = ri(...gd) * (1 + e.tier); S.gold += gold; floatText(e.x, e.y - 40, `+${gold}g`, '#ffe58a'); }
        if (Math.random() < 0.03 + e.tier * 0.02) dropItem(e.tier >= 2 && Math.random() < 0.5 ? 'sapphire' : 'ruby', 1, e.x, e.y - 4);
        if (e.tier >= 2 && Math.random() < 0.25) dropItem('darkiron', 1, e.x, e.y - 4);
      }
      gainXP(Math.round((XP[e.kind] || 5) * (1 + (e.pow || 0) * 0.05)), e.x, e.y - 30);
    }
  }
}
function hurtPlayer(raw, e) {
  if (Settings.god) { P.hurtT = 0.6; floatText(P.x, P.y - 30, 'God mode', '#ffe58a'); return; }
  // Armor soaks part of every hit; a raised shield stops much more but costs stamina
  let dmg = raw * (1 - ST.def / (ST.def + 20));
  const k = dist(e.x, e.y, P.x, P.y) || 1;
  let push = 190;
  if (P.blocking) {
    dmg *= 1 - ST.block; push = 90;
    spendSta(8 + raw);
    Sound.play('block'); Input.rumble(0.4, 90);
    burst(P.x + DIRV[P.dir][0] * 8, P.y - 12 + DIRV[P.dir][1] * 6, '#ffe8a0', 8);
    if (S.sta <= 0) { P.blocking = false; P.staDelay = 1.4; UI.toastOnce('Guard broken!'); }
  } else { Sound.play('hurt'); Input.rumble(0.8, 160); }
  dmg = Math.max(P.blocking ? 0 : 1, Math.round(dmg));
  S.hp -= dmg; P.hurtT = P.blocking ? 0.5 : 1.0;
  P.kx = (P.x - e.x) / k * push; P.ky = (P.y - e.y) / k * push;
  floatText(P.x, P.y - 30, dmg ? `-${dmg}` : 'Blocked!', dmg ? '#ff6a6a' : '#ffe8a0');
  if (S.hp <= 0) faint();
}
function faint() {
  exitDungeon(true);
  const lost = Math.min(1000, Math.floor(S.gold * 0.1));
  S.gold -= lost; S.hp = Math.round(S.maxHp * 0.5); S.energy = Math.round(S.maxEnergy * 0.5); S.sta = S.maxSta;
  S.time = Math.min(S.time + 120, DAY_END - 30);
  enemies = []; P.kx = P.ky = 0;
  placePlayerHome(); snapCamera();
  UI.say('mirabel', [`You were found collapsed and carried home. Mirabel patched you up and charged ${lost}g for the potion.`, 'Be careful out there. Eat to restore health, and carry your blade.']);
}

// ---------- End of day ----------
function endDay(passedOut) {
  exitDungeon(true);
  // Collect any items still lying around
  for (const d of drops) { const left = addItem(d.id, d.n); if (d.id === 'wood') S.stats.wood += d.n - left; if (d.id === 'shard') S.stats.shards += d.n - left; }
  drops = [];
  const sold = {};
  let total = 0;
  for (const c of S.crate) { total += ITEMS[c.id].sell * c.n; sold[c.id] = (sold[c.id] || 0) + c.n; }
  S.gold += total; S.stats.shipped += total; S.crate = [];
  let lost = 0;
  if (passedOut) { lost = Math.min(500, Math.floor(S.gold * 0.1)); S.gold -= lost; }
  // Crops grow if watered
  for (const [i, c] of World.crops) {
    if (World.wet[i] && !c.ready) { c.age++; if (c.age >= CROPS[c.id].days) c.ready = true; }
  }
  // Advance the calendar
  S.day++;
  let newSeason = false, withered = 0;
  if (S.day > DAYS_PER_SEASON) {
    S.day = 1; S.season = (S.season + 1) % 4; newSeason = true;
    if (S.season === 0) S.year++;
    for (const [i, c] of [...World.crops]) if (!CROPS[c.id].seasons.includes(S.season)) { World.crops.delete(i); withered++; }
    SEAS = buildSeason(S.season);
  }
  S.weather = S.tomorrow;
  S.tomorrow = Math.random() < [0.25, 0.15, 0.25, 0.3][S.season] ? 'rain' : 'sun';
  if (S.day === 1) S.weather = 'sun';
  // Soil
  World.wet.fill(0);
  for (let i = 0; i < World.ground.length; i++) {
    if (World.ground[i] !== GND.TILLED) continue;
    if (!World.crops.has(i) && Math.random() < 0.12) { World.ground[i] = GND.GRASS; continue; }
    if (S.weather === 'rain') World.wet[i] = 1;
  }
  for (let i = 0; i < World.obj.length; i++) {
    if (World.obj[i] !== OB.SPRINKLER) continue;
    const x = i % W, y = Math.floor(i / W);
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (inb(x + ox, y + oy) && gAt(x + ox, y + oy) === GND.TILLED) World.wet[idx(x + ox, y + oy)] = 1;
  }
  World.hp.clear();
  dailyRespawn();
  for (const f of Object.values(S.friends)) { f.talked = false; f.gifted = false; }
  S.time = DAY_START;
  S.energy = passedOut ? Math.round(S.maxEnergy * 0.6) : S.maxEnergy;
  S.hp = S.maxHp; S.sta = S.maxSta;
  enemies = []; P.toolT = 0; P.kx = P.ky = 0;
  placePlayerHome(); spawnNPCs(); snapCamera();
  saveGame();
  Sound.play('sleep');
  const fade = document.getElementById('fade');
  fade.classList.add('on');
  UI.openSummary({ sold, total, passedOut, lost, newSeason, withered }, () => fade.classList.remove('on'));
}

// ---------- Effects ----------
function burst(x, y, c, n) {
  for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 70 - 10, g: 200, life: 0.4 + Math.random() * 0.3, t: 0, c, s: 2 });
}
function floatText(x, y, text, c) { floats.push({ x, y, text, c, t: 0 }); }
function updateFx(dt) {
  for (const p of parts) { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  parts = parts.filter(p => p.t < p.life);
  for (const f of floats) { f.t += dt; f.y -= 18 * dt; }
  floats = floats.filter(f => f.t < 1.2);
  // Chimney smoke
  smokeT -= dt;
  if (smokeT <= 0) {
    smokeT = 0.35;
    for (const b of World.buildings) if (b.kind === 'farmhouse' || b.kind === 'forge') {
      const sx = b.x * TS + (b.kind === 'farmhouse' ? 4 : 3) * TS + 8, sy = (b.y + b.h) * TS - SPR.bld[b.kind].height + 2;
      if (Math.abs(sx - P.x) < VW && Math.abs(sy - P.y) < VH) parts.push({ x: sx, y: sy, vx: 6 + Math.random() * 6, vy: -14, g: 0, life: 2.2, t: 0, c: 'rgba(220,220,230,.55)', s: 3 });
    }
  }
  // Ambient particles: petals, leaves, snow, fireflies
  ambT -= dt;
  if (ambT <= 0) {
    ambT = 0.25;
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH * 0.5;
    if (inDungeon()) { /* no weather or wildlife underground */ }
    else if (isNight() && Math.random() < 0.7) parts.push({ x, y: cam.y + Math.random() * VH, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, g: 0, life: 3, t: 0, c: '#e8ff8a', s: 1, fly: 1 });
    else if (S.season === 0 && Math.random() < 0.5) parts.push({ x, y: cam.y - 4, vx: 12, vy: 14, g: 0, life: 6, t: 0, c: '#ffc8e0', s: 2 });
    else if (S.season === 2 && Math.random() < 0.6) parts.push({ x, y: cam.y - 4, vx: 10, vy: 16, g: 0, life: 6, t: 0, c: Math.random() < 0.5 ? '#e8902c' : '#c8602c', s: 2 });
  }
}

// ---------- Camera ----------
function snapCamera() { cam.x = clamp(P.x - VW / 2, 0, W * TS - VW); cam.y = clamp(P.y - 10 - VH / 2, 0, H * TS - VH); }
function followCamera(dt) {
  const tx = clamp(P.x - VW / 2, 0, W * TS - VW), ty = clamp(P.y - 10 - VH / 2, 0, H * TS - VH), k = Math.min(1, dt * 10);
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
}
function titleCamera() {
  const t = clock * 0.03;
  cam.x = clamp(126 * TS + Math.sin(t) * 60 * TS - VW / 2, 0, W * TS - VW);
  cam.y = clamp(114 * TS + Math.sin(t * 1.7) * 14 * TS - VH / 2, 0, H * TS - VH);
}

// ---------- Rendering ----------
function render() {
  const g = ctx;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = false;
  g.fillStyle = inDungeon() ? '#08060c' : '#10251a'; g.fillRect(0, 0, VW, VH);
  const cx = Math.round(cam.x), cy = Math.round(cam.y);
  g.translate(-cx, -cy);
  const season = S && playing ? S.season : 0, time = S && playing ? S.time : 12 * 60;
  if (!SEAS) SEAS = buildSeason(season);
  const tx0 = Math.floor(cx / TS) - 1, ty0 = Math.floor(cy / TS) - 1, tx1 = Math.floor((cx + VW) / TS) + 1, ty1 = Math.floor((cy + VH) / TS) + 1;

  // Ground
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) drawGround(g, tx, ty);

  // Highlight target tile
  if (playing && Settings.highlight) {
    const it = S.inv[S.sel];
    if (it && ['tool', 'seed', 'place', 'special'].includes(ITEMS[it.id].cat)) {
      const [px, py] = P.target, X = px * TS, Y = py * TS;
      g.fillStyle = 'rgba(255,255,255,.55)';
      for (const [ox, oy, w, h] of [[0, 0, 4, 1], [0, 0, 1, 4], [12, 0, 4, 1], [15, 0, 1, 4], [0, 15, 4, 1], [0, 12, 1, 4], [12, 15, 4, 1], [15, 12, 1, 4]]) g.fillRect(X + ox, Y + oy, w, h);
    }
  }

  // Y-sorted drawables
  const list = [];
  for (let ty = ty0; ty <= ty1 + 4; ty++) for (let tx = tx0 - 2; tx <= tx1 + 2; tx++) {
    if (!inb(tx, ty)) continue;
    const i = idx(tx, ty), o = World.obj[i];
    if (o && o !== OB.BLOCK) list.push({ y: ty * TS + 14, k: 0, o, tx, ty, i });
    const c = World.crops.get(i);
    if (c) list.push({ y: ty * TS + 13, k: 1, c, tx, ty });
  }
  for (const b of World.buildings) {
    const spr = SPR.bld[b.kind], bx = b.x * TS, by = (b.y + b.h) * TS - spr.height;
    if (bx > cx + VW || bx + spr.width < cx || by > cy + VH || by + spr.height < cy) continue;
    list.push({ y: (b.y + b.h) * TS - 1, k: 2, b, spr, bx, by });
  }
  if (playing) {
    if (!inDungeon()) for (const n of npcs) if (n.visible) list.push({ y: n.y, k: 3, n });
    for (const sh of shots) list.push({ y: sh.y + 10, k: 7, sh });
    for (const e of enemies) list.push({ y: e.y, k: 4, e });
    for (const d of drops) list.push({ y: d.y, k: 5, d });
    list.push({ y: P.y, k: 6 });
  }
  list.sort((a, b) => a.y - b.y);
  for (const d of list) {
    switch (d.k) {
      case 0: drawObj(g, d.o, d.tx, d.ty, d.i); break;
      case 1: g.drawImage(SPR.crop[d.c.id][d.c.ready ? 4 : d.c.age === 0 ? 0 : Math.min(3, 1 + Math.floor(d.c.age / CROPS[d.c.id].days * 3))], d.tx * TS, d.ty * TS - 4); break;
      case 2: g.drawImage(d.spr, d.bx, d.by); break;
      case 3: g.drawImage(SPR.shadow, Math.round(d.n.x) - 6, Math.round(d.n.y) - 2); g.drawImage(CHAR[d.n.id][d.n.dir][d.n.frame], Math.round(d.n.x) - 8, Math.round(d.n.y) - 27); break;
      case 4: drawEnemy(g, d.e); break;
      case 5: g.drawImage(SPR.shadow, Math.round(d.d.x) - 6, Math.round(d.d.y) - 2); g.drawImage(ICONS[d.d.id], Math.round(d.d.x) - 8, Math.round(d.d.y + d.d.z - 14 + Math.sin(clock * 4 + d.d.x) * 1.5)); break;
      case 6: drawPlayer(g); break;
      case 7: drawShot(g, d.sh); break;
    }
  }

  // Particles & floating text
  for (const p of parts) {
    let a = 1 - p.t / p.life;
    if (p.fly) a = 0.5 + 0.5 * Math.sin(p.t * 6 + p.x);
    g.globalAlpha = clamp(a, 0, 1); g.fillStyle = p.c;
    g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
  }
  g.globalAlpha = 1;

  // Weather
  if (S && playing && S.weather === 'rain' && !inDungeon()) {
    if (S.season === 3) {
      g.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 90; i++) { const x = cx + ((i * 73.3 + clock * 14 + Math.sin(clock + i) * 8) % (VW + 20)) - 10, y = cy + ((i * 41.7 + clock * 24) % (VH + 20)) - 10; g.fillRect(Math.round(x), Math.round(y), 2, 2); }
    } else {
      g.strokeStyle = 'rgba(170,200,255,.55)'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < 110; i++) { const x = cx + ((i * 53.7 + clock * 70) % (VW + 40)) - 20, y = cy + ((i * 97.1 + clock * 260) % (VH + 20)) - 10; g.moveTo(x, y); g.lineTo(x - 3, y + 7); }
      g.stroke();
    }
  }

  drawLighting(g, cx, cy, time);

  for (const f of floats) {
    g.globalAlpha = clamp(1.4 - f.t, 0, 1);
    g.font = 'bold 8px "Pixelify Sans", monospace'; g.textAlign = 'center';
    g.fillStyle = '#1a1020'; g.fillText(f.text, Math.round(f.x) + 1, Math.round(f.y) + 1);
    g.fillStyle = f.c; g.fillText(f.text, Math.round(f.x), Math.round(f.y));
  }
  g.globalAlpha = 1;
}

function drawGround(g, tx, ty) {
  if (!inb(tx, ty)) return;
  const i = idx(tx, ty), gt = World.ground[i], X = tx * TS, Y = ty * TS, h = hash2(tx, ty, 99);
  let img;
  switch (gt) {
    case GND.GRASS: img = SEAS.grass[h < 0.06 ? 3 : h < 0.4 ? 0 : h < 0.7 ? 1 : 2]; break;
    case GND.FOREST: img = SEAS.forest[Math.floor(h * 3)]; break;
    case GND.PATH: img = SPR.path[Math.floor(h * 3)]; break;
    case GND.WATER: {
      const deep = gAt(tx, ty - 7) === GND.WATER && gAt(tx, ty + 7) === GND.WATER && gAt(tx - 7, ty) === GND.WATER && gAt(tx + 7, ty) === GND.WATER && gAt(tx - 5, ty - 5) === GND.WATER && gAt(tx + 5, ty + 5) === GND.WATER;
      img = (deep ? SPR.waterDeep : SPR.water)[(Math.floor(clock * 1.5) + ((tx * 7 + ty * 3) % 3)) % 3]; break;
    }
    case GND.FALLS: img = SPR.falls[Math.floor(clock * 8 + tx) % 3]; break;
    case GND.CLIFF: { const d = World.cliffD[i]; img = d === 1 ? SEAS.cliff[1] : d === 2 ? SEAS.cliff[0] : SEAS.plateau[h < 0.5 ? 0 : 1]; break; }
    case GND.SAND: img = SPR.sand[Math.floor(h * 2)]; break;
    case GND.TILLED: img = World.wet[i] ? SPR.tilledWet : SPR.tilled; break;
    case GND.PLAZA: img = SPR.plaza; break;
    case GND.ROCKY: img = SPR.rocky[Math.floor(h * 3)]; break;
    case GND.BRIDGE: img = SPR.bridge; break;
    case GND.DFLOOR: img = dungeonTiles(DUN.tier).floor[h < 0.7 ? 0 : h < 0.88 ? 1 : 2]; break;
    case GND.DWALL: img = gAt(tx, ty + 1) === GND.DFLOOR ? dungeonTiles(DUN.tier).face : dungeonTiles(DUN.tier).top; break;
  }
  g.drawImage(img, X, Y);
  if (gt === GND.CLIFF && World.cliffD[i] > 2 && tx < W - 1 && gAt(tx + 1, ty) !== GND.CLIFF && gAt(tx + 1, ty) !== GND.FALLS) g.drawImage(SEAS.cliffSide, X, Y);
  if (gt === GND.WATER) {
    const w = (x, y) => { const t = gAt(x, y); return t === GND.WATER || t === GND.BRIDGE || t === GND.FALLS; };
    if (gAt(tx, ty - 1) === GND.FALLS) { g.fillStyle = '#ffffff'; for (let k = 0; k < 6; k++) g.fillRect(X + ((k * 5 + Math.floor(clock * 9)) % 15), Y + ((k * 3 + Math.floor(clock * 6)) % 6), 2, 2); }
    if (!w(tx, ty - 1)) { g.fillStyle = '#2c5a8a'; g.fillRect(X, Y, 16, 2); g.fillStyle = '#a8d4f5'; g.fillRect(X, Y + 2, 16, 1); }
    g.fillStyle = '#a8d4f5';
    if (!w(tx, ty + 1)) g.fillRect(X, Y + 15, 16, 1);
    if (!w(tx - 1, ty)) g.fillRect(X, Y, 1, 16);
    if (!w(tx + 1, ty)) g.fillRect(X + 15, Y, 1, 16);
  } else if (gt === GND.TILLED) {
    g.fillStyle = World.wet[i] ? '#2e1f14' : '#4a3020';
    if (gAt(tx, ty - 1) !== GND.TILLED) g.fillRect(X, Y, 16, 1);
    if (gAt(tx, ty + 1) !== GND.TILLED) g.fillRect(X, Y + 15, 16, 1);
    if (gAt(tx - 1, ty) !== GND.TILLED) g.fillRect(X, Y, 1, 16);
    if (gAt(tx + 1, ty) !== GND.TILLED) g.fillRect(X + 15, Y, 1, 16);
  }
}

function drawTree(g, img, x, y, baseY) {
  const behind = playing && P.y < baseY && P.y > baseY - img.height + 10 && Math.abs(P.x - (x + img.width / 2)) < img.width / 2 - 2;
  if (behind) g.globalAlpha = 0.55;
  g.drawImage(img, x, y);
  g.globalAlpha = 1;
}
function drawObj(g, o, tx, ty, i) {
  const sh = shakes.get(i), ox = sh ? Math.round(Math.sin(sh * 70) * 1.5) : 0, X = tx * TS + ox, Y = ty * TS;
  switch (o) {
    case OB.OAK: drawTree(g, SEAS.oak, X - 16, Y - 39, Y + 15); break;
    case OB.PINE: case OB.DENSE: drawTree(g, SEAS.pine, X - 12, Y - 43, Y + 15); break;
    case OB.STUMP: g.drawImage(SPR.stump, X, Y); break;
    case OB.ROCK: g.drawImage(SPR.rock, X, Y); break;
    case OB.BOULDER: g.drawImage(SPR.boulder, X, Y); break;
    case OB.CRYSTAL: g.drawImage(SPR.crystal, X, Y); break;
    case OB.ORE: g.drawImage(SPR.ore, X, Y); break;
    case OB.WEED: g.drawImage(SEAS.weed, X, Y); break;
    case OB.TWIG: g.drawImage(SPR.twig, X, Y); break;
    case OB.BUSH: g.drawImage(SEAS.bush, X, Y); break;
    case OB.CAP: g.drawImage(SPR.cap, X, Y); break;
    case OB.DEW: g.drawImage(SPR.dew, X, Y); break;
    case OB.GLOW: g.drawImage(SPR.glow, X, Y); break;
    case OB.FENCE: {
      const m = (oAt(tx - 1, ty) === OB.FENCE ? 1 : 0) | (oAt(tx + 1, ty) === OB.FENCE ? 2 : 0) | (oAt(tx, ty - 1) === OB.FENCE ? 4 : 0) | (oAt(tx, ty + 1) === OB.FENCE ? 8 : 0);
      g.drawImage(SPR.fence[m], X, Y - 4); break;
    }
    case OB.SPRINKLER: g.drawImage(SPR.sprinkler, X, Y); break;
    case OB.LANTERN: g.drawImage(SPR.lantern, X, Y - 8); break;
    case OB.LAMP: g.drawImage(SPR.lamp, X, Y - 16); break;
    case OB.CRATE: g.drawImage(SPR.crate, X, Y); break;
    case OB.SIGN: g.drawImage(SPR.sign, X, Y); break;
    case OB.TESTCHEST: g.drawImage(SPR.testchest, X, Y); break;
    case OB.STAIRS: g.drawImage(SPR.stairs, X, Y); break;
    case OB.LADDER: g.drawImage(SPR.ladder, X, Y - 16); break;
    case OB.LOOT: g.drawImage(SPR.loot, X, Y); break;
    case OB.LOOTOPEN: g.drawImage(SPR.lootOpen, X, Y); break;
    case OB.TORCH: g.drawImage(SPR.torch, X, Y - 8); break;
    case OB.GEMROCK: g.drawImage(SPR.gemrock, X, Y); break;
    case OB.DARKORE: g.drawImage(SPR.darkore, X, Y); break;
    case OB.LOVESIGN: g.drawImage(SPR.lovesign, X, Y - 4); break;
  }
}
function drawPlayer(g) {
  const x = Math.round(P.x), y = Math.round(P.y), frames = heroFrames();
  g.drawImage(SPR.shadow, x - 6, y - 2);
  const blink = P.hurtT > 0 && !P.blocking && Math.floor(P.hurtT * 14) % 2;
  // Dive roll: tumble the whole sprite
  if (P.rollT > 0) {
    const pr = 1 - P.rollT / P.rollDur, spin = (P.rollVx < 0 || (P.rollVx === 0 && P.dir === 2) ? -1 : 1) * pr * Math.PI * 2;
    g.save(); g.translate(x, y - 10); g.rotate(spin); g.drawImage(frames[P.dir][1], -8, -17); g.restore();
    return;
  }
  // Swinging a tool or weapon
  const swing = P.toolT > 0 ? [ICONS[P.toolId], P.toolT, P.toolDur] : P.swingT > 0 && S.equip.weapon ? [ICONS[S.equip.weapon], P.swingT, P.swingDur] : null;
  const drawSwing = () => {
    if (!swing) return;
    const [icon, t, dur] = swing, pr = 1 - t / dur, [dx, dy] = DIRV[P.dir];
    const base = [Math.PI / 2, -Math.PI / 2, Math.PI, 0][P.dir], a = base + (P.dir === 2 ? -1 : 1) * (pr * 2.0 - 1.2);
    g.save();
    g.translate(x + dx * 3, y - 12 + dy * 2);
    g.rotate(a + Math.PI / 4);
    g.drawImage(icon, -2, -14);
    g.restore();
  };
  // Raised shield while blocking
  const drawShield = () => {
    if (!P.blocking || !S.equip.shield) return;
    const [dx, dy] = DIRV[P.dir];
    g.drawImage(ICONS[S.equip.shield], x - 8 + dx * 8, y - 22 + dy * 5);
  };
  if (P.dir === 1) { drawSwing(); drawShield(); }
  if (!blink) g.drawImage(frames[P.dir][P.toolT > 0 || P.swingT > 0 || P.blocking ? 0 : P.frame], x - 8, y - 27);
  if (P.dir !== 1) { drawShield(); drawSwing(); }
}
function drawEnemy(g, e) {
  const t = ENEMY[e.kind];
  let f = Math.floor(clock * 4 + e.t * 5) % 2, key = t.spr, set;
  if (e.kind === 'wolf') { key = e.face > 0 ? 'wolfR' : 'wolf'; f = e.run ? Math.floor(clock * 10) % 2 : 0; }
  if (e.set) { // dungeon monsters
    if (e.kind === 'bat') f = Math.floor(clock * 10) % 2; else if (e.kind !== 'dslime') f = e.run !== false ? Math.floor(clock * 6) % 2 : 0;
    set = e.flash > 0 ? (e.face > 0 ? e.set.RW : e.set.LW) : (e.face > 0 ? e.set.R : e.set.L);
  } else set = e.flash > 0 ? SPR[key + 'W'] : SPR[key];
  g.globalAlpha = e.fade * (e.kind === 'wisp' ? 0.88 : 1);
  if (!e.fly) g.drawImage(SPR.shadow, Math.round(e.x) - 6, Math.round(e.y) - 2);
  const bob = e.fly || e.kind === 'bat' ? Math.round(Math.sin(clock * 3 + e.t * 7) * 2) - 8 : e.hop > 0 ? -2 : 0;
  const img = set[e.hop > 0 ? 0 : f];
  g.drawImage(img, Math.round(e.x) - img.width / 2, Math.round(e.y) - img.height + 1 + bob);
  g.globalAlpha = 1;
  if (e.hp < e.max) { g.fillStyle = '#1a1020'; g.fillRect(Math.round(e.x) - 7, Math.round(e.y) - 19 + bob, 14, 3); g.fillStyle = '#e0404a'; g.fillRect(Math.round(e.x) - 6, Math.round(e.y) - 18 + bob, Math.max(0, Math.round(12 * e.hp / e.max)), 1); }
}

function darkness(time) {
  if (inDungeon()) return 0.82;
  let a = 0;
  if (time < 6.5 * 60) a = 0.2 * (1 - (time - 6 * 60) / 30);
  else if (time >= 17.5 * 60) a = Math.min(0.72, (time - 17.5 * 60) / 180 * 0.72);
  if (S && playing && S.weather === 'rain') a = Math.max(a, 0.2);
  return clamp(a, 0, 0.72);
}
function drawLighting(g, cx, cy, time) {
  // Warm dusk tint
  if (time > 16.5 * 60 && time < 19.5 * 60) {
    const k = 1 - Math.abs(time - 18 * 60) / 90;
    g.fillStyle = `rgba(255,140,60,${0.14 * k})`; g.fillRect(cx, cy, VW, VH);
  }
  const a = darkness(time);
  if (a <= 0.01) return;
  if (lightC.width !== VW || lightC.height !== VH) { lightC.width = VW; lightC.height = VH; }
  const L = lctx, lights = [];
  L.globalCompositeOperation = 'source-over';
  L.clearRect(0, 0, VW, VH);
  L.fillStyle = `rgba(14,12,44,${a})`; L.fillRect(0, 0, VW, VH);
  const tx0 = Math.floor(cx / TS) - 4, ty0 = Math.floor(cy / TS) - 4, tx1 = Math.floor((cx + VW) / TS) + 4, ty1 = Math.floor((cy + VH) / TS) + 4;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (!inb(tx, ty)) continue;
    const i = idx(tx, ty), o = World.obj[i], X = tx * TS + 8, Y = ty * TS + 8;
    if (o === OB.LAMP) lights.push([X, Y - 20, 64, '#ffd98a']);
    else if (o === OB.LANTERN) lights.push([X, Y - 6, 72, '#ffd98a']);
    else if (o === OB.GLOW) lights.push([X, Y, 26, '#5ff0d8']);
    else if (o === OB.CRYSTAL) lights.push([X, Y - 2, 22, '#b48cff']);
    else if (o === OB.SPRINKLER) lights.push([X, Y, 14, '#6fe3c8']);
    else if (o === OB.TORCH) lights.push([X, Y - 12, 78, '#ffa040']);
    else if (o === OB.STAIRS) lights.push([X, Y, 30, '#b48cff']);
    else if (o === OB.LADDER) lights.push([X, Y - 12, 40, '#fff0b0']);
    else if (o === OB.GEMROCK) lights.push([X, Y, 20, '#ff6a8a']);
    else if (o === OB.TESTCHEST) lights.push([X, Y, 26, '#c8a8ff']);
    else if (o === OB.LOVESIGN) lights.push([X, Y - 8, 34, '#ff6a9a']);
    const c = World.crops.get(i);
    if (c && c.ready && CROPS[c.id].glow) lights.push([X, Y - 4, 26, CROPS[c.id].fruit]);
  }
  for (const b of World.buildings) {
    const bx = b.x * TS, by = (b.y + b.h) * TS;
    if (bx > cx + VW + 40 || bx + b.w * TS < cx - 40 || by < cy - 40 || by - 100 > cy + VH) continue;
    if (b.kind === 'moonwell') lights.push([bx + 24, by - 22, 80, '#7ab8ff']);
    else if (b.kind === 'fountain') lights.push([bx + 24, by - 30, 60, '#b48cff']);
    else if (b.kind === 'mushhouse') { lights.push([bx + 19, by - 24, 30, '#ffd98a']); lights.push([bx + 45, by - 24, 30, '#ffd98a']); }
    else lights.push([bx + b.w * 8, by - 12, 46, '#ffd98a']);
  }
  if (playing) {
    lights.push([P.x, P.y - 10, inDungeon() ? 84 : 50, null]);
    for (const e of enemies) if (e.kind === 'wisp') lights.push([e.x, e.y - 10, 34, '#a58cff']);
  }
  L.globalCompositeOperation = 'destination-out';
  for (const [x, y, r] of lights) {
    const lx = x - cx, ly = y - cy;
    if (lx < -r || ly < -r || lx > VW + r || ly > VH + r) continue;
    const gr = L.createRadialGradient(lx, ly, 0, lx, ly, r);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    L.fillStyle = gr; L.fillRect(lx - r, ly - r, r * 2, r * 2);
  }
  g.drawImage(lightC, cx, cy);
  g.globalCompositeOperation = 'lighter';
  for (const [x, y, r, c] of lights) {
    if (!c) continue;
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 0.6), [cr, cg, cb] = hexRgb(c);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${0.22 * a})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalCompositeOperation = 'source-over';
}
