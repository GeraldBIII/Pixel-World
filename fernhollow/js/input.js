'use strict';
// Unifies keyboard/mouse, touch and gamepad into one queue of actions.
// Actions: use, interact, attack, roll, menu, back, inventory, map, hotPrev, hotNext, hot0..hot11, up/down/left/right
// Held states: useHeld, attackHeld, blockHeld, sprintHeld
const Input = {
  keys: new Set(), q: [], mode: 'kb',
  moveX: 0, moveY: 0,
  mouse: { x: 0, y: 0, over: false, t: -99, left: false },
  stick: { id: null, ox: 0, oy: 0, x: 0, y: 0 },
  touchUse: false, lastTouch: -1e9,
  pad: { prev: [], ax: 0, ay: 0, navDir: null, navT: 0, use: false, attack: false, block: false, sprint: false, idleT: 0, connected: false },
  touchAtk: false, touchBlock: false,
  wheelT: 0,

  push(a, src, extra) { this.q.push(Object.assign({ a, src: src || this.mode }, extra)); },
  setMode(m) {
    if (this.mode === m) return;
    this.mode = m;
    document.body.classList.remove('mode-kb', 'mode-pad', 'mode-touch');
    document.body.classList.add('mode-' + m);
    updateTouchVisibility();
  },
  useHeld() { return this.keys.has('Space') || this.keys.has('KeyJ') || this.mouse.left || this.touchUse || this.pad.use; },
  attackHeld() { return this.keys.has('KeyF') || this.touchAtk || this.pad.attack; },
  blockHeld() { return this.keys.has('KeyQ') || this.touchBlock || this.pad.block; },
  // Keyboard: hold Shift. Controller: click the left stick to toggle. Touch: push the stick all the way.
  sprintHeld() { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.pad.sprint || (this.stick.id !== null && Math.hypot(this.stick.x, this.stick.y) > 0.96); },

  init() {
    document.body.classList.add('mode-' + this.mode);
    const DIRS = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };
    const HOT = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'];
    addEventListener('keydown', e => {
      Sound.init();
      this.setMode('kb');
      const c = e.code;
      // While typing in a text box, let keys type; only Enter and Escape act
      const tgt = e.target;
      if (tgt && (tgt.tagName === 'TEXTAREA' || (tgt.tagName === 'INPUT' && tgt.type === 'text'))) {
        if (c === 'Escape') { e.preventDefault(); this.push('back', 'kb'); }
        else if (c === 'Enter' || c === 'NumpadEnter') { e.preventDefault(); this.push('submit', 'kb'); }
        return;
      }
      const handled = DIRS[c] || HOT.includes(c) || ['Space', 'Enter', 'NumpadEnter', 'Escape', 'Tab', 'KeyE', 'KeyJ', 'KeyK', 'KeyI', 'KeyM', 'KeyP', 'Backspace', 'BracketLeft', 'BracketRight', 'KeyF', 'KeyQ', 'KeyR', 'KeyC', 'ShiftLeft', 'ShiftRight'].includes(c);
      if (handled) e.preventDefault();
      if (DIRS[c]) this.push(DIRS[c], 'kb');
      if (e.repeat) return;
      this.keys.add(c);
      const hi = HOT.indexOf(c);
      if (hi >= 0) this.push('hot' + hi, 'kb');
      switch (c) {
        case 'Space': case 'KeyJ': this.push('use', 'kb'); break;
        case 'KeyE': case 'Enter': case 'NumpadEnter': case 'KeyK': this.push('interact', 'kb'); break;
        case 'KeyF': this.push('attack', 'kb'); break;
        case 'KeyR': this.push('roll', 'kb'); break;
        case 'KeyC': this.push('hero', 'kb'); break;
        case 'Escape': case 'KeyP': this.push('menu', 'kb'); break;
        case 'Backspace': this.push('back', 'kb'); break;
        case 'Tab': case 'KeyI': this.push('inventory', 'kb'); break;
        case 'KeyM': this.push('map', 'kb'); break;
        case 'BracketLeft': this.push('hotPrev', 'kb'); break;
        case 'BracketRight': this.push('hotNext', 'kb'); break;
      }
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouse.left = false; this.touchUse = false; this.stick.id = null; this.stick.x = this.stick.y = 0; });

    // Mouse on the game canvas
    // Phones fire fake mouse events right after a tap; ignore those.
    const fakeMouse = () => performance.now() - this.lastTouch < 1200;
    const cv = document.getElementById('game');
    cv.addEventListener('mousemove', e => { if (fakeMouse()) return; this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.t = clock; this.mouse.over = true; this.setMode('kb'); });
    cv.addEventListener('mouseleave', () => { this.mouse.over = false; });
    cv.addEventListener('mousedown', e => {
      if (fakeMouse()) return;
      Sound.init(); this.setMode('kb');
      this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.t = clock; this.mouse.over = true;
      if (e.button === 0) { this.mouse.left = true; this.push('use', 'kb', { mouse: true }); }
      if (e.button === 2) this.push('interact', 'kb', { mouse: true });
    });
    addEventListener('mouseup', e => { if (e.button === 0) this.mouse.left = false; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      if (clock - this.wheelT < 0.06) return;
      this.wheelT = clock;
      this.push(e.deltaY > 0 ? 'hotNext' : 'hotPrev', 'kb');
    }, { passive: false });

    // Touch: anything touched switches to touch mode
    addEventListener('touchstart', () => { this.lastTouch = performance.now(); Sound.init(); this.setMode('touch'); }, { passive: true, capture: true });
    addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') { this.lastTouch = performance.now(); this.setMode('touch'); }
      else if (e.pointerType === 'mouse' && !fakeMouse()) this.setMode('kb');
      Sound.init();
    }, true);

    // Floating joystick
    const zone = document.getElementById('stick-zone'), base = document.getElementById('stick-base'), knob = document.getElementById('stick-knob');
    const R0 = 46;
    const place = (x, y) => { base.style.left = x + 'px'; base.style.top = y + 'px'; };
    const reset = () => { this.stick.id = null; this.stick.x = this.stick.y = 0; knob.style.transform = 'translate(-50%,-50%)'; base.classList.remove('on'); base.style.left = ''; base.style.top = ''; };
    zone.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (this.stick.id !== null) return;
      this.stick.id = e.pointerId; this.stick.ox = e.clientX; this.stick.oy = e.clientY;
      place(e.clientX, e.clientY); base.classList.add('on');
      try { zone.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    zone.addEventListener('pointermove', e => {
      if (e.pointerId !== this.stick.id) return;
      let dx = e.clientX - this.stick.ox, dy = e.clientY - this.stick.oy;
      const m = Math.hypot(dx, dy);
      if (m > R0) { dx *= R0 / m; dy *= R0 / m; }
      this.stick.x = dx / R0; this.stick.y = dy / R0;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });
    zone.addEventListener('pointerup', e => { if (e.pointerId === this.stick.id) reset(); });
    zone.addEventListener('pointercancel', e => { if (e.pointerId === this.stick.id) reset(); });

    // Touch buttons
    const btn = (id, down, up) => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('down'); down && down(); try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } });
      const end = () => { el.classList.remove('down'); up && up(); };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    };
    btn('tb-use', () => { this.touchUse = true; this.push('use', 'touch'); }, () => { this.touchUse = false; });
    btn('tb-act', () => this.push('interact', 'touch'));
    btn('tb-bag', () => this.push('inventory', 'touch'));
    btn('tb-atk', () => { this.touchAtk = true; this.push('attack', 'touch'); }, () => { this.touchAtk = false; });
    btn('tb-block', () => { this.touchBlock = true; }, () => { this.touchBlock = false; });
    btn('tb-roll', () => this.push('roll', 'touch'));
    btn('tb-map', () => this.push('map', 'touch'));
    document.getElementById('btn-pause').addEventListener('click', () => { if (playing && !UI.stack.length) openPause(); });

    addEventListener('gamepadconnected', e => { this.pad.connected = true; UI.toast(`Controller connected: ${e.gamepad.id.split('(')[0].trim() || 'Gamepad'}`); });
    addEventListener('gamepaddisconnected', () => {
      this.pad.connected = false; this.pad.ax = this.pad.ay = 0; this.pad.use = this.pad.attack = this.pad.block = this.pad.sprint = false;
      UI.toast('Controller disconnected');
      if (playing && !UI.stack.length) openPause();
    });
  },

  poll(dt) {
    this.pollPad(dt);
    let x = 0, y = 0;
    const k = this.keys;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) y -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
    if (x || y) { const m = Math.hypot(x, y); x /= m; y /= m; }
    if (this.stick.id !== null) { x += this.stick.x; y += this.stick.y; }
    x += this.pad.ax; y += this.pad.ay;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    this.moveX = x; this.moveY = y;
  },

  pollPad(dt) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) { this.pad.ax = this.pad.ay = 0; this.pad.use = this.pad.attack = this.pad.block = this.pad.sprint = false; this.pad.prev = []; return; }
    this.gp = gp;
    const b = gp.buttons.map(x => x.pressed || x.value > 0.5), prev = this.pad.prev;
    const rawX = gp.axes[0] || 0, rawY = gp.axes[1] || 0;
    if (b.some(v => v) || Math.abs(rawX) > 0.5 || Math.abs(rawY) > 0.5) this.setMode('pad');
    const edge = i => b[i] && !prev[i];
    if (edge(0)) this.push('interact', 'pad');
    if (edge(1)) this.push('back', 'pad');
    if (edge(2)) this.push('use', 'pad');
    if (edge(7)) this.push('attack', 'pad');
    if (edge(10)) this.pad.sprint = !this.pad.sprint;
    if (edge(3)) this.push('inventory', 'pad');
    if (edge(4)) this.push('hotPrev', 'pad');
    if (edge(5)) this.push('hotNext', 'pad');
    if (edge(8)) this.push('map', 'pad');
    if (edge(9)) this.push('menu', 'pad');
    this.pad.use = !!b[2]; this.pad.attack = !!b[7]; this.pad.block = !!b[6];

    let ax = rawX, ay = rawY;
    const m = Math.hypot(ax, ay), dz = 0.22;
    if (m < dz) { ax = ay = 0; } else { const k = Math.min(1, (m - dz) / (1 - dz)) / m; ax *= k; ay *= k; }
    if (b[12]) ay = -1; if (b[13]) ay = 1; if (b[14]) ax = -1; if (b[15]) ax = 1;
    this.pad.ax = ax; this.pad.ay = ay;
    if (Math.hypot(ax, ay) < 0.15) { this.pad.idleT += dt; if (this.pad.idleT > 0.4) this.pad.sprint = false; } else this.pad.idleT = 0;

    // Menu navigation with auto-repeat
    let nd = null;
    if (b[12] || rawY < -0.6) nd = 'up'; else if (b[13] || rawY > 0.6) nd = 'down';
    else if (b[14] || rawX < -0.6) nd = 'left'; else if (b[15] || rawX > 0.6) nd = 'right';
    if (nd) {
      if (nd !== this.pad.navDir) { this.pad.navDir = nd; this.pad.navT = 0.38; this.push(nd, 'pad'); }
      else { this.pad.navT -= dt; if (this.pad.navT <= 0) { this.pad.navT = 0.11; this.push(nd, 'pad'); } }
    } else this.pad.navDir = null;
    this.pad.prev = b;
  },

  rumble(strength = 0.5, ms = 80) {
    if (!Settings.rumble || this.mode !== 'pad' || !this.gp) return;
    const a = this.gp.vibrationActuator;
    if (a && a.playEffect) a.playEffect('dual-rumble', { duration: ms, strongMagnitude: strength, weakMagnitude: strength * 0.6 }).catch(() => {});
  },
};
