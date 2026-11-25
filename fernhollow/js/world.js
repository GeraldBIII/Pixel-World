'use strict';
const W = 140, H = 100;
const GND = { GRASS: 0, PATH: 1, WATER: 2, SAND: 3, TILLED: 4, PLAZA: 5, FOREST: 6, ROCKY: 7, BRIDGE: 8 };
const OB = { NONE: 0, OAK: 1, PINE: 2, STUMP: 3, ROCK: 4, CRYSTAL: 5, ORE: 6, WEED: 7, TWIG: 8, BUSH: 9, CAP: 10, DEW: 11, GLOW: 12, FENCE: 13, SPRINKLER: 14, LANTERN: 15, BLOCK: 16, LAMP: 17, CRATE: 18, BOULDER: 19, SIGN: 20 };

const OBJ_INFO = [];
OBJ_INFO[OB.OAK] = { solid: 1, hp: 6, tool: 'axe', drops: [['wood', 5, 8]], becomes: OB.STUMP, pc: '#8c5a35' };
OBJ_INFO[OB.PINE] = { solid: 1, hp: 6, tool: 'axe', drops: [['wood', 5, 8]], becomes: OB.STUMP, pc: '#8c5a35' };
OBJ_INFO[OB.STUMP] = { solid: 1, hp: 3, tool: 'axe', drops: [['wood', 2, 3]], pc: '#c49a62' };
OBJ_INFO[OB.ROCK] = { solid: 1, hp: 2, tool: 'pick', drops: [['stone', 1, 3]], pc: '#9a96a6' };
OBJ_INFO[OB.CRYSTAL] = { solid: 1, hp: 4, tool: 'pick', drops: [['shard', 1, 2], ['stone', 1, 2]], pc: '#b48cff' };
OBJ_INFO[OB.ORE] = { solid: 1, hp: 3, tool: 'pick', drops: [['ore', 1, 3], ['stone', 1, 1]], pc: '#f0b84a' };
OBJ_INFO[OB.BOULDER] = { solid: 1, hp: 5, tool: 'pick', drops: [['stone', 4, 6], ['ore', 0, 2]], pc: '#8a8272' };
OBJ_INFO[OB.WEED] = { solid: 1, hp: 1, tool: 'any', drops: [['fiber', 0, 1]], pc: '#5a9a3a' };
OBJ_INFO[OB.TWIG] = { solid: 1, hp: 1, tool: 'axe', drops: [['wood', 1, 2]], pc: '#8c5a35' };
OBJ_INFO[OB.BUSH] = { solid: 1, hp: 3, tool: 'axe', drops: [['wood', 1, 2], ['fiber', 1, 2]], pc: '#3f8f45' };
OBJ_INFO[OB.CAP] = { solid: 0, forage: 'cap' };
OBJ_INFO[OB.DEW] = { solid: 0, forage: 'dew' };
OBJ_INFO[OB.GLOW] = { solid: 0, forage: 'glowcap' };
OBJ_INFO[OB.FENCE] = { solid: 1, hp: 1, tool: 'pick', give: 'fence', pc: '#9a6a3a' };
OBJ_INFO[OB.SPRINKLER] = { solid: 1, hp: 1, tool: 'pick', give: 'sprinkler', pc: '#9a94a8' };
OBJ_INFO[OB.LANTERN] = { solid: 1, hp: 1, tool: 'pick', give: 'lantern', pc: '#ffd86a' };
OBJ_INFO[OB.BLOCK] = { solid: 1 };
OBJ_INFO[OB.LAMP] = { solid: 1 };
OBJ_INFO[OB.CRATE] = { solid: 1 };
OBJ_INFO[OB.SIGN] = { solid: 1 };
const PLACE_OBJ = { fence: OB.FENCE, sprinkler: OB.SPRINKLER, lantern: OB.LANTERN };
const TOOL_NAMES = { axe: 'an axe', pick: 'a pickaxe', any: 'a tool' };

const FARM = { x0: 12, y0: 31, x1: 56, y1: 72 };
const VILLAGE = { x0: 67, y0: 38, x1: 110, y1: 72 };
const SPAWN = { x: 31, y: 37 };

