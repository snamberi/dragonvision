// Chiptune music and effects synthesized with Web Audio, so there are no sound files to load.

export type Sfx = 'hit' | 'crit' | 'special' | 'heal' | 'summon' | 'click' | 'win' | 'lose' | 'buy';
export type Track = 'city' | 'battle' | null;

const KEY = 'dragonvision.sound';

interface Settings {
  music: boolean;
  sfx: boolean;
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { music: true, sfx: true, ...JSON.parse(raw) };
  } catch {
    // Defaults below.
  }
  return { music: true, sfx: true };
}

let settings = loadSettings();
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let current: Track = null;
let wanted: Track = null;
let loopTimer: ReturnType<typeof setTimeout> | null = null;

export function soundSettings(): Settings {
  return settings;
}

export function setSoundSettings(next: Partial<Settings>): void {
  settings = { ...settings, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Not remembered; still applies now.
  }
  if (!settings.music) stopMusic();
  else if (wanted) playMusic(wanted);
}

/** Browsers only allow audio after a tap or click, so the context starts lazily. */
function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, length: number, type: OscillatorType, volume = 1, slideTo?: number): void {
  const c = audio();
  if (!c || !master) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + length);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

function noise(start: number, length: number, volume = 0.6): void {
  const c = audio();
  if (!c || !master) return;
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * length), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  const gain = c.createGain();
  gain.gain.value = volume;
  src.buffer = buffer;
  src.connect(gain).connect(master);
  src.start(start);
}

export function sfx(name: Sfx): void {
  if (!settings.sfx) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  switch (name) {
    case 'hit':
      noise(t, 0.08, 0.5);
      tone(180, t, 0.08, 'square', 0.4, 90);
      break;
    case 'crit':
      noise(t, 0.12, 0.7);
      tone(320, t, 0.14, 'square', 0.5, 120);
      break;
    case 'special':
      tone(220, t, 0.45, 'sawtooth', 0.35, 880);
      noise(t + 0.3, 0.2, 0.5);
      break;
    case 'heal':
      [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.07, 0.2, 'triangle', 0.5));
      break;
    case 'summon':
      [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.3, 'square', 0.3));
      break;
    case 'click':
      tone(660, t, 0.04, 'square', 0.25);
      break;
    case 'buy':
      tone(988, t, 0.06, 'square', 0.3);
      tone(1319, t + 0.07, 0.12, 'square', 0.3);
      break;
    case 'win':
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.18, 'square', 0.35));
      break;
    case 'lose':
      [392, 349, 311, 262].forEach((f, i) => tone(f, t + i * 0.18, 0.25, 'triangle', 0.45));
      break;
  }
}

// Two short loops: a calm city theme and a driving battle theme (MIDI note numbers, 0 = rest).
const SONGS: Record<'city' | 'battle', { tempo: number; lead: number[]; bass: number[] }> = {
  city: {
    tempo: 0.28,
    lead: [72, 74, 76, 79, 76, 74, 72, 0, 69, 71, 72, 74, 72, 71, 69, 0, 67, 69, 72, 74, 76, 74, 72, 69, 71, 72, 74, 71, 72, 0, 0, 0],
    bass: [48, 0, 55, 0, 45, 0, 52, 0, 41, 0, 48, 0, 43, 0, 50, 0],
  },
  battle: {
    tempo: 0.15,
    lead: [69, 69, 72, 69, 74, 69, 76, 74, 72, 72, 76, 72, 77, 76, 74, 72, 69, 69, 72, 69, 74, 69, 79, 77, 76, 74, 72, 74, 76, 0, 76, 0],
    bass: [45, 45, 45, 45, 41, 41, 41, 41, 43, 43, 43, 43, 40, 40, 44, 44],
  },
};

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function scheduleLoop(track: 'city' | 'battle'): void {
  const c = audio();
  if (!c) return;
  const song = SONGS[track];
  const start = c.currentTime + 0.05;
  song.lead.forEach((n, i) => n && tone(midi(n), start + i * song.tempo, song.tempo * 0.9, 'square', 0.22));
  song.bass.forEach((n, i) => n && tone(midi(n), start + i * song.tempo * 2, song.tempo * 1.8, 'triangle', 0.35));
  const length = song.lead.length * song.tempo * 1000;
  loopTimer = setTimeout(() => current === track && scheduleLoop(track), length - 30);
}

export function playMusic(track: Track): void {
  wanted = track;
  if (!settings.music || track === current) return;
  stopMusic();
  // Until the first tap the audio context is paused; unlockAudio starts the music then.
  if (!ctx || ctx.state !== 'running') return;
  current = track;
  if (track) scheduleLoop(track);
}

/** Call on the first tap or click: browsers only allow sound after a user gesture. */
export function unlockAudio(): void {
  const c = audio();
  if (!c) return;
  void c.resume().then(() => {
    if (settings.music && wanted && current !== wanted) {
      current = null;
      playMusic(wanted);
    }
  });
}

export function stopMusic(): void {
  current = null;
  if (loopTimer) clearTimeout(loopTimer);
  loopTimer = null;
}
