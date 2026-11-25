'use strict';
// ---------- Settings (saved separately from the game) ----------
const SETTINGS_KEY = 'fernhollow-settings-v1';
const SAVE_KEY = 'fernhollow-save-v2'; // v2: new hand-drawn map
const Settings = Object.assign(
  { music: 50, sfx: 80, zoom: 'normal', touch: 'auto', rumble: true, clock24: false, highlight: true },
  Store.get(SETTINGS_KEY, {})
);
const saveSettings = () => Store.set(SETTINGS_KEY, Settings);

// ---------- Calendar ----------
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const DAYS_PER_SEASON = 14;
const MIN_PER_SEC = 10 / 7; // in-game minutes per real second (a day lasts ~14 minutes)
const DAY_START = 6 * 60, DAY_END = 26 * 60; // 6:00am .. 2:00am

// ---------- Crops ----------
const CROPS = {
  carrot: { name: 'Glimmer Carrot', seed: 20, sell: 40, days: 4, seasons: [0, 1], leaf: '#5fbf4a', fruit: '#ff9a3c', shape: 'root', food: 12, desc: 'A carrot that faintly sparkles. Crunchy and cheerful.' },
  bloom: { name: 'Moonbloom', seed: 40, sell: 95, days: 6, seasons: [0, 2], leaf: '#4e9e7a', fruit: '#d6e8ff', shape: 'flower', glow: true, desc: 'A pale flower that glows softly under the moon.' },
  ember: { name: 'Emberroot', seed: 30, sell: 75, days: 5, seasons: [1], leaf: '#7a9a3a', fruit: '#e0402a', shape: 'root', food: 14, desc: 'Warm to the touch, even in the shade.' },
  berry: { name: 'Dawnberry', seed: 80, sell: 38, days: 7, regrow: 3, seasons: [1, 2], leaf: '#3f8f4f', fruit: '#f05a9a', shape: 'bush', food: 10, desc: 'Sweet berries that taste like sunrise. Keeps producing after harvest.' },
  pumpkin: { name: 'Wisp Pumpkin', seed: 70, sell: 220, days: 9, seasons: [2], leaf: '#4f8a3a', fruit: '#9b7bff', shape: 'big', glow: true, food: 25, desc: 'Some say a wisp sleeps inside each one.' },
  melon: { name: 'Frostmelon', seed: 60, sell: 160, days: 7, seasons: [3], leaf: '#5aa6a0', fruit: '#9ee8ff', shape: 'big', food: 20, desc: 'Grows only in the cold. Crisp, icy and sweet.' },
};

// ---------- Items ----------
const ITEMS = {
  hoe: { name: 'Hoe', cat: 'tool', desc: 'Till soil on your farm so you can plant seeds.' },
  can: { name: 'Watering Can', cat: 'tool', desc: 'Water tilled soil. Refill it at any pond or river.' },
  axe: { name: 'Axe', cat: 'tool', desc: 'Chop branches, stumps, bushes and trees for wood.' },
  pick: { name: 'Pickaxe', cat: 'tool', desc: 'Breaks rocks, crystals and ore. Also picks up placed items and un-tills empty soil.' },
  sword: { name: 'Thornblade', cat: 'tool', desc: 'An old fae-forged blade. Cuts weeds and fends off monsters.' },
  wood: { name: 'Wood', cat: 'mat', sell: 2, desc: 'Sturdy timber for crafting.' },
  stone: { name: 'Stone', cat: 'mat', sell: 2, desc: 'A common stone. Useful for crafting.' },
  fiber: { name: 'Fiber', cat: 'mat', sell: 1, desc: 'Tough plant fiber from weeds.' },
  shard: { name: 'Aether Shard', cat: 'mat', sell: 60, desc: 'A crystal humming with old magic. Found in the Crystal Hills.' },
  ore: { name: 'Star-Iron Ore', cat: 'mat', sell: 15, desc: 'Ore flecked with tiny stars.' },
  gel: { name: 'Moss Gel', cat: 'mat', sell: 6, desc: 'Squishy. Left behind by slimes.' },
  gloom: { name: 'Gloom Essence', cat: 'mat', sell: 14, desc: 'The dim remains of a night wisp.' },
  cap: { name: 'Fairy Cap', cat: 'forage', sell: 30, food: 15, desc: 'A spotted mushroom from the Whispering Woods. Edible.' },
  dew: { name: 'Dewblossom', cat: 'forage', sell: 25, desc: 'A wildflower that is always wet with morning dew.' },
  glowcap: { name: 'Glowcap', cat: 'forage', sell: 45, desc: 'A softly shining mushroom. Mirabel uses these.' },
  fence: { name: 'Fence', cat: 'place', place: 'fence', sell: 1, desc: 'Keeps things in. Or out.' },
  sprinkler: { name: 'Rune Sprinkler', cat: 'place', place: 'sprinkler', sell: 150, desc: 'Waters the 8 tiles around it every morning.' },
  lantern: { name: 'Fae Lantern', cat: 'place', place: 'lantern', sell: 50, desc: 'A little light for long nights.' },
  stew: { name: 'Forest Stew', cat: 'food', food: 60, heal: 30, sell: 90, desc: 'Hearty and warm. Restores 60 energy.' },
  tonic: { name: 'Vigor Tonic', cat: 'food', food: 100, heal: 60, sell: 60, desc: 'Fizzy and bright. Restores 100 energy.' },
  dust: { name: 'Growth Dust', cat: 'special', sell: 20, desc: 'Sprinkle on a growing crop to speed it up by one day.' },
};
for (const [k, c] of Object.entries(CROPS)) {
  const when = c.seasons.map(s => SEASONS[s]).join(' & ');
  ITEMS[k] = { name: c.name, cat: 'crop', sell: c.sell, food: c.food, desc: c.desc + (c.food ? ` Restores ${c.food} energy.` : '') };
  ITEMS['seed_' + k] = {
    name: c.name + ' Seeds', cat: 'seed', crop: k, price: c.seed, sell: Math.floor(c.seed / 2),
    desc: `Plant in tilled soil and water daily. Ready in ${c.days} days${c.regrow ? `, then every ${c.regrow} days` : ''}. Grows in ${when}.`,
  };
}
const isTool = id => ITEMS[id] && ITEMS[id].cat === 'tool';
const maxStack = id => (isTool(id) ? 1 : 999);

