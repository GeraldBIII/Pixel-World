'use strict';
// Synthesized sound effects and a gentle generative soundtrack (no audio files needed).
const Sound = {
  ctx: null, sfxG: null, musG: null, noiseBuf: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const master = this.ctx.createGain(); master.connect(this.ctx.destination);
    this.sfxG = this.ctx.createGain(); this.sfxG.connect(master);
    this.musG = this.ctx.createGain(); this.musG.connect(master);
    const n = this.ctx.sampleRate, b = this.ctx.createBuffer(1, n, n), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
    this.applyVolumes();
    Music.start();
  },
  applyVolumes() {
    if (!this.ctx) return;
    this.sfxG.gain.value = (Settings.sfx / 100) * 0.55;
    this.musG.gain.value = (Settings.music / 100) * 0.3;
  },
  tone(f, d, type = 'square', v = 0.3, f2 = null, delay = 0, out = null) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(out || this.sfxG); o.start(t); o.stop(t + d + 0.05);
  },
  noise(d, v = 0.3, freq = 1200, type = 'lowpass', delay = 0) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.sfxG); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05);
  },
  play(name) {
    if (!this.ctx || Settings.sfx <= 0) return;
    switch (name) {
      case 'hoe': this.noise(0.12, 0.45, 600); this.tone(110, 0.08, 'triangle', 0.2); break;
      case 'water': this.noise(0.28, 0.25, 2600, 'bandpass'); break;
      case 'chop': this.tone(180, 0.09, 'square', 0.12, 90); this.noise(0.08, 0.3, 900); break;
      case 'pick': this.tone(900, 0.06, 'square', 0.1, 650); this.noise(0.05, 0.2, 3000, 'highpass'); break;
      case 'swing': this.noise(0.12, 0.22, 1800, 'bandpass'); break;
      case 'clink': this.tone(1200, 0.05, 'square', 0.06, 1000); break;
      case 'hit': this.tone(240, 0.1, 'sawtooth', 0.16, 110); break;
      case 'break': this.noise(0.25, 0.35, 700); this.tone(140, 0.15, 'triangle', 0.15, 70); break;
      case 'plant': this.tone(520, 0.06, 'sine', 0.2, 760); break;
      case 'harvest': this.tone(660, 0.08, 'square', 0.1); this.tone(990, 0.1, 'square', 0.1, null, 0.07); break;
      case 'pickup': this.tone(880, 0.05, 'sine', 0.16, 1320); break;
      case 'coin': this.tone(1320, 0.06, 'square', 0.08); this.tone(1760, 0.12, 'square', 0.08, null, 0.06); break;
      case 'hurt': this.tone(320, 0.22, 'sawtooth', 0.2, 80); break;
      case 'move': this.tone(660, 0.03, 'square', 0.04); break;
      case 'ok': this.tone(880, 0.05, 'square', 0.06); break;
      case 'error': this.tone(200, 0.12, 'square', 0.08, 150); break;
      case 'blip': this.tone(480 + Math.random() * 120, 0.03, 'square', 0.035); break;
      case 'quest': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'square', 0.08, null, i * 0.09)); break;
      case 'sleep': [784, 659, 523, 392].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.15, null, i * 0.15)); break;
      case 'eat': [0, 0.08, 0.16].forEach(t => this.noise(0.05, 0.25, 1500, 'bandpass', t)); break;
      case 'magic': [523, 784, 1046, 1318, 1568].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.1, null, i * 0.07)); break;
      case 'slime': this.tone(200, 0.12, 'sine', 0.12, 420); break;
      case 'kill': this.noise(0.2, 0.25, 1200); this.tone(500, 0.15, 'square', 0.08, 120); break;
      case 'howl': this.tone(330, 0.5, 'sine', 0.09, 560); this.tone(560, 0.9, 'sine', 0.09, 360, 0.45); break;
      case 'roll': this.noise(0.22, 0.25, 500, 'lowpass'); this.tone(160, 0.15, 'triangle', 0.08, 90); break;
      case 'block': this.tone(1100, 0.08, 'square', 0.08, 700); this.noise(0.1, 0.25, 3500, 'highpass'); break;
      case 'crit': this.tone(260, 0.12, 'sawtooth', 0.18, 90); this.tone(1400, 0.08, 'square', 0.06, null, 0.02); break;
      case 'equip': this.noise(0.08, 0.2, 2000, 'bandpass'); this.tone(700, 0.06, 'square', 0.05, null, 0.05); break;
      case 'levelup': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.25, 'square', 0.08, null, i * 0.08)); break;
      case 'ship': this.noise(0.1, 0.3, 500); this.tone(330, 0.1, 'triangle', 0.15, null, 0.05); break;
    }
  },
};

const Music = {
  timer: null, next: 0, step: 0, mi: 4,
  start() {
    if (this.timer || !Sound.ctx) return;
    this.next = Sound.ctx.currentTime + 0.3;
    this.timer = setInterval(() => this.tick(), 120);
  },
  night() { return S && playing && (S.time >= 20 * 60 || S.time < 6 * 60); },
  tick() {
    const c = Sound.ctx;
    if (!c || c.state !== 'running') return;
    if (this.next < c.currentTime) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.5) {
      const night = this.night();
      if (Settings.music > 0) this.note(this.step, this.next, night);
      this.next += night ? 0.5 : 0.36;
      this.step++;
    }
  },
  note(s, t, night) {
    const scale = night ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9];
    const base = night ? 57 : 60;
    const prog = night ? [0, -4, 5, -2] : [0, -3, 5, -5];
    const bar = Math.floor(s / 8) % 4, root = base + prog[bar];
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    const play = (m, d, type, v, at) => {
      const o = Sound.ctx.createOscillator(), g = Sound.ctx.createGain();
      o.type = type; o.frequency.value = hz(m);
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, at + d);
      o.connect(g); g.connect(Sound.musG); o.start(at); o.stop(at + d + 0.05);
    };
    if (s % 8 === 0) {
      play(root - 12, 2.6, 'sine', 0.22, t);
      play(root, 2.4, 'triangle', 0.06, t); play(root + (night ? 3 : 4), 2.4, 'triangle', 0.05, t); play(root + 7, 2.4, 'triangle', 0.05, t);
    }
    if (s % 8 === 4) play(root - 5, 1.2, 'sine', 0.12, t);
    if (Math.random() < (night ? 0.42 : 0.55)) {
      this.mi = clamp(this.mi + Math.floor(Math.random() * 5) - 2, 0, 9);
      const m = base + 12 + scale[this.mi % 5] + Math.floor(this.mi / 5) * 12 - 12;
      play(m, night ? 0.9 : 0.5, night ? 'sine' : 'triangle', 0.09, t);
    }
  },
};