const World = {
  ground: new Uint8Array(W * H), obj: new Uint8Array(W * H), wet: new Uint8Array(W * H),
  bmap: new Int16Array(W * H), crops: new Map(), hp: new Map(), buildings: [], signs: new Map(),
};

const BUILDING_DEFS = [
  { id: 'house', kind: 'farmhouse', x: 28, y: 33, w: 6, h: 4, door: 3, label: 'Sleep', action: 'sleep' },
  { id: 'seeds', kind: 'seedshop', x: 77, y: 43, w: 5, h: 4, door: 2, label: 'Shop', action: 'shop', shop: 'seeds' },
  { id: 'apoth', kind: 'apothecary', x: 93, y: 42, w: 5, h: 4, door: 2, label: 'Shop', action: 'shop', shop: 'apothecary' },
  { id: 'forge', kind: 'forge', x: 99, y: 53, w: 5, h: 4, door: 1, label: 'Shop', action: 'shop', shop: 'forge' },
  { id: 'elder', kind: 'elderhouse', x: 78, y: 56, w: 5, h: 4, door: 2, label: 'Knock', action: 'msg', msg: "Elder Oswin's house. He's usually out by the fountain during the day." },
  { id: 'cottage', kind: 'cottage', x: 93, y: 58, w: 4, h: 3, door: 1, label: 'Knock', action: 'msg', msg: 'Nobody answers. A note on the door reads: "Gone adventuring!"' },
  { id: 'lumi', kind: 'mushhouse', x: 72, y: 13, w: 4, h: 4, door: 1, label: 'Knock', action: 'msg', msg: "Lumi's mushroom house. It smells like rain and honey." },
  { id: 'moonwell', kind: 'moonwell', x: 44, y: 11, w: 3, h: 3, label: 'Drink', action: 'moonwell', any: true },
  { id: 'fountain', kind: 'fountain', x: 88, y: 50, w: 3, h: 3, label: 'Wish', action: 'fountain', any: true },
];

const MAP_LABELS = [
  ['Your Farm', 33, 56], ['Fernhollow', 89, 64], ['Whispering Woods', 36, 7], ['Crystal Hills', 125, 22],
  ['Moonlake', 74, 88], ['Sunny Meadow', 24, 84], ['Moonwell', 45, 18], ["Lumi's House", 74, 22],
];

const idx = (x, y) => y * W + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const gAt = (x, y) => (inb(x, y) ? World.ground[idx(x, y)] : GND.WATER);
const oAt = (x, y) => (inb(x, y) ? World.obj[idx(x, y)] : OB.BLOCK);
const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const inFarm = (x, y) => inRect(FARM, x, y);
function solidTile(x, y) {
  if (!inb(x, y)) return true;
  const i = idx(x, y);
  if (World.ground[i] === GND.WATER) return true;
  const o = World.obj[i];
  return !!(o && OBJ_INFO[o].solid);
}
function buildingAt(x, y) { if (!inb(x, y)) return null; const b = World.bmap[idx(x, y)]; return b >= 0 ? World.buildings[b] : null; }
function zoneAt(x, y) {
  if (inFarm(x, y)) return 'farm';
  if (inRect(VILLAGE, x, y)) return 'village';
  const g = gAt(x, y);
  if (g === GND.FOREST) return 'woods';
  if (g === GND.ROCKY) return 'hills';
  if (g === GND.WATER || g === GND.SAND || g === GND.BRIDGE) return 'lake';
  if (y > 72 && x < 48) return 'meadow';
  return 'wild';
}

