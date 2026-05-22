// ─── Audio system ─────────────────────────────────────────────────────────────
// MP3-based BGM & effects + synthesized micro-SFX

let ctx = null;
let initialized = false;
let currentBgm = null;
let bgmFadeTimer = null;

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
    const startVol = audio.volume;
    const steps = Math.max(1, duration / 50);
    const dec = startVol / steps;
    const timer = setInterval(() => {
      if (audio.volume > dec + 0.001) {
        audio.volume = Math.max(0, audio.volume - dec);
      } else {
        clearInterval(timer);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = startVol;
        resolve();
      }
    }, 50);
    // Return timer ID so caller can cancel if needed
    audio._fadeTimer = timer;
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
  audio._fadeTimer = timer;
}

function playEffect(src, volume = 0.5) {
  // Effects get their own Audio instance to avoid conflicts with cached BGM
  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(() => {});
  // Auto cleanup
  audio.addEventListener('ended', () => { audio.src = ''; });
}

// Force-stop any currently playing BGM immediately
function killCurrentBgm() {
  if (currentBgm) {
    if (currentBgm._fadeTimer) clearInterval(currentBgm._fadeTimer);
    try {
      currentBgm.pause();
      currentBgm.currentTime = 0;
    } catch {}
    currentBgm = null;
  }
  if (bgmFadeTimer) {
    clearTimeout(bgmFadeTimer);
    bgmFadeTimer = null;
  }
}

// ─── BGM ──────────────────────────────────────────────────────────────────────

export function startNightBGM() {
  if (!initialized) initAudio();
  // Kill any existing BGM immediately to avoid overlap
  killCurrentBgm();
  playEffect('/audio/night-effect.mp3', 0.6);
  bgmFadeTimer = setTimeout(() => {
    const bgm = getAudio('/audio/night-bgm.mp3');
    bgm.currentTime = 0;
    bgm.loop = true;
    currentBgm = bgm;
    fadeIn(bgm, 0.25, 2000);
  }, 1000);
}

export function startDayBGM() {
  if (!initialized) initAudio();
  killCurrentBgm();
  playEffect('/audio/morning-effect.mp3', 0.6);
  bgmFadeTimer = setTimeout(() => {
    const bgm = getAudio('/audio/day-bgm.mp3');
    bgm.currentTime = 0;
    bgm.loop = true;
    currentBgm = bgm;
    fadeIn(bgm, 0.25, 2000);
  }, 1000);
}

export function stopBGM() {
  if (bgmFadeTimer) {
    clearTimeout(bgmFadeTimer);
    bgmFadeTimer = null;
  }
  if (currentBgm && !currentBgm.paused) {
    const dying = currentBgm;
    currentBgm = null;
    fadeOut(dying, 1500);
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
