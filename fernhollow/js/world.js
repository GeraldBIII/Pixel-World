'use strict';
// The world is built from a hand-drawn map. Every coordinate in MAP_REF is a pixel
// position on the reference photo; toTile() turns it into a tile (4 photo px = 1 tile).
// W/H and World change while you're in Moonfall Depths (a separate, smaller map).
const OW = 320, OH = 312;
let W = OW, H = OH;
const PX0 = 140, PY0 = 430, PXS = 4; // 4 photo px per tile (the world was doubled)
const GND = { GRASS: 0, PATH: 1, WATER: 2, SAND: 3, TILLED: 4, PLAZA: 5, FOREST: 6, ROCKY: 7, BRIDGE: 8, CLIFF: 9, FALLS: 10, DFLOOR: 11, DWALL: 12 };
const OB = { NONE: 0, OAK: 1, PINE: 2, STUMP: 3, ROCK: 4, CRYSTAL: 5, ORE: 6, WEED: 7, TWIG: 8, BUSH: 9, CAP: 10, DEW: 11, GLOW: 12, FENCE: 13, SPRINKLER: 14, LANTERN: 15, BLOCK: 16, LAMP: 17, CRATE: 18, BOULDER: 19, SIGN: 20, DENSE: 21, TESTCHEST: 22, STAIRS: 23, LADDER: 24, LOOT: 25, LOOTOPEN: 26, TORCH: 27, GEMROCK: 28, DARKORE: 29, LOVESIGN: 30 };

const OBJ_INFO = [];
OBJ_INFO[OB.OAK] = { solid: 1, hp: 6, tool: 'axe', drops: [['wood', 5, 8]], becomes: OB.STUMP, pc: '#8c5a35' };
OBJ_INFO[OB.PINE] = { solid: 1, hp: 6, tool: 'axe', drops: [['wood', 5, 8]], becomes: OB.STUMP, pc: '#8c5a35' };
OBJ_INFO[OB.STUMP] = { solid: 1, hp: 3, tool: 'axe', drops: [['wood', 2, 3]], pc: '#c49a62' };
OBJ_INFO[OB.ROCK] = { solid: 1, hp: 2, tool: 'pick', drops: [['stone', 1, 3]], pc: '#9a96a6' };
OBJ_INFO[OB.CRYSTAL] = { solid: 1, hp: 4, tool: 'pick', drops: [['shard', 1, 2], ['stone', 1, 2]], pc: '#b48cff' };
OBJ_INFO[OB.ORE] = { solid: 1, hp: 3, tool: 'pick', drops: [['ore', 1, 3], ['stone', 1, 1]], pc: '#f0b84a' };
OBJ_INFO[OB.BOULDER] = { solid: 1, hp: 5, tool: 'pick', drops: [['stone', 4, 6], ['ore', 0, 2]], pc: '#8a8272' };
OBJ_INFO[OB.WEED] = { solid: 0, hp: 1, tool: 'any', drops: [['fiber', 0, 1]], pc: '#5a9a3a' };
OBJ_INFO[OB.TWIG] = { solid: 0, hp: 1, tool: 'axe', drops: [['wood', 1, 2]], pc: '#8c5a35' };
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
OBJ_INFO[OB.DENSE] = { solid: 1 }; // the impassable eastern forest: can't be chopped
OBJ_INFO[OB.TESTCHEST] = { solid: 1 };
OBJ_INFO[OB.STAIRS] = { solid: 1 };
OBJ_INFO[OB.LADDER] = { solid: 1 };
OBJ_INFO[OB.LOOT] = { solid: 1 };
OBJ_INFO[OB.LOOTOPEN] = { solid: 1 };
OBJ_INFO[OB.TORCH] = { solid: 1 };
OBJ_INFO[OB.GEMROCK] = { solid: 1, hp: 5, tool: 'pick', drops: [['stone', 1, 2]], gems: true, pc: '#e0406a' };
OBJ_INFO[OB.LOVESIGN] = { solid: 1 };
OBJ_INFO[OB.DARKORE] = { solid: 1, hp: 5, tool: 'pick', drops: [['darkiron', 1, 2], ['stone', 0, 1]], pc: '#6a4aa8' };
const PLACE_OBJ = { fence: OB.FENCE, sprinkler: OB.SPRINKLER, lantern: OB.LANTERN };
const TOOL_NAMES = { axe: 'an axe', pick: 'a pickaxe', any: 'a tool' };