function genWorld() {
  const G = World.ground, O = World.obj;
  G.fill(GND.GRASS); O.fill(0); World.wet.fill(0); World.bmap.fill(-1);
  World.crops.clear(); World.hp.clear(); World.buildings = []; World.signs.clear();
  const r = mulberry32(424242);

  // Terrain
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 9, y / 9, 3);
    let g = GND.GRASS;
    if (y < 27 + Math.round((n - 0.5) * 8)) g = GND.FOREST;
    if (x > 111 + Math.round((fbm(x / 7, y / 7, 8) - 0.5) * 8) && y < 70 + Math.round((n - 0.5) * 6)) g = GND.ROCKY;
    const dx = (x - 74) / 27, dy = (y - 87) / 10.5, d = dx * dx + dy * dy + (fbm(x / 5, y / 5, 9) - 0.5) * 0.6;
    if (d < 1) g = GND.WATER; else if (d < 1.3) g = GND.SAND;
    G[idx(x, y)] = g;
  }
  // River from the northern hills into Moonlake
  for (let y = 0; y < 84; y++) {
    const cx = 62 + Math.round(Math.sin(y * 0.13) * 2.2);
    for (let x = cx; x < cx + 3; x++) G[idx(x, y)] = GND.WATER;
  }
  for (let y = FARM.y0; y <= FARM.y1; y++) for (let x = FARM.x0; x <= FARM.x1; x++) G[idx(x, y)] = GND.GRASS;
  for (let y = VILLAGE.y0; y <= VILLAGE.y1; y++) for (let x = VILLAGE.x0; x <= VILLAGE.x1; x++) if (G[idx(x, y)] !== GND.WATER) G[idx(x, y)] = GND.GRASS;
  // Plaza
  for (let y = 44; y <= 58; y++) for (let x = 82; x <= 96; x++) if ((x - 89) ** 2 + (y - 51) ** 2 <= 37) G[idx(x, y)] = GND.PLAZA;

  // Scatter
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y);
    if (G[i] === GND.WATER) continue;
    const g = G[i], h = r();
    if (inFarm(x, y)) {
      if (h < 0.09) O[i] = OB.WEED; else if (h < 0.13) O[i] = OB.TWIG; else if (h < 0.17) O[i] = OB.ROCK;
      else if (h < 0.185) O[i] = OB.OAK; else if (h < 0.19) O[i] = OB.BOULDER;
      continue;
    }
    if (inRect(VILLAGE, x, y)) { if (g === GND.GRASS) { if (h < 0.015) O[i] = OB.OAK; else if (h < 0.03) O[i] = OB.BUSH; } continue; }
    if (g === GND.FOREST) {
      if (fbm(x / 7, y / 7, 21) > 0.6) {
        if (h < 0.04) O[i] = OB.CAP; else if (h < 0.06) O[i] = OB.GLOW; else if (h < 0.1) O[i] = OB.WEED; else if (h < 0.13) O[i] = OB.BUSH;
      } else {
        if (h < 0.34) O[i] = r() < 0.5 ? OB.PINE : OB.OAK; else if (h < 0.37) O[i] = OB.CAP; else if (h < 0.385) O[i] = OB.GLOW;
        else if (h < 0.42) O[i] = OB.BUSH; else if (h < 0.45) O[i] = OB.TWIG; else if (h < 0.48) O[i] = OB.WEED;
      }
    } else if (g === GND.ROCKY) {
      if (h < 0.1) O[i] = OB.ROCK; else if (h < 0.14) O[i] = OB.ORE; else if (h < 0.16) O[i] = OB.CRYSTAL; else if (h < 0.19) O[i] = OB.BOULDER; else if (h < 0.21) O[i] = OB.PINE;
    } else if (g === GND.GRASS) {
      if (h < 0.06) O[i] = OB.OAK; else if (h < 0.08) O[i] = OB.PINE; else if (h < 0.1) O[i] = OB.BUSH;
      else if (h < 0.13) O[i] = OB.WEED; else if (h < 0.15) O[i] = OB.DEW; else if (h < 0.16) O[i] = OB.ROCK;
    } else if (g === GND.SAND && h < 0.02) O[i] = OB.ROCK;
  }
  // Thick tree border around the world edge
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(x, y, W - 1 - x, H - 1 - y), th = 3 + Math.floor(fbm(x / 4, y / 4, 5) * 4), i = idx(x, y);
    if (d < th && G[i] !== GND.WATER) { G[i] = GND.FOREST; O[i] = hash2(x, y, 31) < 0.3 ? OB.OAK : OB.PINE; }
  }

  const clearRect = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y) && World.bmap[idx(x, y)] < 0) O[idx(x, y)] = 0; };
  const carve = (pts, w = 2) => {
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= n; s++) {
        const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n);
        for (let oy = 0; oy < w; oy++) for (let ox = 0; ox < w; ox++) {
          const X = x + ox, Y = y + oy;
          if (!inb(X, Y)) continue;
          const i = idx(X, Y);
          if (World.bmap[i] >= 0) continue;
          if (G[i] === GND.WATER) G[i] = GND.BRIDGE;
          else if (G[i] !== GND.BRIDGE && G[i] !== GND.PLAZA) G[i] = GND.PATH;
          O[i] = 0;
        }
      }
    }
  };

  // Trails
  carve([[31, 37], [31, 50], [83, 50]]);                       // farm -> village
  carve([[31, 44], [19, 44], [19, 24], [30, 16], [44, 15]]);   // farm -> moonwell
  carve([[46, 15], [72, 18], [73, 17]]);                       // moonwell -> Lumi
  carve([[89, 45], [89, 26], [80, 20], [76, 18]]);             // village -> woods
  carve([[95, 51], [112, 51], [118, 45], [124, 36]]);          // village -> hills
  carve([[88, 57], [88, 75]]);                                 // village -> lake
  carve([[31, 51], [31, 64], [26, 74]]);                       // farm -> meadow
  for (let y = 74; y <= 81; y++) for (let x = 88; x <= 89; x++) { const i = idx(x, y); if (G[i] === GND.WATER || G[i] === GND.SAND) G[i] = GND.BRIDGE; O[i] = 0; } // dock

  // Clearings
  clearRect(24, 31, 40, 42);
  for (let y = 5; y <= 20; y++) for (let x = 38; x <= 52; x++) if ((x - 45) ** 2 + (y - 12) ** 2 <= 30) O[idx(x, y)] = 0;
  clearRect(69, 11, 79, 20);

  // Buildings
  for (const def of BUILDING_DEFS) {
    const b = Object.assign({}, def), bi = World.buildings.length;
    b.doorTile = def.door != null ? [b.x + def.door, b.y + b.h - 1] : null;
    World.buildings.push(b);
    clearRect(b.x - 1, b.y - 1, b.x + b.w, b.y + b.h);
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
      const i = idx(x, y);
      O[i] = OB.BLOCK; World.bmap[i] = bi;
      if (G[i] === GND.PATH) G[i] = GND.GRASS;
    }
  }
  // Door connectors
  carve([[79, 47], [79, 50]]);
  carve([[95, 46], [94, 47], [93, 48]]);
  carve([[100, 57], [95, 54]]);
  carve([[80, 60], [84, 60], [85, 56]]);
  carve([[94, 61], [91, 61], [91, 57]]);

  // Village details
  for (const [x, y] of Object.values(NPCS).map(n => n.home)) clearRect(x - 1, y - 1, x + 1, y + 1);
  const putFree = (x, y, o) => { const i = idx(x, y); if (!inb(x, y) || World.bmap[i] >= 0 || G[i] === GND.WATER || G[i] === GND.BRIDGE) return false; O[i] = o; return true; };
  for (const [x, y] of [[77, 49], [86, 46], [92, 46], [84, 56], [95, 56], [66, 48], [60, 52], [97, 62], [104, 50], [87, 59]]) putFree(x, y, OB.LAMP);
  const sign = (x, y, text) => { if (putFree(x, y, OB.SIGN)) World.signs.set(idx(x, y), text); };
  sign(34, 48, 'Fernhollow Farm. Founded by your grandmother, long ago.');
  sign(67, 48, 'West: your farm. East: Fernhollow village.');
  sign(21, 30, 'North: the Whispering Woods and the Moonwell.');
  sign(110, 49, 'East: the Crystal Hills. Beware of rock slimes!');
  sign(91, 73, 'Moonlake. The fish here are said to be very shy.');
  putFree(35, 36, OB.CRATE);
  clearRect(SPAWN.x - 1, SPAWN.y, SPAWN.x + 1, SPAWN.y + 1);
}

