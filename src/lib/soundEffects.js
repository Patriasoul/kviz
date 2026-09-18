const STORAGE_KEY = "patriasoul_sound_enabled";

let audioContext = null;

function isEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function getSoundEnabled() {
  return isEnabled();
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {}
}

function getContext() {
  if (!isEnabled()) return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  audioContext ??= new AudioCtx();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function tone(frequency, duration, type = "sine", volume = 0.045, delay = 0) {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

export function playStart() {
  tone(523.25, 0.12, "sine", 0.035);
  tone(659.25, 0.18, "sine", 0.04, 0.09);
}

export function playSelect() {
  tone(440, 0.055, "sine", 0.025);
}

export function playCorrect() {
  tone(523.25, 0.09, "sine", 0.04);
  tone(659.25, 0.11, "sine", 0.045, 0.07);
  tone(783.99, 0.16, "sine", 0.05, 0.14);
}

export function playWrong() {
  tone(220, 0.16, "triangle", 0.045);
  tone(174.61, 0.20, "triangle", 0.035, 0.08);
}

export function playTick() {
  tone(880, 0.035, "sine", 0.018);
}

export function playFinish() {
  tone(392, 0.10, "sine", 0.04);
  tone(523.25, 0.12, "sine", 0.04, 0.09);
  tone(659.25, 0.20, "sine", 0.045, 0.19);
}

export function playResult() {
  tone(523.25, 0.10, "sine", 0.04);
  tone(659.25, 0.10, "sine", 0.04, 0.08);
  tone(783.99, 0.10, "sine", 0.045, 0.16);
  tone(1046.5, 0.22, "sine", 0.05, 0.24);
}