const RECIPES = [
  { id: 'fence', qty: 4, need: { wood: 2 } },
  { id: 'lantern', qty: 1, need: { wood: 5, shard: 1 } },
  { id: 'sprinkler', qty: 1, need: { ore: 4, stone: 6, shard: 1 } },
  { id: 'stew', qty: 1, need: { cap: 2, carrot: 1 } },
  { id: 'tonic', qty: 1, need: { glowcap: 1, berry: 2 } },
];

// ---------- Characters ----------
const LOOKS = {
  player: { skin: '#f2c49b', hair: '#8a4e2a', shirt: '#4f9a5a', pants: '#5a4a7a', boots: '#4a2e1c', acc: ['strawhat'] },
  thistle: { skin: '#eab38a', hair: '#e0a040', shirt: '#c86a3a', pants: '#5a6a3a', acc: ['apron', 'ears'] },
  mirabel: { skin: '#e8c8b0', hair: '#cfd0e6', shirt: '#5a3a8a', pants: '#3a2a5a', acc: ['witch', 'robe'] },
  bram: { skin: '#e0a07a', hair: '#c0603a', shirt: '#7a5a3a', pants: '#4a4a5a', acc: ['beard', 'bandana'] },
  lumi: { skin: '#f6dcc8', hair: '#6fe3c8', shirt: '#b48cff', pants: '#7a5ac8', acc: ['ears', 'wings'] },
  oswin: { skin: '#e8bfa0', hair: '#ececec', shirt: '#3f5f9a', pants: '#2f3f6a', acc: ['beard', 'robe'] },
};