// ---------- The reference map (photo pixel coordinates) ----------
const MAP_REF = {
  // Blue: sheer cliffs along the north and west edges
  cliffTop: [[130, 700], [205, 680], [240, 640], [300, 600], [380, 580], [470, 570], [520, 560], [525, 520], [545, 495], [650, 488], [760, 483], [840, 490], [870, 540], [900, 580], [960, 615], [1010, 620], [1030, 580], [1050, 548], [1090, 550], [1160, 580], [1230, 610], [1290, 625], [1340, 628], [1430, 630]],
  cliffLeft: [[205, 600], [205, 680], [200, 760], [195, 900], [192, 1000], [190, 1036]],
  // Green: dense forest along the east edge
  forestEast: [[1320, 560], [1320, 950], [1358, 960], [1365, 1036]],
  // Yellow: where the land meets the sea (the sea is to the south)
  coasts: [
    // West coast, the town's shore, the big southern peninsula, then up to the left river mouth
    [[130, 1030], [190, 1030], [215, 1050], [245, 1080], [275, 1085], [295, 1060], [305, 1030], [335, 995], [380, 978], [430, 970], [490, 975], [530, 988], [545, 1010], [530, 1040], [490, 1065], [445, 1095], [405, 1135], [385, 1180], [378, 1240], [385, 1300], [410, 1350], [440, 1400], [470, 1450], [500, 1468], [535, 1455], [565, 1420], [580, 1370], [585, 1300], [583, 1230], [580, 1180], [585, 1140], [620, 1110], [660, 1085], [690, 1065], [705, 1040]],
    // South shore of the farm, between the two river mouths
    [[770, 1040], [775, 1100], [780, 1170], [840, 1192], [900, 1190], [970, 1182], [1005, 1168], [1022, 1130], [1025, 1090]],
    // East coast
    [[1045, 1100], [1070, 1140], [1100, 1135], [1135, 1105], [1155, 1060], [1162, 1010], [1190, 985], [1230, 985], [1280, 1005], [1330, 1020], [1365, 1025], [1430, 1030]],
  ],
  // Temporary walls across the river mouths so the sea doesn't flood inland while generating
  plugs: [[[705, 1040], [770, 1040]], [[1025, 1090], [1045, 1100]]],
  islands: [
    [[640, 1150], [670, 1145], [690, 1170], [695, 1220], [690, 1265], [660, 1292], [630, 1290], [610, 1270], [605, 1230], [612, 1185], [640, 1150]],
    [[1060, 1160], [1100, 1170], [1125, 1200], [1125, 1250], [1100, 1280], [1070, 1290], [1035, 1270], [1015, 1235], [1015, 1195], [1040, 1165], [1060, 1160]],
    [[810, 1465], [850, 1470], [878, 1500], [880, 1560], [865, 1600], [835, 1625], [805, 1620], [785, 1585], [775, 1530], [785, 1485], [810, 1465]],
  ],
  // The river: falls from the waterfall (W), splits around your farm, and runs into the sea
  rivers: [
    { pts: [[628, 470], [628, 520], [630, 590], [650, 640], [690, 680], [725, 720], [750, 770], [765, 810]], r0: 2.1, r1: 2.4 },
    { pts: [[765, 810], [752, 850], [738, 900], [730, 950], [728, 1000], [735, 1040], [740, 1090]], r0: 2.3, r1: 4.2 },
    { pts: [[765, 810], [820, 828], [900, 838], [960, 850], [990, 885], [995, 930], [1008, 990], [1030, 1060], [1035, 1110], [1040, 1160]], r0: 2.3, r1: 3.2 },
  ],
};
const toTile = ([x, y]) => [Math.floor((x - PX0) / PXS), Math.floor((y - PY0) / PXS)];
function polyAt(poly, v, axis) { // interpolate along a monotonic polyline
  const a = axis, b = 1 - axis;
  if (v <= poly[0][a]) return poly[0][b];
  for (let k = 0; k < poly.length - 1; k++) {
    const p = poly[k], q = poly[k + 1];
    if (v <= q[a]) return p[b] + (q[b] - p[b]) * ((v - p[a]) / ((q[a] - p[a]) || 1));
  }
  return poly[poly.length - 1][b];
}

