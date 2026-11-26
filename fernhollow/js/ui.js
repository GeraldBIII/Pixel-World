'use strict';
// DOM-based menus. Every menu is a "screen" on a stack; the top screen gets input.
// Elements with [data-nav] can be reached with D-pad / stick / arrow keys.
const UI = {
  stack: [], root: null, hud: {},

  init() {
    this.root = document.getElementById('screens');
    this.root.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      const s = this.top();
      if (!el || !s || !s.el.contains(el)) return;
      if (el.classList.contains('off')) { Sound.play('error'); if (el.dataset.why) UI.toastOnce(el.dataset.why); return; }
      const fn = s.actions && s.actions[el.dataset.act];
      if (fn) { Sound.play('ok'); fn(el, 1); }
    });
    this.root.addEventListener('mouseover', e => {
      const el = e.target.closest('[data-nav]');
      const typing = document.activeElement && document.activeElement.type === 'text';
      if (el && Input.mode === 'kb' && !typing && document.activeElement !== el) el.focus({ preventScroll: true });
    });
    this.root.addEventListener('focusin', e => { const s = this.top(); if (s && s.onFocus) s.onFocus(e.target); });
    this.root.addEventListener('input', e => { const s = this.top(); if (s && s.onInput) s.onInput(e.target); });
    for (const id of ['god', 'clock-date', 'clock-time', 'gold', 'en-bar', 'hp-bar', 'sta-bar', 'xp-bar', 'lv', 'task', 'itemname', 'hint', 'tb-act-label', 'tb-use-icon', 'tb-atk-icon']) this.hud[id] = document.getElementById(id);
    this.buildHotbar();
  },

  top() { return this.stack[this.stack.length - 1]; },
  blocking() { return this.stack.length > 0; },
  focusables(s) { return [...s.el.querySelectorAll('[data-nav]')].filter(e => e.offsetParent !== null); },
  focusFirst(s) {
    const f = (s.focus && s.el.querySelector(s.focus)) || this.focusables(s)[0];
    if (f) f.focus({ preventScroll: true });
  },
  open(def) {
    const prev = this.top();
    if (prev) prev.lastFocus = document.activeElement;
    const el = document.createElement('div');
    el.className = 'screen ' + (def.cls || '');
    el.innerHTML = def.html || '';
    this.root.appendChild(el);
    const s = Object.assign({}, def, { el });
    this.stack.push(s);
    document.body.classList.add('ui-open');
    if (s.init) s.init(s);
    if (!s.el.contains(document.activeElement)) this.focusFirst(s);
    return s;
  },
  close(s) {
    s = s || this.top();
    const i = this.stack.indexOf(s);
    if (i < 0) return;
    this.stack.splice(i, 1);
    s.el.remove();
    if (s.onClose) s.onClose();
    const t = this.top();
    if (t) {
      if (t.onReveal) t.onReveal();
      if (t.lastFocus && t.el.contains(t.lastFocus)) t.lastFocus.focus({ preventScroll: true }); else this.focusFirst(t);
    } else {
      document.body.classList.remove('ui-open');
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
  },
  closeAll() { while (this.stack.length) this.close(); },

  nav(dir) {
    const s = this.top(), els = this.focusables(s);
    if (!els.length) return;
    const cur = document.activeElement;
    if (!els.includes(cur)) { els[0].focus(); Sound.play('move'); return; }
    if (dir === 'left' || dir === 'right') {
      const d = dir === 'left' ? -1 : 1;
      if (cur.type === 'range') {
        cur.value = clamp(+cur.value + d * 10, +cur.min, +cur.max);
        cur.dispatchEvent(new Event('input', { bubbles: true }));
        Sound.play('move'); return;
      }
      if (cur.dataset.cycle !== undefined && s.actions && s.actions.cycle) { s.actions.cycle(cur, d); Sound.play('move'); return; }
    }
    const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = null, bs = 1e9;
    for (const el of els) {
      if (el === cur) continue;
      const q = el.getBoundingClientRect(), dx = q.left + q.width / 2 - cx, dy = q.top + q.height / 2 - cy;
      let p, o;
      if (dir === 'right') { p = dx; o = dy; } else if (dir === 'left') { p = -dx; o = dy; } else if (dir === 'down') { p = dy; o = dx; } else { p = -dy; o = dx; }
      if (p <= 2) continue;
      const sc = p + Math.abs(o) * 2.5;
      if (sc < bs) { bs = sc; best = el; }
    }
    if (best) { best.focus({ preventScroll: true }); best.scrollIntoView({ block: 'nearest', inline: 'nearest' }); Sound.play('move'); }
  },

  handle(e) {
    const s = this.top();
    if (!s) return;
    const a = e.a;
    if (s.onAction && s.onAction(a, e)) return;
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') { this.nav(a); return; }
    if (a === 'interact' || (a === 'use' && e.src === 'kb')) {
      const el = document.activeElement;
      if (el && s.el.contains(el) && el.matches('[data-nav]')) { if (el.type !== 'range') el.click(); }
      else if (s.onOk) s.onOk();
      return;
    }
    if (a === 'menu' && s.kind === 'pause') { Sound.play('ok'); this.close(); return; }
    if (a === 'submit') { if (s.onSubmit) s.onSubmit(); return; }
    if (a === 'back' || a === 'menu') { if (s.onBack) { Sound.play('ok'); s.onBack(); } return; }
    if (a === 'hotPrev' || a === 'hotNext') { if (s.onTab) { s.onTab(a === 'hotPrev' ? -1 : 1); Sound.play('move'); } return; }
    if (a === 'inventory' && s.kind === 'inventory') { this.close(); return; }
    if (a === 'map' && s.kind === 'map') { this.close(); return; }
  },

  // ---------- Toasts ----------
  toast(msg, icon) {
    const box = document.getElementById('toasts'), d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = (icon && ICON_URL[icon] ? `<img class="px" src="${ICON_URL[icon]}" alt="">` : '') + `<span>${esc(msg)}</span>`;
    box.appendChild(d);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => d.classList.add('out'), 2800);
    setTimeout(() => d.remove(), 3300);
  },
  toastOnce(msg) {
    const now = performance.now();
    if (this._lt === msg && now - this._lts < 2500) return;
    this._lt = msg; this._lts = now;
    this.toast(msg);
  },

  // ---------- HUD ----------
  buildHotbar() {
    const hb = document.getElementById('hotbar');
    hb.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const d = document.createElement('div');
      d.className = 'slot';
      d.innerHTML = `<img class="px" alt=""><span class="qty"></span><span class="key">${'1234567890-='[i]}</span><span class="wl"><i></i></span>`;
      d.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (playing && !UI.stack.length) selectSlot(i); });
      hb.appendChild(d);
    }
  },
  refreshHotbar() {
    if (!S) return;
    const slots = document.getElementById('hotbar').children;
    for (let i = 0; i < 12; i++) {
      const it = S.inv[i], el = slots[i], img = el.querySelector('img');
      el.classList.toggle('sel', i === S.sel);
      if (it) { if (img.dataset.id !== it.id) { img.src = ICON_URL[it.id]; img.dataset.id = it.id; } img.style.visibility = 'visible'; }
      else { img.style.visibility = 'hidden'; img.dataset.id = ''; }
      el.querySelector('.qty').textContent = it && it.n > 1 ? it.n : '';
      const wl = el.querySelector('.wl');
      wl.style.display = it && it.id === 'can' ? 'block' : 'none';
      if (it && it.id === 'can') wl.firstChild.style.width = (S.water / S.canMax * 100) + '%';
    }
    const it = S.inv[S.sel];
    this.hud['tb-use-icon'].src = it ? ICON_URL[it.id] : ICON_URL.hoe;
    this.hud['tb-use-icon'].style.visibility = it ? 'visible' : 'hidden';
  },
  showItemName() {
    const it = S.inv[S.sel], el = this.hud.itemname;
    el.textContent = it ? ITEMS[it.id].name : '';
    el.classList.remove('show'); void el.offsetWidth;
    if (it) el.classList.add('show');
  },
  _hud: {},
  setText(id, v) { if (this._hud[id] !== v) { this._hud[id] = v; this.hud[id].textContent = v; } },
  updateHUD() {
    if (!playing || !S) return;
    this.setText('clock-date', inDungeon() ? `Moonfall Depths · Floor ${DUN.floor}` : `${SEASONS[S.season]} ${S.day} · Year ${S.year}`);
    const godTxt = Settings.god || Settings.onehit ? `${Settings.god ? 'GOD' : ''}${Settings.god && Settings.onehit ? ' + ' : ''}${Settings.onehit ? '1-HIT' : ''} · PWR ${powerLevel()}${inDungeon() ? ` / floor ${floorPower(DUN.floor)}` : ''}` : '';
    this.setText('god', godTxt);
    this.hud.god.classList.toggle('hidden', !godTxt);
    const wIcon = S.weather === 'rain' ? (S.season === 3 ? '❄' : '☂') : (S.time >= 20 * 60 ? '☾' : '☀');
    this.setText('clock-time', `${wIcon} ${fmtTime(S.time)}`);
    this.setText('gold', `${S.gold.toLocaleString()}g`);
    const ew = Math.round(S.energy / S.maxEnergy * 100) + '%', hw = Math.round(S.hp / S.maxHp * 100) + '%';
    if (this._hud.en !== ew) { this._hud.en = ew; this.hud['en-bar'].style.width = ew; }
    if (this._hud.hp !== hw) { this._hud.hp = hw; this.hud['hp-bar'].style.width = hw; }
    const sw = Math.round(S.sta / S.maxSta * 100) + '%', xw = Math.round(S.xp / xpNeed(S.level) * 100) + '%';
    if (this._hud.sta !== sw) { this._hud.sta = sw; this.hud['sta-bar'].style.width = sw; }
    if (this._hud.xp !== xw) { this._hud.xp = xw; this.hud['xp-bar'].style.width = xw; }
    this.setText('lv', `Lv ${S.level}${S.points ? ' ★' : ''}`);
    const wi = S.equip.weapon ? ICON_URL[S.equip.weapon] : '';
    if (this._hud.wi !== wi) { this._hud.wi = wi; this.hud['tb-atk-icon'].src = wi || ICON_URL.sword; }
    const q = QUESTS[S.quest];
    this.setText('task', q ? `📜 ${q.title} ${Math.min(q.goal, q.prog(S)).toLocaleString()}/${q.goal.toLocaleString()}` : '📜 All tasks complete!');
    this.setText('tb-act-label', hint ? hint.label : 'Act');
    // Interaction hint bubble over the target
    const h = this.hud.hint;
    if (hint && !UI.stack.length && Input.mode !== 'touch') {
      const glyph = Input.mode === 'pad' ? '<b class="g-a">A</b>' : '<b class="g-k">E</b>';
      const html = glyph + esc(hint.label);
      if (this._hud.hint !== html) { this._hud.hint = html; h.innerHTML = html; }
      const rect = canvas.getBoundingClientRect();
      h.style.transform = `translate(${Math.round(rect.left + (hint.x - cam.x) * SCALE)}px, ${Math.round(rect.top + (hint.y - cam.y) * SCALE)}px) translate(-50%,-100%)`;
      h.classList.add('show');
    } else h.classList.remove('show');
  },

  // Desktop: hotbar at the bottom. Touch, landscape: hotbar at the top between the clock and the
  // top-right buttons, leaving the bottom for the thumbs. Touch, portrait: above the controls.
  layout() {
    const touch = document.body.classList.contains('touch-on'), w = innerWidth, h = innerHeight, root = document.documentElement.style;
    let slot, top = false, up = false;
    if (touch && w > h) {
      const clockR = (document.getElementById('clock').getBoundingClientRect().right || 190) + 8, right = w - 170;
      slot = Math.floor((right - clockR - 30) / 12);
      top = true;
      root.setProperty('--hb-left', Math.round((clockR + right) / 2) + 'px');
    } else if (touch) { slot = Math.floor((w - 40) / 12); up = true; }
    else slot = Math.floor((Math.min(w - 24, 640) - 32) / 12);
    document.body.classList.toggle('hotbar-top', top);
    document.body.classList.toggle('hotbar-up', up);
    root.setProperty('--slot', clamp(slot, 20, 46) + 'px');
  },

  // ---------- Dialogue ----------
  say(who, texts, cb) {
    const name = typeof who === 'string' ? NPCS[who].name : who.name;
    const por = typeof who === 'string' ? PORTRAIT_URL[who] : who.portrait;
    let i = 0, shown = 0, full = '', timer = null, downHere = false, textEl = null;
    const s = this.open({
      kind: 'dialog', cls: 'dlg',
      html: `<div class="panel dialog"><img class="portrait px" src="${por}" alt=""><div class="dbody"><div class="name">${esc(name)}</div><div class="text"></div><div class="more"><span class="kb-only">E</span><span class="pad-only">Ⓐ</span><span class="touch-only">tap</span> ▼</div></div></div>`,
      onAction: a => { if (['interact', 'use', 'back', 'menu'].includes(a)) next(); return true; },
      init: s => {
        s.el.addEventListener('pointerdown', () => { downHere = true; });
        s.el.addEventListener('pointerup', () => { if (downHere) next(); downHere = false; });
        textEl = s.el.querySelector('.text');
        show();
      },
      onClose: () => clearInterval(timer),
    });
    function show() {
      full = texts[i]; shown = 0; textEl.textContent = '';
      clearInterval(timer);
      timer = setInterval(() => {
        shown = Math.min(full.length, shown + 2);
        textEl.textContent = full.slice(0, shown);
        if (shown % 6 === 0) Sound.play('blip');
        if (shown >= full.length) clearInterval(timer);
      }, 22);
    }
    function next() {
      if (shown < full.length) { shown = full.length; textEl.textContent = full; clearInterval(timer); return; }
      i++;
      if (i >= texts.length) { UI.close(s); if (cb) cb(); return; }
      show();
    }
    return s;
  },

  // ---------- Confirm ----------
  confirm(text, opts) {
    const s = this.open({
      kind: 'confirm',
      html: `<div class="panel confirm"><p>${esc(text)}</p><div class="menu-list">${opts.map((o, i) => `<button data-nav data-act="opt" data-i="${i}" class="${o.cls || ''}">${esc(o.label)}</button>`).join('')}</div></div>`,
      actions: { opt: el => { const o = opts[+el.dataset.i]; UI.close(s); if (o.run) o.run(); } },
      onBack: () => { UI.close(s); const c = opts.find(o => o.cancel); if (c && c.run) c.run(); },
    });
    return s;
  },

  // ---------- Title ----------
  openTitle() {
    const save = Store.get(SAVE_KEY, null);
    const info = save && save.s ? `${SEASONS[save.s.season]} ${save.s.day}, Year ${save.s.year} · ${save.s.gold.toLocaleString()}g` : '';
    this.open({
      kind: 'title', cls: 'title clear',
      html: `<div class="title-wrap">
        <div class="logo">Fernhollow</div>
        <div class="tagline">a fae farming tale</div>
        <div class="menu-list">
          ${save ? `<button data-nav data-act="cont">Continue<small>${esc(info)}</small></button>` : ''}
          <button data-nav data-act="new">New Game</button>
          <button data-nav data-act="settings">Settings</button>
          <button data-nav data-act="controls">Controls</button>
          <button data-nav data-act="exit">Exit Game</button>
        </div>
        <div class="foot">Keyboard &amp; mouse · Touch · Xbox controller</div>
      </div>`,
      actions: {
        cont: () => continueGame(),
        new: () => {
          if (save) UI.confirm('Start a new game? Your current save will be overwritten.', [{ label: 'Start New Game', run: newGame, cls: 'danger' }, { label: 'Cancel', cancel: true }]);
          else newGame();
        },
        settings: () => UI.openSettings(),
        controls: () => UI.openControls(),
        exit: () => exitGame(),
      },
    });
  },

  // ---------- Pause ----------
  openPause() {
    let s = null;
    s = this.open({
      kind: 'pause',
      html: `<div class="panel pause">
        <h2>Paused</h2>
        <p class="sub">${SEASONS[S.season]} ${S.day}, Year ${S.year} · ${fmtTime(S.time)} · ${S.gold.toLocaleString()}g</p>
        <div class="menu-list two">
          <button data-nav data-act="resume">Resume</button>
          <button data-nav data-act="hero">Hero</button>
          <button data-nav data-act="inv">Inventory</button>
          <button data-nav data-act="map">Map</button>
          <button data-nav data-act="save">Save Game</button>
          <button data-nav data-act="settings">Settings</button>
          <button data-nav data-act="controls">Controls</button>
          <button data-nav data-act="unstuck">Unstuck</button>
          <button data-nav data-act="title">Quit to Title</button>
          <button data-nav data-act="exit" class="danger">Exit Game</button>
        </div>
      </div>`,
      onBack: () => UI.close(s),
      actions: {
        resume: () => UI.close(s),
        inv: () => UI.openInventory('items'),
        hero: () => UI.openInventory('hero'),
        map: () => UI.openMap(),
        save: () => { if (saveGame()) UI.toast('Game saved.'); else UI.toast('Could not save. Is browser storage blocked?'); },
        settings: () => UI.openSettings(),
        controls: () => UI.openControls(),
        unstuck: () => UI.confirm('Stuck? Choose where to go.', [
          { label: 'Nearest open spot', run: () => { UI.closeAll(); unstuck(false); } },
          { label: 'Back to my farmhouse', run: () => { UI.closeAll(); unstuck(true); } },
          { label: 'Cancel', cancel: true },
        ]),
        title: () => UI.confirm('Save and return to the title screen?', [{ label: 'Save & Quit', run: quitToTitle }, { label: 'Cancel', cancel: true }]),
        exit: () => UI.confirm('Save and exit the game?', [{ label: 'Save & Exit', run: exitGame, cls: 'danger' }, { label: 'Cancel', cancel: true }]),
      },
    });
  },

  // ---------- Settings ----------
  openSettings() {
    const opts = { zoom: ['far', 'normal', 'close'], touch: ['auto', 'on', 'off'], rumble: [true, false], clock24: [false, true], highlight: [true, false], god: [false, true], onehit: [false, true] };
    const names = { zoom: { far: 'Far', normal: 'Normal', close: 'Close' }, touch: { auto: 'Auto', on: 'Always', off: 'Off' } };
    const lbl = (k, v) => (names[k] ? names[k][v] : k === 'clock24' ? (v ? '24-hour' : '12-hour') : v ? 'On' : 'Off');
    const range = (k, label) => `<div class="set-row"><label>${label}</label><input type="range" min="0" max="100" step="5" value="${Settings[k]}" data-nav data-set="${k}"><span class="val">${Settings[k]}</span></div>`;
    const cyc = (k, label) => `<div class="set-row"><label>${label}</label><button data-nav data-act="cycle" data-cycle data-key="${k}">‹ ${lbl(k, Settings[k])} ›</button></div>`;
    let s = null;
    s = this.open({
      kind: 'settings',
      html: `<div class="panel settings"><h2>Settings</h2>
        ${range('music', 'Music')}${range('sfx', 'Sound effects')}
        ${cyc('zoom', 'Camera zoom')}${cyc('touch', 'Touch controls')}${cyc('rumble', 'Controller vibration')}${cyc('clock24', 'Clock')}${cyc('highlight', 'Target highlight')}
        <h3 class="sect">Playtesting</h3>
        ${cyc('god', 'God mode (no damage, endless energy and stamina)')}${cyc('onehit', 'One-hit kills (monsters and rocks)')}
        <div class="set-row"><label>Fullscreen</label><button data-nav data-act="full">Toggle</button></div>
        <div class="menu-list"><button data-nav data-act="back">Back</button></div></div>`,
      onBack: () => UI.close(s),
      onInput: el => { Settings[el.dataset.set] = +el.value; el.nextElementSibling.textContent = el.value; Sound.applyVolumes(); saveSettings(); },
      actions: {
        cycle: (el, d) => {
          const k = el.dataset.key, list = opts[k];
          const i = (list.indexOf(Settings[k]) + (d === -1 ? -1 : 1) + list.length) % list.length;
          Settings[k] = list[i]; el.textContent = `‹ ${lbl(k, list[i])} ›`;
          saveSettings(); applySettings();
          if (k === 'rumble' && list[i]) Input.rumble(0.6, 150);
        },
        full: () => toggleFullscreen(),
        back: () => UI.close(s),
      },
    });
  },

  // ---------- Controls ----------
  openControls() {
    const tabs = {
      kb: ['Keyboard & Mouse', [['Move', 'W A S D / Arrow keys'], ['Sprint', 'Hold Shift'], ['Attack', 'F (hold to keep swinging)'], ['Block', 'Hold Q (needs a shield)'], ['Dive roll', 'R'], ['Use tool or item', 'Space, J or Left-click (hold to repeat)'], ['Talk, harvest, open, ship', 'E, Enter, K or Right-click'], ['Hero sheet', 'C'], ['Pick hotbar slot', '1–9, 0, −, = or mouse wheel'], ['Previous / next slot', '[ and ]'], ['Inventory', 'I or Tab'], ['Map', 'M'], ['Pause', 'Esc or P'], ['In menus', 'Arrows to move, Enter to choose, Esc to go back']]],
      pad: ['Xbox Controller', [['Move', 'Left stick or D-pad'], ['Sprint', 'Click the left stick (toggles on until you stop)'], ['Attack', 'RT (hold to keep swinging)'], ['Block', 'Hold LT (needs a shield)'], ['Dive roll', 'B'], ['Use tool or item', 'X (hold to repeat)'], ['Talk, harvest, open, ship', 'A'], ['Previous / next slot', 'LB / RB'], ['Inventory', 'Y'], ['Map', 'View button (⧉)'], ['Pause', 'Menu button (☰)'], ['In menus', 'D-pad / stick to move, A to choose, B to go back, LB / RB to switch tabs']]],
      touch: ['Touch', [['Move', 'Drag anywhere on the left side of the screen'], ['Sprint', 'Push the stick all the way to the edge'], ['Attack / Block / Roll', 'Sword, shield and roll buttons (hold Block)'], ['Use tool or item', 'Big button with your item (hold to repeat)'], ['Talk, harvest, open, ship', 'Act button (it shows what it will do)'], ['Pick item', 'Tap a hotbar slot'], ['Inventory / Map', 'Bag and Map buttons'], ['Pause', '❚❚ button at the top right']]],
    };
    let cur = Input.mode === 'pad' ? 'pad' : Input.mode === 'touch' ? 'touch' : 'kb';
    const keys = Object.keys(tabs);
    let s = null;
    s = this.open({
      kind: 'controls',
      html: `<div class="panel big controls"><h2>Controls</h2><div class="tabs">${keys.map(k => `<button data-nav data-act="tab" data-tab="${k}">${tabs[k][0]}</button>`).join('')}</div><div class="tabbody"></div><div class="menu-list"><button data-nav data-act="back">Back</button></div></div>`,
      onBack: () => UI.close(s),
      onTab: d => { cur = keys[(keys.indexOf(cur) + d + keys.length) % keys.length]; render(); },
      actions: { tab: el => { cur = el.dataset.tab; render(); }, back: () => UI.close(s) },
      init: x => { s = x; render(); },
    });
    function render() {
      s.el.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === cur));
      s.el.querySelector('.tabbody').innerHTML = `<table class="ctl">${tabs[cur][1].map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('')}</table>`;
    }
  },

  // ---------- Map ----------
  openMap() {
    const K = 3, img = mapImage();
    const s = this.open({
      kind: 'map',
      html: `<div class="panel big mapp"><h2>${inDungeon() ? `Moonfall Depths · Floor ${DUN.floor}` : 'Map'}</h2><canvas class="mapc"></canvas><div class="menu-list"><button data-nav data-act="back">Close</button></div></div>`,
      onBack: () => UI.close(s),
      actions: { back: () => UI.close(s) },
    });
    const c = s.el.querySelector('canvas');
    c.width = W * K; c.height = H * K;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, W * K, H * K);
    g.font = 'bold 22px "Pixelify Sans", monospace'; g.textAlign = 'center'; g.lineWidth = 4;
    for (const [t, x, y] of inDungeon() ? [] : MAP_LABELS) { g.strokeStyle = 'rgba(20,12,30,.85)'; g.strokeText(t, x * K, y * K); g.fillStyle = '#fff3d0'; g.fillText(t, x * K, y * K); }
    const px = P.x / TS * K, py = P.y / TS * K;
    g.fillStyle = '#ff4060'; g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.arc(px, py, 8, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.fillText('You', px, py - 10);
  },

  // ---------- Day summary ----------
  openSummary(info, cb) {
    const rows = Object.entries(info.sold).map(([id, n]) => `<tr><td><img class="px ico" src="${ICON_URL[id]}" alt=""> ${esc(ITEMS[id].name)} ×${n}</td><td>${(ITEMS[id].sell * n).toLocaleString()}g</td></tr>`).join('');
    const s = this.open({
      kind: 'summary',
      html: `<div class="panel summary">
        <h2>${info.passedOut ? 'You collapsed...' : 'Good morning!'}</h2>
        <p class="sub">${SEASONS[S.season]} ${S.day}, Year ${S.year}${info.newSeason ? ` · ${SEASONS[S.season]} has arrived!` : ''}</p>
        ${info.passedOut ? `<p class="warn">You stayed up too late and passed out. Someone carried you home and took ${info.lost}g for the trouble.</p>` : ''}
        ${rows ? `<table class="sold">${rows}<tr class="tot"><td>Total earned</td><td>${info.total.toLocaleString()}g</td></tr></table>` : '<p>Nothing was shipped yesterday.</p>'}
        ${info.withered ? `<p class="warn">${info.withered} crop${info.withered > 1 ? 's' : ''} withered with the change of season.</p>` : ''}
        <p>Today's weather: ${S.weather === 'rain' ? (S.season === 3 ? 'snow ❄ (your crops are watered)' : 'rain ☂ (your crops are watered)') : 'sunny ☀'}</p>
        <div class="menu-list"><button data-nav data-act="go">Start the day</button></div></div>`,
      actions: { go: () => { UI.close(s); cb && cb(); } },
    });
  },

  // ---------- Farewell ----------
  openFarewell() {
    this.open({
      kind: 'farewell',
      html: `<div class="panel"><h2>Thanks for playing!</h2><p>Your progress is saved. You can close this tab or window now.</p><div class="menu-list"><button data-nav data-act="title">Back to Title</button></div></div>`,
      actions: { title: () => { UI.closeAll(); UI.openTitle(); } },
    });
  },

  // ---------- Inventory (Items / Crafting / Friends / Journal) ----------
  openInventory(tab) {
    const tabs = ['hero', 'items', 'craft', 'friends', 'journal'], names = { hero: 'Hero', items: 'Items', craft: 'Crafting', friends: 'Friends', journal: 'Journal' };
    let cur = tab || 'items', held = -1;
    let s = null;
    s = this.open({
      kind: 'inventory',
      html: `<div class="panel big inv"><div class="tabs">${tabs.map(t => `<button data-nav data-act="tab" data-tab="${t}">${names[t]}</button>`).join('')}<button data-nav data-act="close" class="x">✕</button></div><div class="tabbody"></div></div>`,
      onBack: () => { if (held >= 0) { held = -1; render(); } else UI.close(s); },
      onTab: d => { cur = tabs[(tabs.indexOf(cur) + d + tabs.length) % tabs.length]; held = -1; render(); },
      onFocus: el => { if (el.dataset.slot !== undefined) detail(+el.dataset.slot); },
      onClose: () => { UI.refreshHotbar(); },
      actions: {
        tab: el => { cur = el.dataset.tab; held = -1; render(); },
        close: () => UI.close(s),
        slot: el => {
          const i = +el.dataset.slot;
          if (held < 0) { if (S.inv[i]) held = i; }
          else if (held === i) held = -1;
          else { const t = S.inv[i]; S.inv[i] = S.inv[held]; S.inv[held] = t; held = -1; invChanged(); }
          render(i);
        },
        trash: () => {
          const i = held >= 0 ? held : +(document.activeElement.dataset.slot ?? -1);
          const it = S.inv[i];
          if (!it) return;
          if (isTool(it.id)) { UI.toast("You can't throw away your tools."); return; }
          UI.confirm(`Throw away ${ITEMS[it.id].name} ×${it.n}?`, [{ label: 'Throw away', cls: 'danger', run: () => { S.inv[i] = null; held = -1; invChanged(); render(i); } }, { label: 'Cancel', cancel: true }]);
        },
        craft: el => { craft(RECIPES[+el.dataset.i]); render(null, `[data-act="craft"][data-i="${el.dataset.i}"]`); },
        equip: el => { equipFrom(+el.dataset.i); render(+el.dataset.i); },
        uneq: el => {
          const sl = el.dataset.slotName;
          if (!S.equip[sl]) { UI.toastOnce(`Nothing equipped. Pick ${SLOT_NAMES[sl].toLowerCase()} gear in the Items tab and press Equip.`); return; }
          unequip(sl); render(null, `[data-act="uneq"][data-slot-name="${sl}"]`);
        },
        spend: el => { spendPoint(el.dataset.attr); Sound.play('levelup'); render(null, `[data-act="spend"][data-attr="${el.dataset.attr}"]`); },
      },
      init: x => { s = x; render(S.sel); },
    });
    function detail(i) {
      const box = s.el.querySelector('.detail');
      if (!box) return;
      const it = S.inv[i];
      if (!it) { box.innerHTML = `<div class="dtext"><p class="muted">${i >= S.invSize ? 'Locked. Buy a Big Backpack from Thistle to unlock.' : 'Empty slot.'}</p></div>`; return; }
      const d = ITEMS[it.id];
      box.innerHTML = `<img class="px big" src="${ICON_URL[it.id]}" alt=""><div class="dtext"><b>${esc(d.name)}${it.n > 1 ? ` ×${it.n}` : ''}</b><p>${esc(d.desc)}</p>${d.sell ? `<p class="muted">Sells for ${d.sell}g each</p>` : ''}</div>${isGear(it.id) ? `<button data-nav data-act="equip" data-i="${i}">Equip</button>` : ''}`;
    }
    function render(focusSlot, focusSel) {
      s.el.querySelectorAll('.tabs button[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === cur));
      const body = s.el.querySelector('.tabbody');
      if (cur === 'items') {
        let h = '<div class="invgrid">';
        for (let i = 0; i < 36; i++) {
          const it = S.inv[i], locked = i >= S.invSize;
          h += `<button class="islot${i === S.sel ? ' sel' : ''}${i === held ? ' held' : ''}${locked ? ' locked' : ''}${i < 12 ? ' hot' : ''}" ${locked ? '' : 'data-nav data-act="slot"'} data-slot="${i}">${it ? `<img class="px" src="${ICON_URL[it.id]}" alt=""><span class="qty">${it.n > 1 ? it.n : ''}</span>` : locked ? '🔒' : ''}</button>`;
        }
        h += `</div><div class="detail"></div><div class="invfoot"><span class="muted">${held >= 0 ? 'Choose a slot to move it to.' : 'Choose an item, then another slot to swap. Top row = hotbar.'}</span><button data-nav data-act="trash" class="danger small">Trash</button></div>`;
        body.innerHTML = h;
        const f = body.querySelector(`[data-slot="${focusSlot ?? S.sel}"][data-nav]`) || body.querySelector('[data-nav]');
        if (f) f.focus({ preventScroll: true });
        detail(focusSlot ?? S.sel);
      } else if (cur === 'hero') {
        const a = S.attrs, nx = xpNeed(S.level);
        const statRows = [['Attack', ST.atk], ['Defense', ST.def], ['Max HP', S.maxHp], ['Max Stamina', S.maxSta], ['Max Energy', S.maxEnergy], ['Speed', Math.round(ST.speed * 100) + '%'], ['Crit chance', Math.round(ST.crit * 100) + '%'], ['Block', S.equip.shield ? Math.round(ST.block * 100) + '%' : '—'], ...(Settings.god || Settings.onehit ? [['Power level (hidden)', `${powerLevel()} / 100`]] : [])];
        body.innerHTML = `<div class="hero">
          <div class="hero-left">
            <canvas class="hero-pv px" width="16" height="28"></canvas>
            <div class="eqslots">${EQUIP_SLOTS.map(sl => { const id = S.equip[sl]; return `<button class="eq" data-nav data-act="uneq" data-slot-name="${sl}">${id ? `<img class="px" src="${ICON_URL[id]}" alt="">` : '<span class="ph"></span>'}<span class="eqtxt"><span class="lbl">${SLOT_NAMES[sl]}</span><span class="nm">${id ? esc(ITEMS[id].name) : 'Empty'}</span></span></button>`; }).join('')}</div>
            <p class="muted small">Choose a slot to take that piece off.</p>
          </div>
          <div class="hero-right">
            <div class="lvbox"><b>Level ${S.level}</b><span class="muted small">${S.xp} / ${nx} XP</span></div>
            <div class="qbar"><i style="width:${Math.min(100, S.xp / nx * 100)}%"></i></div>
            <div class="pts">${S.points ? `<b>${S.points}</b> attribute point${S.points > 1 ? 's' : ''} to spend` : '<span class="muted">Fight, farm, chop and mine to earn XP. Each level gives 3 points.</span>'}</div>
            ${Object.entries(ATTRS).map(([k, [n, desc]]) => `<div class="attr"><div class="grow"><b>${n}</b> <span class="av">${a[k]}</span><div class="muted small">${desc}</div></div><button data-nav data-act="spend" data-attr="${k}" class="${S.points ? '' : 'off'}" data-why="No points to spend yet. Level up to earn more.">+</button></div>`).join('')}
            <table class="ctl stats">${statRows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table>
          </div></div>`;
        const pv = body.querySelector('.hero-pv').getContext('2d');
        pv.drawImage(heroFrames()[0][0], 0, 0);
        const f = (focusSel && body.querySelector(focusSel)) || body.querySelector('[data-nav]');
        if (f) f.focus({ preventScroll: true });
      } else if (cur === 'craft') {
        body.innerHTML = `<p class="muted">Craft with materials from your bag.</p><div class="rows">${RECIPES.map((r, i) => {
          const ok = Object.entries(r.need).every(([id, n]) => countItem(id) >= n);
          const need = Object.entries(r.need).map(([id, n]) => `<span class="${countItem(id) >= n ? '' : 'lack'}"><img class="px ico" src="${ICON_URL[id]}" alt="">${n} ${esc(ITEMS[id].name)} (${countItem(id)})</span>`).join(' ');
          return `<div class="row"><img class="px ico2" src="${ICON_URL[r.id]}" alt=""><div class="grow"><b>${esc(ITEMS[r.id].name)}${r.qty > 1 ? ` ×${r.qty}` : ''}</b><div class="need">${need}</div></div><button data-nav data-act="craft" data-i="${i}" class="${ok ? '' : 'off'}" data-why="You don't have enough materials.">Craft</button></div>`;
        }).join('')}</div>`;
        const f = (focusSel && body.querySelector(focusSel)) || body.querySelector('[data-nav]');
        if (f) f.focus({ preventScroll: true });
      } else if (cur === 'friends') {
        body.innerHTML = `<div class="rows">${Object.entries(NPCS).map(([id, n]) => {
          const f = S.friends[id], hts = heartsOf(f.pts);
          const likes = hts >= 2 ? `<div class="muted small">Loves: ${n.loves.map(x => ITEMS[x].name).join(', ')}</div>` : '<div class="muted small">Become better friends to learn their favorite gifts.</div>';
          return `<div class="row" tabindex="-1" data-nav><img class="px portrait-s" src="${PORTRAIT_URL[id]}" alt=""><div class="grow"><b>${esc(n.name)}</b> <span class="hearts">${'♥'.repeat(hts)}${'♡'.repeat(5 - hts)}</span>${likes}</div><div class="today">${f.met ? `${f.talked ? '✓' : '·'} Talked<br>${f.gifted ? '✓' : '·'} Gift` : '<span class="muted">Not met yet</span>'}</div></div>`;
        }).join('')}</div>`;
        const f = body.querySelector('[data-nav]'); if (f) f.focus({ preventScroll: true });
      } else {
        const q = QUESTS[S.quest];
        body.innerHTML = `<div class="journal">
          ${q ? `<div class="quest"><div class="muted small">Current task from Elder Oswin</div><b>${esc(q.title)}</b><p>${esc(q.desc)}</p><div class="qbar"><i style="width:${Math.min(100, q.prog(S) / q.goal * 100)}%"></i></div><div class="muted small">${Math.min(q.goal, q.prog(S)).toLocaleString()} / ${q.goal.toLocaleString()} · Reward: ${rewardText(q.reward)}</div></div>` : '<div class="quest"><b>All tasks complete!</b><p>Fernhollow is thriving thanks to you.</p></div>'}
          <div class="done">${QUESTS.slice(0, S.quest).map(x => `<div>✓ ${esc(x.title)}</div>`).join('')}</div>
          <table class="ctl"><tr><th>Crops harvested</th><td>${S.stats.harvest}</td></tr><tr><th>Earned from the crate</th><td>${S.stats.shipped.toLocaleString()}g</td></tr><tr><th>Days on the farm</th><td>${dayKey()}</td></tr></table>
          <button data-nav data-act="close" class="small">Close</button></div>`;
        const f = body.querySelector('[data-nav]'); if (f) f.focus({ preventScroll: true });
      }
    }
  },

  // ---------- The heart sign: read it, or change its message ----------
  openLoveSign() {
    const pic = spriteURL(SPR.lovesign);
    const s = this.open({
      kind: 'lovesign',
      html: `<div class="panel lovesign"><img class="px signpic" src="${pic}" alt=""><p class="signtext">${esc(loveText())}</p>
        <div class="menu-list two"><button data-nav data-act="close">Close</button><button data-nav data-act="edit">Edit message</button></div></div>`,
      onBack: () => UI.close(s),
      actions: { close: () => UI.close(s), edit: () => { UI.close(s); UI.openSignEditor(); } },
    });
  },
  openSignEditor() {
    const MAX = 80;
    let shift = false, s = null;
    const rows = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM', ".,!?'♥-"];
    const keys = () => rows.map(r => `<div class="krow">${[...r].map(ch => { const k = /[A-Z]/.test(ch) && !shift ? ch.toLowerCase() : ch; return `<button class="key" data-nav data-act="key" data-k="${esc(k)}">${esc(k)}</button>`; }).join('')}</div>`).join('')
      + `<div class="krow"><button class="key wide" data-nav data-act="shift">${shift ? 'abc' : 'ABC'}</button><button class="key space" data-nav data-act="key" data-k=" ">Space</button><button class="key wide" data-nav data-act="bksp">⌫</button></div>`;
    s = this.open({
      kind: 'signedit',
      html: `<div class="panel signedit"><h2>Edit the sign</h2>
        <input type="text" id="sign-input" maxlength="${MAX}" data-nav autocomplete="off" spellcheck="false" value="${esc(loveText())}">
        <p class="muted small count"></p>
        <div class="osk ${Input.mode === 'pad' ? '' : 'hidden'}">${keys()}</div>
        <div class="menu-list two"><button data-nav data-act="cancel">Cancel</button><button data-nav data-act="save">Save</button></div></div>`,
      onBack: () => UI.close(s),
      onSubmit: () => save(),
      onInput: () => count(),
      actions: {
        cancel: () => UI.close(s),
        save: () => save(),
        key: el => { const inp = s.el.querySelector('#sign-input'); if (inp.value.length < MAX) inp.value += el.dataset.k; if (shift) { shift = false; redraw(el.dataset.k); } count(); },
        bksp: () => { const inp = s.el.querySelector('#sign-input'); inp.value = inp.value.slice(0, -1); count(); },
        shift: () => { shift = !shift; redraw(null, true); },
      },
      init: x => {
        s = x; count();
        const target = Input.mode === 'pad' ? s.el.querySelector('.key') : s.el.querySelector('#sign-input');
        target.focus({ preventScroll: true });
        if (target.tagName === 'INPUT') target.setSelectionRange(target.value.length, target.value.length);
      },
    });
    function count() { const n = s.el.querySelector('#sign-input').value.length; s.el.querySelector('.count').textContent = `${n} / ${MAX}`; }
    function redraw(k, keepShift) {
      const osk = s.el.querySelector('.osk'); osk.innerHTML = keys();
      const f = keepShift ? osk.querySelector('[data-act="shift"]') : osk.querySelector(`[data-k="${CSS.escape(k || 'a')}"]`) || osk.querySelector('.key');
      if (f) f.focus({ preventScroll: true });
    }
    function save() {
      const v = s.el.querySelector('#sign-input').value.replace(/\s+/g, ' ').trim().slice(0, MAX);
      S.loveText = v || LOVE_SIGN.text;
      UI.close(s); Sound.play('harvest'); UI.toast('The sign has been updated.');
    }
  },

  // ---------- Playtest chest: every item in the game ----------
  // Built from ITEMS, so anything added to the game shows up here automatically.
  openTestChest() {
    const cats = { tool: 'Tools', gear: 'Gear', seed: 'Seeds', crop: 'Crops', forage: 'Forage', food: 'Food', mat: 'Materials', loot: 'Monster loot', place: 'Placeables', special: 'Special' };
    const ids = Object.keys(ITEMS).sort((a, b) => Object.keys(cats).indexOf(ITEMS[a].cat) - Object.keys(cats).indexOf(ITEMS[b].cat));
    let s = null;
    s = this.open({
      kind: 'chest',
      html: `<div class="panel big"><div class="shop-head"><img class="portrait px" src="${spriteURL(SPR.testchest)}" alt=""><div class="grow"><h3>Playtest Chest</h3><p class="muted">Every item in the game (${ids.length}). It never runs out.</p></div><button data-nav data-act="close" class="x">✕</button></div>
        <div class="tabs"><button data-nav data-act="gold">+10,000g</button><button data-nav data-act="lvl">+1 level</button><button data-nav data-act="heal">Full heal</button><button data-nav data-act="night">Skip to night</button></div>
        <div class="tbody"></div></div>`,
      onBack: () => UI.close(s),
      actions: {
        close: () => UI.close(s),
        take: el => {
          const id = el.dataset.id, n = +el.dataset.n;
          if (!canAdd(id, n)) { Sound.play('error'); UI.toastOnce('Your bag is full.'); return; }
          addItem(id, n); UI.toastOnce(`Took ${ITEMS[id].name}${n > 1 ? ` ×${n}` : ''}.`);
        },
        gold: () => { S.gold += 10000; UI.toastOnce('+10,000g'); },
        lvl: () => gainXP(xpNeed(S.level) - S.xp),
        heal: () => { S.hp = S.maxHp; S.sta = S.maxSta; S.energy = S.maxEnergy; UI.toastOnce('Fully restored.'); },
        night: () => { S.time = Math.max(S.time, 20 * 60 + 30); UI.toastOnce('It is now night.'); },
      },
      init: x => {
        s = x;
        let h = '', last = '';
        for (const id of ids) {
          const it = ITEMS[id];
          if (it.cat !== last) { last = it.cat; h += `<h3 class="sect">${cats[it.cat] || it.cat}</h3>`; }
          const single = maxStack(id) === 1;
          h += `<div class="row"><img class="px ico2" src="${ICON_URL[id] || ICON_URL.bag}" alt=""><div class="grow"><b>${esc(it.name)}</b><div class="muted small">${esc(it.desc || '')}</div></div><button data-nav data-act="take" data-id="${id}" data-n="1">Take</button>${single ? '' : `<button data-nav data-act="take" data-id="${id}" data-n="50">×50</button>`}</div>`;
        }
        s.el.querySelector('.tbody').innerHTML = `<div class="rows">${h}</div>`;
      },
    });
  },

  // ---------- Shop ----------
  openShop(id) {
    const sh = SHOPS[id];
    let tab = 'buy';
    let s = null;
    s = this.open({
      kind: 'shop',
      html: `<div class="panel big shop"><div class="shop-head"><img class="portrait px" src="${PORTRAIT_URL[sh.owner]}" alt=""><div class="grow"><h3>${esc(sh.name)}</h3><p class="muted">${esc(sh.greet)}</p></div><div class="goldbox"><b class="g"></b></div></div>
        <div class="tabs"><button data-nav data-act="tab" data-tab="buy">Buy</button><button data-nav data-act="tab" data-tab="sell">Sell</button><button data-nav data-act="close" class="x">✕</button></div><div class="tabbody"></div></div>`,
      onBack: () => UI.close(s),
      onTab: () => { tab = tab === 'buy' ? 'sell' : 'buy'; render(); },
      actions: {
        tab: el => { tab = el.dataset.tab; render(); },
        close: () => UI.close(s),
        buy: el => { buy(sh.stock()[+el.dataset.i], +el.dataset.n); render(`[data-act="buy"][data-i="${el.dataset.i}"][data-n="${el.dataset.n}"]`); },
        sell: el => {
          const i = +el.dataset.slot, it = S.inv[i];
          if (!it) return;
          const n = el.dataset.all ? it.n : 1, v = Math.max(1, Math.floor(ITEMS[it.id].sell * (sh.sellMul || 1))) * n;
          it.n -= n; if (it.n <= 0) S.inv[i] = null;
          S.gold += v; Sound.play('coin'); invChanged();
          render(`[data-act="sell"][data-slot="${i}"]${el.dataset.all ? '[data-all]' : ':not([data-all])'}`);
        },
      },
      init: x => { s = x; render(); },
    });
    function render(focusSel) {
      s.el.querySelector('.g').textContent = `${S.gold.toLocaleString()}g`;
      s.el.querySelectorAll('.tabs button[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      const body = s.el.querySelector('.tabbody');
      if (tab === 'buy') {
        const stock = sh.stock();
        body.innerHTML = `<div class="rows">${stock.map((e, i) => {
          if (e.special && !e.avail()) return `<div class="row"><img class="px ico2" src="${ICON_URL[e.icon]}" alt=""><div class="grow"><b>${esc(e.name)}</b><div class="muted small">Sold out. You own this upgrade.</div></div></div>`;
          const name = e.special ? e.name : ITEMS[e.id].name, desc = e.special ? e.desc : ITEMS[e.id].desc, icon = e.special ? e.icon : e.id;
          const can1 = S.gold >= e.price, can5 = S.gold >= e.price * 5;
          return `<div class="row"><img class="px ico2" src="${ICON_URL[icon]}" alt=""><div class="grow"><b>${esc(name)}</b> <span class="price">${e.price.toLocaleString()}g</span><div class="muted small">${esc(desc)}</div></div>
            <button data-nav data-act="buy" data-i="${i}" data-n="1" class="${can1 ? '' : 'off'}" data-why="Not enough gold.">Buy</button>${e.special || isGear(e.id) ? '' : `<button data-nav data-act="buy" data-i="${i}" data-n="5" class="${can5 ? '' : 'off'}" data-why="Not enough gold.">×5</button>`}</div>`;
        }).join('')}</div>`;
      } else {
        const rows = [];
        for (let i = 0; i < S.invSize; i++) {
          const it = S.inv[i];
          if (!it || !ITEMS[it.id].sell || isTool(it.id) || (sh.buys && !sh.buys(it.id))) continue;
          const d = ITEMS[it.id];
          const each = Math.max(1, Math.floor(d.sell * (sh.sellMul || 1)));
          rows.push(`<div class="row"><img class="px ico2" src="${ICON_URL[it.id]}" alt=""><div class="grow"><b>${esc(d.name)} ×${it.n}</b> <span class="price">${each}g each</span></div><button data-nav data-act="sell" data-slot="${i}">Sell 1</button><button data-nav data-act="sell" data-slot="${i}" data-all="1">All (${(each * it.n).toLocaleString()}g)</button></div>`);
        }
        const who = `<p class="muted small">${esc(NPCS[sh.owner] ? NPCS[sh.owner].name : 'Grimble')} buys ${esc(sh.buysText || 'anything')}. Anything else can go in your Market Crate.</p>`;
        body.innerHTML = who + (rows.length ? `<div class="rows">${rows.join('')}</div>` : '<p class="muted pad">You have nothing this shop wants.</p>');
      }
      const f = (focusSel && body.querySelector(focusSel)) || body.querySelector('[data-nav]') || s.el.querySelector('[data-nav]');
      if (f) f.focus({ preventScroll: true });
    }
    function buy(e, n) {
      if (!e) return;
      const cost = e.price * n;
      if (S.gold < cost) { Sound.play('error'); UI.toastOnce('Not enough gold.'); return; }
      if (e.special === 'backpack') { S.invSize = 36; S.gold -= cost; UI.toast('Your bag is bigger! 12 more slots.', 'bag'); }
      else if (e.special === 'can') { S.canMax = 100; S.water = 100; S.gold -= cost; UI.toast('Your watering can now holds 100 water.', 'can'); }
      else {
        if (!canAdd(e.id, n)) { Sound.play('error'); UI.toastOnce('Your bag is full.'); return; }
        S.gold -= cost; addItem(e.id, n);
      }
      Sound.play('coin'); invChanged();
    }
  },
};

function rewardText(r) {
  const parts = [];
  if (r.gold) parts.push(`${r.gold.toLocaleString()}g`);
  for (const [id, n] of r.items || []) parts.push(`${ITEMS[id].name} ×${n}`);
  return parts.join(' + ');
}
