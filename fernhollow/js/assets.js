'use strict';
// ---------- Custom sprites ----------
// Loads the PNGs listed in assets/sprites.js (SPRITE_FILES) and swaps them in for the
// built-in art. Anything not listed keeps its built-in look. See assets/README.md.
const OVR = {};
const spriteURL = (c, fallback = '') => { try { return c.src || c.toDataURL(); } catch (e) { return fallback; } };

// Cut a sheet into frames of w x h, reading `n` frames across from row `row`.
function cutSheet(img, w, h, n, row = 0) {
  return Array.from({ length: n }, (_, i) => mk(w, h, g => g.drawImage(img, i * w, row * h, w, h, 0, 0, w, h)));
}
// Frames for a tile with variants: a 16px-tall strip, repeated to fill `n` slots.
function tileVariants(img, n) {
  const cut = cutSheet(img, 16, 16, Math.max(1, Math.floor(img.width / 16)));
  return Array.from({ length: n }, (_, i) => cut[i % cut.length]);
}

function loadSpriteFiles() {
  const files = typeof SPRITE_FILES === 'object' && SPRITE_FILES ? SPRITE_FILES : {};
  const failed = [];
  const jobs = Object.entries(files).map(([key, file]) => new Promise(done => {
    const img = new Image();
    img.onload = () => { OVR[key] = img; done(); };
    img.onerror = () => { failed.push(file); console.warn(`Fernhollow: could not load assets/${file} for "${key}"`); done(); };
    img.src = 'assets/' + file;
  }));
  return Promise.all(jobs).then(() => {
    applySpriteFiles();
    if (failed.length) setTimeout(() => UI.toast(`Couldn't load ${failed.length} sprite file${failed.length > 1 ? 's' : ''}: ${failed.slice(0, 3).join(', ')}`), 800);
  });
}

function applySpriteFiles() {
  for (const [key, img] of Object.entries(OVR)) {
    const dot = key.indexOf('.'), kind = key.slice(0, dot), name = key.slice(dot + 1);
    switch (kind) {
      case 'item': ICONS[name] = img; ICON_URL[name] = img.src; break;
      case 'obj': if (name === 'fence') SPR.fence = Array(16).fill(img); else SPR[name] = img; break;
      case 'tile':
        if (name === 'water' || name === 'waterDeep' || name === 'falls') SPR[name] = tileVariants(img, 3);
        else if (name === 'path' || name === 'rocky') SPR[name] = tileVariants(img, 3);
        else if (name === 'sand') SPR[name] = tileVariants(img, 2);
        else if (!['grass', 'forest', 'plateau', 'cliffTop', 'cliffBottom', 'cliffSide'].includes(name)) SPR[name] = img; // seasonal ones are applied in buildSeason
        break;
      case 'building': SPR.bld[name] = img; break;
      case 'char': CHAR[name] = [0, 1, 2, 3].map(r => cutSheet(img, 16, 28, 4, r)); PORTRAIT_URL[name] = spriteURL(mk(16, 19, g => g.drawImage(CHAR[name][0][0], 0, 0)), PORTRAIT_URL[name]); break;
      case 'crop': SPR.crop[name] = cutSheet(img, 16, 20, 5); break;
      case 'enemy': {
        const fr = cutSheet(img, Math.floor(img.width / 2), img.height, 2);
        if (['dslime', 'bat', 'skeleton', 'goblin'].includes(name)) {
          for (let t = 0; t < 5; t++) enemyCache[name + t] = { L: fr, R: fr.map(mirrorC), LW: fr.map(whiteC), RW: fr.map(mirrorC).map(whiteC) };
        } else {
          SPR[name] = fr; SPR[name + 'W'] = fr.map(whiteC);
          if (name === 'wolf') { SPR.wolfR = fr.map(mirrorC); SPR.wolfRW = SPR.wolfR.map(whiteC); }
        }
        break;
      }
    }
  }
  for (const k in seasonCache) delete seasonCache[k];
  SEAS = buildSeason(S ? S.season : 0);
}

// Called at the end of buildSeason: seasonal tiles and trees (the same file is used in every season).
function applySeasonOverrides(out) {
  if (OVR['tile.grass']) out.grass = tileVariants(OVR['tile.grass'], 4);
  if (OVR['tile.forest']) out.forest = tileVariants(OVR['tile.forest'], 3);
  if (OVR['tile.plateau']) out.plateau = tileVariants(OVR['tile.plateau'], 2);
  if (OVR['tile.cliffTop']) out.cliff[0] = OVR['tile.cliffTop'];
  if (OVR['tile.cliffBottom']) out.cliff[1] = OVR['tile.cliffBottom'];
  if (OVR['tile.cliffSide']) out.cliffSide = OVR['tile.cliffSide'];
  if (OVR['tree.oak']) out.oak = OVR['tree.oak'];
  if (OVR['tree.pine']) out.pine = OVR['tree.pine'];
  if (OVR['obj.bush']) out.bush = OVR['obj.bush'];
  if (OVR['obj.weed']) out.weed = OVR['obj.weed'];
  return out;
}