const SPAWN = { x: 182, y: 119 };
const HOUSE_CLEAR = { x0: 175, y0: 110, x1: 190, y1: 124 };
let FARM = { x0: 0, y0: 0, x1: 0, y1: 0 };
const VILLAGE = { x0: 44, y0: 92, x1: 100, y1: 134 };
const PLAZA = { x: 70, y: 114 };
const PENINSULA = { x0: 56, y0: 140, x1: 116, y1: 264 };
const WOLFWOOD_X = 200; // forest east of this column is the Wolfwood

const OVERWORLD = {
  ground: new Uint8Array(W * H), obj: new Uint8Array(W * H), wet: new Uint8Array(W * H),
  bmap: new Int16Array(W * H), farm: new Uint8Array(W * H), cliffD: new Uint8Array(W * H),
  crops: new Map(), hp: new Map(), buildings: [], signs: new Map(),
};
let World = OVERWORLD;
const TEST_CHEST = { x: 176, y: 118 };
const LOVE_SIGN = { x: 180, y: 121, text: 'I love you Alissa.' };
let CAVE = null; // cave entrance building, placed beside the waterfall

const BUILDING_DEFS = [
  { id: 'house', kind: 'farmhouse', x: 179, y: 115, w: 6, h: 4, door: 3, label: 'Sleep', action: 'sleep' },
  { id: 'seeds', kind: 'seedshop', x: 56, y: 103, w: 5, h: 4, door: 2, label: 'Shop', action: 'shop', shop: 'seeds' },
  { id: 'apoth', kind: 'apothecary', x: 78, y: 101, w: 5, h: 4, door: 2, label: 'Shop', action: 'shop', shop: 'apothecary' },
  { id: 'forge', kind: 'forge', x: 84, y: 120, w: 5, h: 4, door: 1, label: 'Shop', action: 'shop', shop: 'forge' },
  { id: 'elder', kind: 'elderhouse', x: 52, y: 118, w: 5, h: 4, door: 2, label: 'Knock', action: 'msg', msg: "Elder Oswin's house. He's usually out by the fountain during the day." },
  { id: 'cottage', kind: 'cottage', x: 72, y: 126, w: 4, h: 3, door: 1, label: 'Knock', action: 'msg', msg: 'Nobody answers. A note on the door reads: "Gone adventuring!"' },
  { id: 'lumi', kind: 'mushhouse', x: 32, y: 68, w: 4, h: 4, door: 1, label: 'Knock', action: 'msg', msg: "Lumi's mushroom house. It smells like rain and honey." },
  { id: 'moonwell', kind: 'moonwell', x: 88, y: 60, w: 3, h: 3, label: 'Drink', action: 'moonwell', any: true },
  { id: 'fountain', kind: 'fountain', x: 69, y: 113, w: 3, h: 3, label: 'Wish', action: 'fountain', any: true },
];

const MAP_LABELS = [
  ['Your Farm', 184, 156], ['Fernhollow', 68, 144], ['Whispering Woods', 60, 52], ['Wolfwood', 264, 96],
  ['Moonfall', 122, 8], ['Sunny Meadow', 86, 224], ['Moonwell', 90, 76], ["Lumi's House", 36, 88],
  ['Fairy Isle', 126, 224], ['The Southern Sea', 184, 244], ['North Fields', 184, 68],
];

const idx = (x, y) => y * W + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const gAt = (x, y) => (inb(x, y) ? World.ground[idx(x, y)] : GND.WATER);
const oAt = (x, y) => (inb(x, y) ? World.obj[idx(x, y)] : OB.BLOCK);
const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const inFarm = (x, y) => inb(x, y) && World.farm[idx(x, y)] === 1;
const blockedGround = g => g === GND.WATER || g === GND.CLIFF || g === GND.FALLS || g === GND.DWALL;
function solidTile(x, y) {
  if (!inb(x, y)) return true;
  const i = idx(x, y);
  if (blockedGround(World.ground[i])) return true;
  const o = World.obj[i];
  return !!(o && OBJ_INFO[o].solid);
}
function buildingAt(x, y) { if (!inb(x, y)) return null; const b = World.bmap[idx(x, y)]; return b >= 0 ? World.buildings[b] : null; }
function zoneAt(x, y) {
  if (World.dungeon) return 'dungeon';
  if (inFarm(x, y)) return 'farm';
  if (inRect(VILLAGE, x, y)) return 'village';
  const g = gAt(x, y);
  if (g === GND.FOREST) return x >= WOLFWOOD_X ? 'wolfwood' : 'woods';
  if (g === GND.ROCKY) return 'hills';
  if (g === GND.WATER || g === GND.SAND || g === GND.BRIDGE) return 'lake';
  if (inRect(PENINSULA, x, y)) return 'meadow';
  return 'wild';
}

