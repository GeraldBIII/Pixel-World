'use strict';
// ---------- Boot, resize, settings and the main loop ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  let sc = Math.max(1, Math.round(Math.sqrt((w * h) / (400 * 230))));
  if (Settings.zoom === 'far') sc = Math.max(1, sc - 1);
  if (Settings.zoom === 'close') sc += 1;
  SCALE = sc;
  VW = Math.ceil(w / sc); VH = Math.ceil(h / sc);
  canvas.width = VW; canvas.height = VH;
  canvas.style.width = VW * sc + 'px'; canvas.style.height = VH * sc + 'px';
  ctx.imageSmoothingEnabled = false;
  if (playing) snapCamera();
  UI.layout();
}
function updateTouchVisibility() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const on = Settings.touch === 'on' || (Settings.touch === 'auto' && (Input.mode === 'touch' || (coarse && Input.mode !== 'pad' && Input.mode !== 'kb')));
  const was = document.body.classList.contains('touch-on');
  document.body.classList.toggle('touch-on', on && playing);
  if (was !== (on && playing)) UI.layout();
}
function applySettings() { resize(); updateTouchVisibility(); Sound.applyVolumes(); }
function toggleFullscreen() {
  const d = document, el = d.documentElement;
  if (!d.fullscreenElement && !d.webkitFullscreenElement) {
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) { UI.toast('Fullscreen is not supported on this device. Try "Add to Home Screen".'); return; }
    const p = req.call(el);
    if (p && p.then) p.then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => UI.toast('Fullscreen was blocked by the browser.'));
  } else {
    const ex = d.exitFullscreen || d.webkitExitFullscreen;
    if (ex) ex.call(d);
  }
}

let last = performance.now();
function loop(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05);
  last = now;
  clock += dt;
  Input.poll(dt);
  const q = Input.q.splice(0);
  for (const e of q) { if (UI.stack.length) UI.handle(e); else Game.handle(e); }
  if (playing && !UI.blocking()) update(dt);
  else if (!playing) titleCamera();
  render();
  UI.updateHUD();
  requestAnimationFrame(loop);
}

function boot() {
  if (matchMedia('(pointer: coarse)').matches) Input.mode = 'touch';
  buildStatic();
  SEAS = buildSeason(0);
  genWorld();
  UI.init();
  Input.init();
  resize();
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (playing && !UI.stack.length) UI.openPause();
      if (Sound.ctx) Sound.ctx.suspend();
    } else if (Sound.ctx) Sound.ctx.resume();
  });
  addEventListener('pagehide', () => { if (playing) saveGame(); });
  UI.openTitle();
  requestAnimationFrame(loop);
}
boot();
