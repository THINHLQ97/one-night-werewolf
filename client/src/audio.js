// ─── Audio system ─────────────────────────────────────────────────────────────
// MP3-based BGM & effects + synthesized micro-SFX

let ctx = null;
let initialized = false;
let currentBgm = null;
let fadeTimer = null;

const audioCache = {};

function getAudio(src) {
  if (!audioCache[src]) {
    audioCache[src] = new Audio(src);
    audioCache[src].preload = 'auto';
  }
  return audioCache[src];
}

export function initAudio() {
  if (initialized) return;
  initialized = true;
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  // Preload all MP3 files
  ['/audio/night-effect.mp3', '/audio/morning-effect.mp3',
   '/audio/night-bgm.mp3', '/audio/day-bgm.mp3',
   '/audio/win-effect.mp3', '/audio/lose-effect.mp3'].forEach(src => getAudio(src));
}

export function resumeAudio() {
  if (ctx?.state === 'suspended') ctx.resume();
  if (!initialized) initAudio();
}

// ─── Fade helpers ─────────────────────────────────────────────────────────────

function fadeOut(audio, duration = 1500) {
  return new Promise(resolve => {
    if (!audio || audio.paused) { resolve(); return; }
    clearInterval(fadeTimer);
    const startVol = audio.volume;
    const steps = Math.max(1, duration / 50);
    const dec = startVol / steps;
    fadeTimer = setInterval(() => {
      if (audio.volume > dec + 0.001) {
        audio.volume = Math.max(0, audio.volume - dec);
      } else {
        clearInterval(fadeTimer);
        fadeTimer = null;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = startVol;
        resolve();
      }
    }, 50);
  });
}

function fadeIn(audio, targetVol, duration = 2000) {
  audio.volume = 0;
  audio.play().catch(() => {});
  const steps = Math.max(1, duration / 50);
  const inc = targetVol / steps;
  const timer = setInterval(() => {
    if (audio.volume < targetVol - inc) {
      audio.volume = Math.min(targetVol, audio.volume + inc);
    } else {
      audio.volume = targetVol;
      clearInterval(timer);
    }
  }, 50);
}

function playEffect(src, volume = 0.5) {
  const audio = getAudio(src);
  audio.currentTime = 0;
  audio.volume = volume;
  audio.play().catch(() => {});
}

// ─── BGM ──────────────────────────────────────────────────────────────────────

export function startNightBGM() {
  if (!initialized) initAudio();
  const start = () => {
    playEffect('/audio/night-effect.mp3', 0.6);
    setTimeout(() => {
      const bgm = getAudio('/audio/night-bgm.mp3');
      bgm.loop = true;
      currentBgm = bgm;
      fadeIn(bgm, 0.25, 2000);
    }, 1000);
  };
  if (currentBgm && !currentBgm.paused) {
    fadeOut(currentBgm, 1000).then(start);
  } else {
    start();
  }
}

export function startDayBGM() {
  if (!initialized) initAudio();
  const start = () => {
    playEffect('/audio/morning-effect.mp3', 0.6);
    setTimeout(() => {
      const bgm = getAudio('/audio/day-bgm.mp3');
      bgm.loop = true;
      currentBgm = bgm;
      fadeIn(bgm, 0.25, 2000);
    }, 1000);
  };
  if (currentBgm && !currentBgm.paused) {
    fadeOut(currentBgm, 1000).then(start);
  } else {
    start();
  }
}

export function stopBGM() {
  if (currentBgm && !currentBgm.paused) {
    fadeOut(currentBgm, 1500).then(() => { currentBgm = null; });
  } else {
    currentBgm = null;
  }
}

// ─── SFX (MP3-based) ─────────────────────────────────────────────────────────

export function sfxWin() {
  playEffect('/audio/win-effect.mp3', 0.5);
}

export function sfxLose() {
  playEffect('/audio/lose-effect.mp3', 0.5);
}

// ─── SFX (synthesized — small UI sounds) ──────────────────────────────────────

function playTone(freq, duration, type = 'sine', vol = 0.15) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = vol;
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function sfxCardFlip() {
  playTone(800, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(1200, 0.06, 'sine', 0.08), 50);
}

export function sfxReveal() {
  playTone(523, 0.15, 'sine', 0.1);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.1), 100);
  setTimeout(() => playTone(784, 0.2, 'sine', 0.12), 200);
}

export function sfxVote() {
  playTone(440, 0.1, 'triangle', 0.12);
}

export function sfxGameOver() {
  // Legacy — prefer sfxWin/sfxLose
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, 'sine', 0.1), i * 150);
  });
}

export function sfxWolfHowl() {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.8);
  osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 1.5);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
  osc.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 2);
}