function genWorld() {
  World = OVERWORLD; W = OW; H = OH;
  const G = World.ground, O = World.obj, N = W * H;
  G.fill(GND.GRASS); O.fill(0); World.wet.fill(0); World.bmap.fill(-1); World.farm.fill(0); World.cliffD.fill(0);
  World.crops.clear(); World.hp.clear(); World.buildings = []; World.signs.clear();
  const r = mulberry32(424242);

  // 1. Cliffs (north + west) and the dense forest (east)
  const cliff = new Uint8Array(N), forest = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = PX0 + (x + 0.5) * PXS, py = PY0 + (y + 0.5) * PXS, i = idx(x, y);
    if (py < polyAt(MAP_REF.cliffTop, px, 0) || (py <= 1036 && px < polyAt(MAP_REF.cliffLeft, py, 1))) cliff[i] = 1;
    else if (py <= 1036 && px > polyAt(MAP_REF.forestEast, py, 1)) forest[i] = 1;
  }

  // 2. Coastlines and islands as walls, then flood the sea in from the south edge
  const wall = new Uint8Array(N), coastWall = new Uint8Array(N);
  const drawLine = (pts, mark) => {
    for (let k = 0; k < pts.length - 1; k++) {
      let [x0, y0] = toTile(pts[k]); const [x1, y1] = toTile(pts[k + 1]);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        const cx = clamp(x0, 0, W - 1), cy = clamp(y0, 0, H - 1);
        wall[idx(cx, cy)] = 1; if (mark) coastWall[idx(cx, cy)] = 1;
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
  };
  for (const c of MAP_REF.coasts) drawLine(c, true);
  for (const c of MAP_REF.islands) drawLine(c, true);
  for (const c of MAP_REF.plugs) drawLine(c, false);
  const sea = new Uint8Array(N), q = [];
  const seed = (x, y) => { const i = idx(x, y); if (!sea[i] && !wall[i] && !cliff[i] && !forest[i]) { sea[i] = 1; q.push(i); } };
  for (let x = 0; x < W; x++) seed(x, H - 1);
  for (let y = 80; y < H; y++) { seed(0, y); seed(W - 1, y); }
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi], x = i % W, y = (i / W) | 0;
    if (x > 0) seed(x - 1, y); if (x < W - 1) seed(x + 1, y); if (y > 0) seed(x, y - 1); if (y < H - 1) seed(x, y + 1);
  }

  // 3. Base ground
  for (let i = 0; i < N; i++) {
    if (cliff[i]) G[i] = GND.CLIFF;
    else if (forest[i]) { G[i] = GND.FOREST; O[i] = OB.DENSE; }
    else if (sea[i]) G[i] = GND.WATER;
    else if (wall[i]) G[i] = GND.SAND;
  }
  // Widen beaches by one tile along the sea
  const nearSea = i => { const x = i % W, y = (i / W) | 0; return (x > 0 && sea[i - 1]) || (x < W - 1 && sea[i + 1]) || (y > 0 && sea[i - W]) || (y < H - 1 && sea[i + W]); };
  const beach = [];
  for (let i = 0; i < N; i++) {
    if (G[i] !== GND.GRASS) continue;
    const x = i % W, y = (i / W) | 0;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && coastWall[j] && nearSea(j)) { beach.push(i); break; }
  }
  for (const i of beach) G[i] = GND.SAND;

  // 4. The river
  for (const rv of MAP_REF.rivers) {
    let total = 0; for (let k = 0; k < rv.pts.length - 1; k++) total += dist(...rv.pts[k], ...rv.pts[k + 1]);
    let done = 0;
    for (let k = 0; k < rv.pts.length - 1; k++) {
      const [ax, ay] = rv.pts[k], [bx, by] = rv.pts[k + 1], len = dist(ax, ay, bx, by);
      for (let s = 0; s <= len; s += 2) {
        const px = ax + (bx - ax) * s / len, py = ay + (by - ay) * s / len, rad = lerp(rv.r0, rv.r1, (done + s) / total);
        const cx = (px - PX0) / PXS, cy = (py - PY0) / PXS;
        for (let y = Math.floor(cy - rad - 1); y <= cy + rad + 1; y++) for (let x = Math.floor(cx - rad - 1); x <= cx + rad + 1; x++) {
          if (!inb(x, y) || cliff[idx(x, y)]) continue;
          if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rad * rad) { G[idx(x, y)] = GND.WATER; O[idx(x, y)] = 0; }
        }
      }
      done += len;
    }
  }
  // The waterfall at the river's source, spilling down the northern cliff
  for (let x = 112; x <= 132; x++) {
    let yb = -1; for (let y = 0; y < H && G[idx(x, y)] === GND.CLIFF; y++) yb = y;
    if (yb < 0 || G[idx(x, yb + 1)] !== GND.WATER) continue;
    for (let k = 0; k <= yb; k++) G[idx(x, yb - k)] = k < 2 ? GND.FALLS : GND.WATER;
  }

  // 5. Your farm is the land between the two river branches
  const fq = [idx(SPAWN.x, SPAWN.y)];
  World.farm[fq[0]] = 1;
  for (let qi = 0; qi < fq.length; qi++) {
    const i = fq[qi], x = i % W, y = (i / W) | 0;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (!inb(nx, ny)) continue;
      const j = idx(nx, ny);
      if (World.farm[j] || G[j] !== GND.GRASS && G[j] !== GND.SAND) continue;
      World.farm[j] = 1; fq.push(j);
    }
  }
  FARM = { x0: W, y0: H, x1: 0, y1: 0 };
  for (let i = 0; i < N; i++) if (World.farm[i]) { const x = i % W, y = (i / W) | 0; FARM.x0 = Math.min(FARM.x0, x); FARM.x1 = Math.max(FARM.x1, x); FARM.y0 = Math.min(FARM.y0, y); FARM.y1 = Math.max(FARM.y1, y); }

  // 6. Regions: the Whispering Woods to the north-west, the Wolfwood to the east, plaza in town
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y);
    if (G[i] !== GND.GRASS || World.farm[i] || inRect(VILLAGE, x, y)) continue;
    const n = Math.round((fbm(x / 12, y / 12, 17) - 0.5) * 20);
    if (x < 144 + n && y < 92 + n) G[i] = GND.FOREST;
    else if (x >= 226 + n && y < 160) G[i] = GND.FOREST;
  }
  for (let y = PLAZA.y - 8; y <= PLAZA.y + 8; y++) for (let x = PLAZA.x - 8; x <= PLAZA.x + 8; x++) if ((x - PLAZA.x) ** 2 + (y - PLAZA.y) ** 2 <= 56 && G[idx(x, y)] === GND.GRASS) G[idx(x, y)] = GND.PLAZA;

  // 7. Cliff depth (for drawing the rock face) and pines on the highlands above
  for (let x = 0; x < W; x++) for (let y = H - 1; y >= 0; y--) {
    const i = idx(x, y);
    if (G[i] !== GND.CLIFF) continue;
    const below = y < H - 1 ? World.cliffD[i + W] : 0;
    World.cliffD[i] = Math.min(9, (y < H - 1 && G[i + W] === GND.CLIFF ? below : 0) + 1);
    if (World.cliffD[i] >= 4 && hash2(x, y, 51) < 0.1 && x > 1 && x < W - 2 && G[i + 1] === GND.CLIFF && G[i + 2] === GND.CLIFF) O[i] = OB.DENSE;
  }

  // 8. Scatter trees, rocks, weeds and forage
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y);
    if (O[i] || blockedGround(G[i])) continue;
    const g = G[i], h = r();
    if (World.farm[i]) {
      if (g !== GND.GRASS) continue;
      if (h < 0.09) O[i] = OB.WEED; else if (h < 0.13) O[i] = OB.TWIG; else if (h < 0.17) O[i] = OB.ROCK;
      else if (h < 0.185) O[i] = OB.OAK; else if (h < 0.19) O[i] = OB.BOULDER;
      continue;
    }
    if (inRect(VILLAGE, x, y)) { if (g === GND.GRASS && (x - PLAZA.x) ** 2 + (y - PLAZA.y) ** 2 > 140) { if (h < 0.015) O[i] = OB.OAK; else if (h < 0.03) O[i] = OB.BUSH; } continue; }
    if (g === GND.FOREST) {
      const wolf = x >= WOLFWOOD_X, h2 = r();
      if (fbm(x / 14, y / 14, 21) > 0.6) {
        if (h < 0.04) O[i] = OB.CAP; else if (h < 0.06) O[i] = OB.GLOW; else if (h < 0.1) O[i] = OB.WEED; else if (h < 0.13) O[i] = OB.BUSH;
        else if (h < (wolf ? 0.19 : 0.15)) O[i] = h2 < 0.55 ? OB.ROCK : h2 < 0.85 ? OB.ORE : OB.CRYSTAL;
      } else {
        if (h < 0.24) O[i] = (wolf ? h2 < 0.7 : h2 < 0.5) ? OB.PINE : OB.OAK; else if (h < 0.27) O[i] = OB.CAP; else if (h < 0.285) O[i] = OB.GLOW;
        else if (h < 0.32) O[i] = OB.BUSH; else if (h < 0.35) O[i] = OB.TWIG; else if (h < 0.38) O[i] = OB.WEED;
        else if (h < (wolf ? 0.41 : 0.39)) O[i] = h2 < 0.5 ? OB.ROCK : h2 < 0.8 ? OB.ORE : h2 < 0.92 ? OB.CRYSTAL : OB.BOULDER;
      }
    } else if (g === GND.GRASS) {
      const meadow = inRect(PENINSULA, x, y);
      if (h < (meadow ? 0.03 : 0.06)) O[i] = OB.OAK; else if (h < 0.08) O[i] = OB.PINE; else if (h < 0.1) O[i] = OB.BUSH;
      else if (h < 0.13) O[i] = OB.WEED; else if (h < (meadow ? 0.2 : 0.15)) O[i] = OB.DEW; else if (h < (meadow ? 0.205 : 0.16)) O[i] = OB.ROCK;
    } else if (g === GND.SAND && h < 0.02) O[i] = OB.ROCK;
  }
  // The far southern island hides crystals
  for (let y = 252; y < 304; y++) for (let x = 152; x < 192; x++) { const i = idx(x, y); if (!O[i] && G[i] === GND.GRASS && hash2(x, y, 61) < 0.12) O[i] = OB.CRYSTAL; }

  const clearRect = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y) && World.bmap[idx(x, y)] < 0 && O[idx(x, y)] !== OB.DENSE) O[idx(x, y)] = 0; };
  const carve = (pts, w = 2) => {
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= n; s++) {
        const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n);
        for (let oy = 0; oy < w; oy++) for (let ox = 0; ox < w; ox++) {
          const X = x + ox, Y = y + oy;
          if (!inb(X, Y)) continue;
          const i = idx(X, Y);
          if (World.bmap[i] >= 0 || G[i] === GND.CLIFF || G[i] === GND.FALLS) continue;
          if (G[i] === GND.WATER) G[i] = GND.BRIDGE;
          else if (G[i] !== GND.BRIDGE && G[i] !== GND.PLAZA) G[i] = GND.PATH;
          O[i] = 0;
        }
      }
    }
  };

  // 9. Paths and bridges
  carve([[182, 119], [182, 124], [132, 124], [104, 116], [77, 114]]);              // farm -> bridge -> town
  carve([[182, 124], [228, 124], [252, 104], [264, 80]]);                          // farm -> bridge -> Wolfwood
  carve([[70, 106], [70, 80], [88, 68], [89, 64]]);                                // town -> woods -> Moonwell
  carve([[70, 84], [42, 78], [33, 72]]);                                           // woods -> Lumi's house
  carve([[90, 120], [106, 136], [108, 152], [104, 170], [96, 190], [108, 198], [124, 198]]); // town -> meadow -> bridge -> Fairy Isle

  // 10. Clearings
  clearRect(HOUSE_CLEAR.x0, HOUSE_CLEAR.y0, HOUSE_CLEAR.x1, HOUSE_CLEAR.y1);
  for (let y = 50; y <= 76; y++) for (let x = 78; x <= 102; x++) if ((x - 89) ** 2 + (y - 62) ** 2 <= 70 && G[idx(x, y)] !== GND.WATER) O[idx(x, y)] = 0;
  clearRect(26, 64, 44, 82);

  // 11. Buildings, plus the cave into Moonfall Depths in the cliff just west of the waterfall
  let fx = W;
  for (let x = 100; x < 140; x++) for (let y = 0; y < 40; y++) if (G[idx(x, y)] === GND.FALLS) fx = Math.min(fx, x);
  let cx = fx - 6, cy = 0;
  for (; cx > fx - 20; cx--) {
    cy = 0; while (cy < H - 1 && G[idx(cx + 1, cy)] === GND.CLIFF) cy++;
    if ([0, 1, 2].every(k => G[idx(cx + k, cy)] !== GND.WATER && G[idx(cx + k, cy - 1)] === GND.CLIFF)) break;
  }
  const caveDef = { id: 'cave', kind: 'cave', x: cx, y: cy - 2, w: 3, h: 2, door: 1, label: 'Enter the Depths', action: 'dungeon' };
  for (const def of [...BUILDING_DEFS, caveDef]) {
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
  CAVE = World.buildings.find(b => b.id === 'cave');
  carve([[92, 63], [104, 44], [CAVE.x + 1, CAVE.y + 4], [CAVE.x + 1, CAVE.y + 2]]); // Moonwell -> the cave
  carve([[58, 107], [58, 110], [63, 112]]);         // seed shop
  carve([[80, 105], [80, 108], [76, 110]]);         // apothecary
  carve([[54, 122], [60, 122], [64, 118]]);         // elder's house
  carve([[85, 124], [82, 124], [82, 118], [77, 116]]); // forge
  carve([[73, 129], [78, 129], [78, 122], [74, 120]]); // cottage

  // 12. Details
  for (const [x, y] of Object.values(NPCS).map(n => n.home)) clearRect(x - 1, y - 1, x + 1, y + 1);
  const putFree = (x, y, o) => { if (!inb(x, y)) return false; const i = idx(x, y); if (World.bmap[i] >= 0 || blockedGround(G[i]) || G[i] === GND.BRIDGE || G[i] === GND.PATH) return false; O[i] = o; return true; };
  for (const [x, y] of [[62, 106], [77, 106], [61, 122], [80, 119], [96, 113], [112, 121], [140, 122], [157, 122], [207, 122], [218, 127]]) putFree(x, y, OB.LAMP);
  const sign = (x, y, text) => { if (putFree(x, y, OB.SIGN)) World.signs.set(idx(x, y), text); };
  sign(179, 127, "Your farm, between the river's two arms. West: Fernhollow. East: the Wolfwood.");
  sign(104, 112, 'Fernhollow. Shops open by day. The Moonwell is north through the woods.');
  sign(73, 88, "North: the Whispering Woods, the Moonwell and Lumi's house.");
  sign(231, 128, 'East: the Wolfwood. Wolves hunt there, day and night. Carry your blade!');
  sign(110, 144, 'South: Sunny Meadow and the bridge to Fairy Isle.');
  putFree(186, 118, OB.CRATE);
  O[idx(TEST_CHEST.x, TEST_CHEST.y)] = OB.TESTCHEST;
  O[idx(LOVE_SIGN.x, LOVE_SIGN.y)] = OB.LOVESIGN; World.signs.set(idx(LOVE_SIGN.x, LOVE_SIGN.y), LOVE_SIGN.text);
  clearRect(SPAWN.x - 1, SPAWN.y, SPAWN.x + 1, SPAWN.y + 1);
}

