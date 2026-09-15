let audioContext = null;
let musicTimer = null;
let musicGain = null;
let musicRunning = false;
let entrancePlayed = false;

const STORAGE_KEY = "patriasoul-audio-enabled";

function getEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function isAudioEnabled() {
  return getEnabled();
}

export function setAudioEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {}
  if (!enabled) stopMusic();
}

function ensureContext() {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioContext = new AudioContext();
  }
  return audioContext;
}

async function resumeContext() {
  const ctx = ensureContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}

function tone({ frequency, duration = 0.12, type = "sine", volume = 0.035, delay = 0, slideTo }) {
  const ctx = audioContext;
  if (!ctx || !getEnabled()) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  const end = start + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, end);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.02, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.03);
}

export async function startAudio() {
  if (!getEnabled()) return false;
  const ctx = await resumeContext();
  if (!ctx) return false;
  if (!entrancePlayed) {
    playEntrance();
    entrancePlayed = true;
  }
  startMusic();
  return true;
}

export async function startMusic() {
  if (musicRunning || !getEnabled()) return;
  const ctx = await resumeContext();
  if (!ctx) return;

  musicRunning = true;
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.008;
  musicGain.connect(ctx.destination);

  // Fallback ambient motif until licensed MP3 themes are supplied.
  const notes = [196, 246.94, 293.66, 392, 293.66, 246.94, 220, 261.63];
  let step = 0;

  const playStep = () => {
    if (!musicRunning || !getEnabled()) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const note = notes[step % notes.length];

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
    oscillator.connect(gain);
    gain.connect(musicGain);
    oscillator.start(now);
    oscillator.stop(now + 1.8);
    step += 1;
    musicTimer = window.setTimeout(playStep, 1500);
  };

  playStep();
}

export function stopMusic() {
  musicRunning = false;
  if (musicTimer) {
    window.clearTimeout(musicTimer);
    musicTimer = null;
  }
  if (musicGain && audioContext) {
    const gain = musicGain;
    const now = audioContext.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, 0.08);
    window.setTimeout(() => gain.disconnect(), 300);
  }
  musicGain = null;
}

export function playEntrance() {
  tone({ frequency: 261.63, duration: 0.22, type: "sine", volume: 0.04 });
  tone({ frequency: 329.63, duration: 0.26, type: "sine", volume: 0.035, delay: 0.1 });
  tone({ frequency: 392, duration: 0.42, type: "sine", volume: 0.045, delay: 0.2 });
}

export function playCorrect() {
  tone({ frequency: 523.25, duration: 0.09, type: "triangle", volume: 0.045 });
  tone({ frequency: 659.25, duration: 0.15, type: "triangle", volume: 0.04, delay: 0.07 });
  tone({ frequency: 783.99, duration: 0.18, type: "triangle", volume: 0.035, delay: 0.14 });
}

export function playWrong() {
  tone({ frequency: 220, duration: 0.12, type: "sawtooth", volume: 0.022, slideTo: 180 });
  tone({ frequency: 164.81, duration: 0.2, type: "sawtooth", volume: 0.02, delay: 0.1, slideTo: 130 });
}

export function playTimeout() {
  tone({ frequency: 196, duration: 0.1, type: "square", volume: 0.018 });
  tone({ frequency: 146.83, duration: 0.18, type: "square", volume: 0.018, delay: 0.12 });
  tone({ frequency: 110, duration: 0.22, type: "square", volume: 0.016, delay: 0.25 });
}

export function playFinish() {
  [392, 523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    tone({ frequency, duration: 0.22, type: "triangle", volume: 0.04, delay: index * 0.1 });
  });
}

export function playLevelUp() {
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    tone({ frequency, duration: 0.24, type: "triangle", volume: 0.05, delay: index * 0.12 });
  });
}

export function playBadge() {
  tone({ frequency: 659.25, duration: 0.12, type: "sine", volume: 0.045 });
  tone({ frequency: 783.99, duration: 0.16, type: "sine", volume: 0.045, delay: 0.1 });
  tone({ frequency: 1046.5, duration: 0.3, type: "sine", volume: 0.05, delay: 0.2 });
}

export function playCountdownTick(finalTick = false) {
  tone({
    frequency: finalTick ? 880 : 660,
    duration: finalTick ? 0.16 : 0.08,
    type: finalTick ? "square" : "triangle",
    volume: finalTick ? 0.035 : 0.018,
  });
}