// Respawns forage, debris and minerals each morning, up to a cap per type.
function dailyRespawn() {
  const O = World.obj, G = World.ground, counts = {};
  for (let i = 0; i < O.length; i++) counts[O[i]] = (counts[O[i]] || 0) + 1;
  let farmDebris = 0;
  for (let y = FARM.y0; y <= FARM.y1; y++) for (let x = FARM.x0; x <= FARM.x1; x++) { const o = O[idx(x, y)]; if (o === OB.WEED || o === OB.TWIG || o === OB.ROCK) farmDebris++; }
  const tryPut = (x, y, o) => {
    if (!inb(x, y)) return false;
    const i = idx(x, y);
    if (O[i] || World.bmap[i] >= 0 || World.crops.has(i)) return false;
    const g = G[i];
    if (g === GND.WATER || g === GND.TILLED || g === GND.PATH || g === GND.BRIDGE || g === GND.PLAZA) return false;
    if (Math.abs(x - SPAWN.x) < 3 && Math.abs(y - SPAWN.y) < 3) return false;
    O[i] = o; return true;
  };
  const rx = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  for (let k = 0; k < 8 && farmDebris < 40; k++) {
    const x = rx(FARM.x0, FARM.x1), y = rx(FARM.y0, FARM.y1);
    if (x >= 24 && x <= 40 && y >= 31 && y <= 42) continue;
    const h = Math.random();
    if (tryPut(x, y, h < 0.6 ? OB.WEED : h < 0.85 ? OB.TWIG : OB.ROCK)) farmDebris++;
  }
  for (let k = 0; k < 120; k++) {
    const x = rx(4, W - 5), y = rx(4, H - 5), g = G[idx(x, y)], z = zoneAt(x, y);
    if (g === GND.FOREST && z === 'woods') {
      if ((counts[OB.CAP] || 0) < 90 && Math.random() < 0.7) { if (tryPut(x, y, OB.CAP)) counts[OB.CAP] = (counts[OB.CAP] || 0) + 1; }
      else if ((counts[OB.GLOW] || 0) < 30) { if (tryPut(x, y, OB.GLOW)) counts[OB.GLOW] = (counts[OB.GLOW] || 0) + 1; }
    } else if (g === GND.GRASS && (z === 'wild' || z === 'meadow') && (counts[OB.DEW] || 0) < 70) {
      if (tryPut(x, y, OB.DEW)) counts[OB.DEW] = (counts[OB.DEW] || 0) + 1;
    } else if (g === GND.ROCKY) {
      const h = Math.random(), o = h < 0.55 ? OB.ROCK : h < 0.85 ? OB.ORE : OB.CRYSTAL, cap = { [OB.ROCK]: 110, [OB.ORE]: 45, [OB.CRYSTAL]: 22 }[o];
      if ((counts[o] || 0) < cap && tryPut(x, y, o)) counts[o] = (counts[o] || 0) + 1;
    }
  }
}

// One pixel per tile, used by the map screen.
function mapImage() {
  const pal = SEASON_PAL[S ? S.season : 0];
  const col = { [GND.GRASS]: pal.grass, [GND.PATH]: '#c8a070', [GND.WATER]: '#3f7fd0', [GND.SAND]: '#e3cc92', [GND.TILLED]: '#6b4a2e', [GND.PLAZA]: '#b8b0c8', [GND.FOREST]: pal.forest, [GND.ROCKY]: '#8d867a', [GND.BRIDGE]: '#a36f3c' };
  return mk(W, H, g => {
    const id = g.createImageData(W, H), d = id.data;
    for (let i = 0; i < W * H; i++) {
      let c = col[World.ground[i]];
      const o = World.obj[i];
      if (World.bmap[i] >= 0) c = '#c0503a';
      else if (o === OB.OAK || o === OB.PINE) c = shade(pal.forest, -0.35);
      else if (o === OB.ROCK || o === OB.BOULDER || o === OB.ORE) c = '#6e6a76';
      else if (o === OB.CRYSTAL) c = '#b48cff';
      else if (World.crops.has(i)) c = '#7ac85a';
      const [r, gg, b] = hexRgb(c);
      d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
    }
    g.putImageData(id, 0, 0);
  });
}
