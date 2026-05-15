let ctx = null;
let bgmNodes = [];
let bgmGain = null;

export function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  bgmGain = ctx.createGain();
  bgmGain.connect(ctx.destination);
  bgmGain.gain.value = 0;
}

export function resumeAudio() {
  if (ctx?.state === 'suspended') ctx.resume();
}

// ─── BGM ──────────────────────────────────────────────────────────────────────

function stopAllBGM() {
  bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
  const nodes = [...bgmNodes];
  bgmNodes = [];
  setTimeout(() => nodes.forEach(n => { try { n.stop(); } catch {} }), 2000);
}

export function startNightBGM() {
  if (!ctx) initAudio();
  stopAllBGM();

  // Deep bass drone
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 55;
  const g1 = ctx.createGain();
  g1.gain.value = 0.12;
  osc1.connect(g1);
  g1.connect(bgmGain);
  osc1.start();
  bgmNodes.push(osc1);

  // Eerie pad
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = 82.4;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 150;
  filter.Q.value = 5;
  const g2 = ctx.createGain();
  g2.gain.value = 0.06;
  osc2.connect(filter);
  filter.connect(g2);
  g2.connect(bgmGain);
  osc2.start();
  bgmNodes.push(osc2);

  // Slow LFO on filter
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 80;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();
  bgmNodes.push(lfo);

  // Wind noise
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 300;
  noiseFilter.Q.value = 0.5;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.025;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(bgmGain);
  noise.start();
  bgmNodes.push(noise);

  bgmGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
}

export function startDayBGM() {
  if (!ctx) initAudio();
  stopAllBGM();

  // Brighter major chord
  [261.6, 329.6, 392.0].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 0.04 : 0.025;
    osc.connect(g);
    g.connect(bgmGain);
    osc.start();
    bgmNodes.push(osc);
  });

  bgmGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
}

export function stopBGM() {
  if (!ctx) return;
  stopAllBGM();
}

// ─── SFX ──────────────────────────────────────────────────────────────────────

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