// After loading a save, put back fixed things the save may predate (new buildings, the test chest).
function restampStatic() {
  World.buildings.forEach((b, bi) => { for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { World.obj[idx(x, y)] = OB.BLOCK; World.bmap[idx(x, y)] = bi; } });
  World.obj[idx(TEST_CHEST.x, TEST_CHEST.y)] = OB.TESTCHEST;
  World.obj[idx(LOVE_SIGN.x, LOVE_SIGN.y)] = OB.LOVESIGN;
  for (let y = CAVE.y + 2; y <= CAVE.y + 4; y++) for (let x = CAVE.x; x <= CAVE.x + 2; x++) { const i = idx(x, y); if (World.obj[i] && World.obj[i] !== OB.BLOCK) World.obj[i] = 0; }
}

// Respawns forage, debris and minerals each morning, up to a cap per type.
function dailyRespawn() {
  const O = World.obj, G = World.ground, counts = {};
  for (let i = 0; i < O.length; i++) counts[O[i]] = (counts[O[i]] || 0) + 1;
  let farmDebris = 0;
  for (let y = FARM.y0; y <= FARM.y1; y++) for (let x = FARM.x0; x <= FARM.x1; x++) { if (!inFarm(x, y)) continue; const o = O[idx(x, y)]; if (o === OB.WEED || o === OB.TWIG || o === OB.ROCK) farmDebris++; }
  const tryPut = (x, y, o) => {
    if (!inb(x, y)) return false;
    const i = idx(x, y);
    if (O[i] || World.bmap[i] >= 0 || World.crops.has(i)) return false;
    const g = G[i];
    if (blockedGround(g) || g === GND.TILLED || g === GND.PATH || g === GND.BRIDGE || g === GND.PLAZA) return false;
    if (Math.abs(x - SPAWN.x) < 3 && Math.abs(y - SPAWN.y) < 3) return false;
    O[i] = o; return true;
  };
  const rx = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  for (let k = 0; k < 40 && farmDebris < 150; k++) {
    const x = rx(FARM.x0, FARM.x1), y = rx(FARM.y0, FARM.y1);
    if (!inFarm(x, y) || inRect(HOUSE_CLEAR, x, y) || G[idx(x, y)] !== GND.GRASS) continue;
    const h = Math.random();
    if (tryPut(x, y, h < 0.6 ? OB.WEED : h < 0.85 ? OB.TWIG : OB.ROCK)) farmDebris++;
  }
  for (let k = 0; k < 600; k++) {
    const x = rx(4, W - 5), y = rx(4, H - 5), g = G[idx(x, y)], z = zoneAt(x, y);
    if (g === GND.FOREST && (z === 'woods' || z === 'wolfwood')) {
      const h = Math.random();
      if (h < 0.55) { if ((counts[OB.CAP] || 0) < 300 && tryPut(x, y, OB.CAP)) counts[OB.CAP] = (counts[OB.CAP] || 0) + 1; }
      else if (h < 0.7) { if ((counts[OB.GLOW] || 0) < 100 && tryPut(x, y, OB.GLOW)) counts[OB.GLOW] = (counts[OB.GLOW] || 0) + 1; }
      else {
        const o = h < 0.82 ? OB.ROCK : h < 0.94 ? OB.ORE : OB.CRYSTAL, cap = { [OB.ROCK]: 300, [OB.ORE]: 140, [OB.CRYSTAL]: 70 }[o];
        if ((counts[o] || 0) < cap && tryPut(x, y, o)) counts[o] = (counts[o] || 0) + 1;
      }
    } else if (g === GND.GRASS && (z === 'wild' || z === 'meadow') && (counts[OB.DEW] || 0) < 250) {
      if (tryPut(x, y, OB.DEW)) counts[OB.DEW] = (counts[OB.DEW] || 0) + 1;
    }
  }
}