const NPCS = {
  thistle: {
    name: 'Thistle', home: [27, 53], hours: [8, 20],
    loves: ['bloom', 'dew'], likes: ['carrot', 'berry', 'cap'], hates: ['gloom', 'gel'],
    intro: "Oh! You must be the new farmer! I'm Thistle: seeds, sprouts and gossip, all sold right here at my stall. Open from 8 in the morning till 8 at night!",
    lines: [
      "Plant 'em, water 'em, talk to 'em. Plants love a good chat.",
      'Glimmer Carrots are the easiest crop in the hollow. Perfect for beginners!',
      "If the soil dries out, your crops won't grow that day. Water every morning!",
      'I once grew a Wisp Pumpkin so big it floated away. True story. Mostly.',
      'Rune Sprinklers water crops for you. Bram makes them, or you can craft one.',
      'Growth Dust is my secret recipe. Ground-up sunshine. Probably.',
    ],
    rain: ["Rain's the best kind of day. The crops water themselves and I get to nap!"],
    season: [
      "Spring's here! Moonblooms and Glimmer Carrots love this weather.",
      'Summer means Emberroots and Dawnberries. Hot and sweet!',
      "Autumn's for Wisp Pumpkins. Nine days to grow, but worth every coin.",
      'Most things sleep in winter, but Frostmelons wake right up.',
    ],
    hearts: ["You know, you're my favorite customer. Don't tell the others!"],
  },
  mirabel: {
    name: 'Mirabel', home: [43, 52], hours: [9, 21],
    loves: ['shard', 'glowcap'], likes: ['cap', 'gloom', 'bloom'], hates: ['fiber'],
    intro: "Ah. The new keeper of the old farm. Your grandmother was a dear friend of mine. I'm Mirabel: tonics, lanterns, and the occasional curse removal.",
    lines: [
      'Glowcaps grow deep in the Whispering Woods. Bring me some and I may be... grateful.',
      'The Moonwell in the woods restores body and spirit. Once a day. It is not a fountain for greedy fools.',
      'Wisps drift out after dark. Carry your blade if you wander.',
      "I brew Vigor Tonics from Glowcaps and Dawnberries. You could too, if you're clever.",
      "Aether Shards sing if you listen closely. Most people don't.",
    ],
    rain: ['Rain carries the old magic down from the hills. Can you smell it?'],
    season: [
      'Spring air makes every potion fizz twice as hard.',
      'Summer nights are short. The wisps are grumpier for it.',
      'Autumn is when the veil is thinnest. Keep a lantern lit.',
      'Winter is for reading, brewing, and avoiding Bram\'s singing.',
    ],
    hearts: ["You've a kind heart. Rare, in my experience. Don't lose it."],
  },
  bram: {
    name: 'Bram', home: [46, 67], hours: [8, 19],
    loves: ['ore', 'stew'], likes: ['stone', 'pumpkin', 'ember'], hates: ['dew'],
    intro: "Hrm. New farmer, eh? Bram. I make tools, fences, sprinklers. If it's metal, it's mine.",
    lines: [
      'Star-Iron Ore comes from the Crystal Hills, east past your farm. Mind the slimes.',
      'A Rune Sprinkler waters the eight tiles around it every morning. Saves your back.',
      'Crystal nodes take a few good swings. Put your shoulders into it.',
      'My copper watering can holds more than twice as much. Worth every coin.',
      'Back in my adventuring days, I fought a slime the size of a barn. Lost my boots.',
    ],
    rain: ['Rain cools the forge too fast. Bad for steel, good for napping.'],
    season: [
      'Spring. Everyone wants new hoes. Hah.',
      'Summer heat plus forge heat. I sweat like a waterfall.',
      'Autumn is the best season for hammering. Crisp air, steady hands.',
      'Winter. Good time to stock up on ore before the snow piles high.',
    ],
    hearts: ["You're alright, farmer. Better than alright. Don't make it weird."],
  },
  lumi: {
    name: 'Lumi', home: [20, 40], hours: [10, 23],
    loves: ['dew', 'berry'], likes: ['bloom', 'glowcap', 'carrot'], hates: ['ore', 'stone'],
    intro: "Hi hi! You can see me? Most big-folk can't! I'm Lumi. I live in the mushroom house in the woods!",
    lines: [
      'The mushrooms whisper where the Fairy Caps grow. They grow back every few days!',
      "Moonblooms shine at night like little moons. They're my favorite!",
      'If you get lost in the woods, just follow the path. The trees always lead home.',
      'Have you seen Moonfall? The waterfall where the river begins, way up north. It sparkles at night!',
      'The Moonwell glows brightest on the darkest nights.',
      "I'm not allowed in the hills. Too many rocks that bite!",
    ],
    rain: ['Puddles are tiny lakes for tiny people. Like me!'],
    season: [
      'Spring flowers taste like honey. Not that I eat them. Much.',
      'In summer the fireflies come out to play tag with me!',
      'Autumn leaves make the best blankets.',
      'Snow is cold fairy dust. Brrr!',
    ],
    hearts: ["You're my best big-folk friend. I made you a secret handshake. It's mostly wiggling."],
  },
  oswin: {
    name: 'Elder Oswin', home: [32, 60], hours: [7, 19],
    loves: ['pumpkin', 'stew'], likes: ['carrot', 'melon', 'cap'], hates: ['gel'],
    intro: 'So you made it. Welcome to Fernhollow, child. Your grandmother tended that farm for fifty years. The land has been waiting for you.',
    lines: [
      'The hollow remembers those who care for it.',
      'Ship your goods in the Market Crate beside your house. The merchants collect it each night.',
      'Cross the little bridge south of town and you will find Fairy Isle. Lovely place for a walk.',
      'In my youth, the fae danced in the square every full moon. Perhaps they will again.',
      'Rest when you are tired. A farmer who passes out in a field wakes up poorer.',
    ],
    rain: ['A rainy day is a gift. Let the sky do the watering.'],
    season: [
      'Spring is for beginnings. Plant generously.',
      'Summer rewards those who water every day.',
      'Autumn harvests are the richest. Do not miss the Wisp Pumpkins.',
      'Winter is quiet, but not idle. Mine the hills, mend your tools.',
    ],
    hearts: ['Your grandmother would be proud of you. I certainly am.'],
  },
};

