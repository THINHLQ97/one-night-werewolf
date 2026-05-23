// ─── Audio system ─────────────────────────────────────────────────────────────
// MP3-based BGM & effects + synthesized micro-SFX

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
  // Preload all MP3 files
  ['/audio/night-effect.mp3', '/audio/morning-effect.mp3',
   '/audio/night-bgm.mp3', '/audio/day-bgm.mp3',
   '/audio/win-effect.mp3', '/audio/lose-effect.mp3'].forEach(src => getAudio(src));
}

export function resumeAudio() {
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
  const adjustedTarget = targetVol * bgmVolumeMaster;
  audio.volume = 0;
  audio.play().catch(() => {});
  const steps = Math.max(1, duration / 50);
  const inc = adjustedTarget / steps;
  const timer = setInterval(() => {
    if (audio.volume < adjustedTarget - inc) {
      audio.volume = Math.min(adjustedTarget, audio.volume + inc);
    } else {
      audio.volume = adjustedTarget;
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

// ─── BGM volume control ─────────────────────────────────────────────────────

let bgmVolumeMaster = 1.0; // 0..1 multiplier for BGM volume

export function setBgmVolume(vol) {
  bgmVolumeMaster = Math.max(0, Math.min(1, vol));
  if (currentBgm && !currentBgm.paused) {
    currentBgm.volume = 0.25 * bgmVolumeMaster;
  }
}

export function getBgmVolume() {
  return bgmVolumeMaster;
}

// ─── SFX (stubs — no more synthesized sounds) ────────────────────────────────
// All synthesized oscillator sounds removed. These are now no-ops or silent.
// Only MP3-based audio is used.

export function sfxCardFlip() { /* silent */ }
export function sfxReveal() { /* silent */ }
export function sfxVote() { /* silent */ }
export function sfxWolfHowl() { /* silent */ }