// One pixel per tile, used by the map screen.
function mapImage() {
  const pal = SEASON_PAL[S ? S.season : 0];
  const col = { [GND.GRASS]: pal.grass, [GND.PATH]: '#c8a070', [GND.WATER]: '#3f7fd0', [GND.SAND]: '#e3cc92', [GND.TILLED]: '#6b4a2e', [GND.PLAZA]: '#b8b0c8', [GND.FOREST]: pal.forest, [GND.ROCKY]: '#8d867a', [GND.BRIDGE]: '#a36f3c', [GND.CLIFF]: '#5a5048', [GND.FALLS]: '#d8f0ff', [GND.DFLOOR]: '#6a6478', [GND.DWALL]: '#1a1622' };
  return mk(W, H, g => {
    const id = g.createImageData(W, H), d = id.data;
    for (let i = 0; i < W * H; i++) {
      let c = col[World.ground[i]];
      const o = World.obj[i];
      if (World.ground[i] === GND.CLIFF && World.cliffD[i] <= 2) c = '#7d7064';
      if (World.bmap[i] >= 0) c = '#c0503a';
      else if (o === OB.OAK || o === OB.PINE || o === OB.DENSE) c = shade(pal.forest, -0.4);
      else if (o === OB.ROCK || o === OB.BOULDER || o === OB.ORE) c = '#6e6a76';
      else if (o === OB.CRYSTAL) c = '#b48cff';
      else if (World.crops.has(i)) c = '#7ac85a';
      const [r, gg, b] = hexRgb(c);
      d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
    }
    g.putImageData(id, 0, 0);
  });
}