const GIFT_LINES = {
  love: ['Oh! This is wonderful. Thank you so much!', 'How did you know? I love this!'],
  like: ['How thoughtful. Thank you.', "Oh, I like this. Thanks!"],
  neutral: ['Oh, for me? Thanks.', "That's kind of you."],
  hate: ['...Hm. I\'ll, uh, find a use for it.', "Oh. That's... not really my thing."],
};

const FORTUNES = [
  'You hear a faint giggle from the water.',
  'A fish-shaped ripple winks at you.',
  'You feel lucky today.',
  'The coin sinks... and glows, just for a moment.',
  'Somewhere, a fairy just got a little richer.',
];

// ---------- Shops ----------
const SHOPS = {
  seeds: {
    name: "Thistle's Seed Stall", owner: 'thistle', greet: "Fresh seeds for the season! Only what'll grow right now.",
    stock: () => [
      ...Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(S.season)).map(k => ({ id: 'seed_' + k, price: CROPS[k].seed })),
      { id: 'dust', price: 60 },
      { special: 'backpack', name: 'Big Backpack', desc: 'Adds 12 more inventory slots.', price: 2000, icon: 'bag', avail: () => S.invSize < 36 },
    ],
  },
  apothecary: {
    name: "Mirabel's Apothecary", owner: 'mirabel', greet: 'Potions, lanterns, and things you should not touch.',
    stock: () => [{ id: 'tonic', price: 150 }, { id: 'lantern', price: 250 }, { id: 'seed_bloom', price: 60 }],
  },
  forge: {
    name: "Bram's Forge", owner: 'bram', greet: 'Hrm. Buying or browsing?',
    stock: () => [
      { id: 'fence', price: 12 },
      { id: 'sprinkler', price: 700 },
      { special: 'can', name: 'Copper Watering Can', desc: 'Holds 100 water instead of 40.', price: 1200, icon: 'can', avail: () => S.canMax < 100 },
    ],
  },
};

// ---------- Tasks (given by Elder Oswin) ----------
const QUESTS = [
  { title: 'Clear the Way', desc: 'Gather 15 Wood by chopping branches, stumps or trees.', goal: 15, prog: s => s.stats.wood, reward: { gold: 150 } },
  { title: 'First Sprouts', desc: 'Harvest 5 crops from your farm.', goal: 5, prog: s => s.stats.harvest, reward: { gold: 200, items: [['seed_carrot', 10]] } },
  { title: 'Village Welcome', desc: 'Introduce yourself to Thistle, Mirabel, Bram and Lumi (Lumi lives in the woods).', goal: 4, prog: s => ['thistle', 'mirabel', 'bram', 'lumi'].filter(n => s.stats.talked.includes(n)).length, reward: { gold: 150 } },
  { title: 'Shimmer Seeker', desc: 'Mine 3 Aether Shards in the Crystal Hills to the east.', goal: 3, prog: s => s.stats.shards, reward: { gold: 300 } },
  { title: 'Market Day', desc: 'Earn 2,000g from the Market Crate.', goal: 2000, prog: s => s.stats.shipped, reward: { items: [['sprinkler', 2]] } },
  { title: 'Friend of Fernhollow', desc: 'Reach 3 hearts with any villager. Talk daily and give gifts they like.', goal: 3, prog: s => Math.max(0, ...Object.values(s.friends).map(f => heartsOf(f.pts))), reward: { gold: 800 } },
  { title: 'Moonlit Harvest', desc: 'Grow and harvest a Wisp Pumpkin (plant in Autumn).', goal: 1, prog: s => s.stats.pumpkin, reward: { gold: 2500 } },
];
const heartsOf = pts => Math.min(5, Math.floor(pts / 50));
